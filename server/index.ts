import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { Redis } from "ioredis";
import "dotenv/config";

const app = express();
app.use(cors());

// console.log("URL:", process.env.UPSTASH_REDIS_REST_URL);
// console.log("Token:", process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = new Redis(process.env.REDIS_CONNECTION_STRING);
const subRedis = new Redis(process.env.REDIS_CONNECTION_STRING);

// Simple rate limiting using Redis
const checkRateLimit = async (
  key: string,
  limit: number = 30,
  windowMs: number = 60000
): Promise<boolean> => {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.pexpire(key, windowMs);
    }
    return current <= limit;
  } catch (error) {
    console.error("Rate limit check error:", error);
    return true; // Allow on error
  }
};

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

subRedis.on("message", (channel, message) => {
  io.to(channel).emit("room-update", message);
});

subRedis.on("error", (err) => {
  console.error("Redis subscription error", err);
});

io.on("connection", async (socket) => {
  const { id } = socket;

  socket.on("join-room", async (room: string) => {
    try {
      // Validate room parameter
      if (!room || typeof room !== "string" || !room.startsWith("room:")) {
        socket.emit("error", { message: "Invalid room" });
        return;
      }
      if (room.length > 100) {
        socket.emit("error", { message: "Room name too long" });
        return;
      }

      // Rate limiting - 30 requests per minute per socket
      const isAllowed = await checkRateLimit(`ratelimit:${socket.id}`, 30, 60000);
      if (!isAllowed) {
        socket.emit("error", { message: "Rate limit exceeded" });
        return;
      }

      console.log("User joined room:", room);

      const subscribedRooms = await redis.smembers("subscribed-rooms");
      await socket.join(room);
      await redis.sadd(`rooms:${id}`, room);
      await redis.hincrby("room-connections", room, 1);

      if (!subscribedRooms.includes(room)) {
        subRedis.subscribe(room, async (err) => {
          if (err) {
            console.error("Failed to subscribe:", err);
          } else {
            await redis.sadd("subscribed-rooms", room);
            console.log("Subscribed to room:", room);
          }
        });
      }

      socket.emit("joined-room", { room, status: "success" });
    } catch (error) {
      console.error("Error in join-room handler:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  socket.on("disconnect", async () => {
    try {
      const { id } = socket;

      const joinedRooms = await redis.smembers(`rooms:${id}`);
      await redis.del(`rooms:${id}`);

      // Wait for all disconnect operations to complete
      await Promise.all(
        joinedRooms.map(async (room) => {
          try {
            const remainingConnections = await redis.hincrby(
              "room-connections",
              room,
              -1
            );

            if (remainingConnections <= 0) {
              await redis.hdel("room-connections", room);

              // Promisify unsubscribe
              await new Promise<void>((resolve, reject) => {
                subRedis.unsubscribe(room, (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              });

              await redis.srem("subscribed-rooms", room);
              console.log("Unsubscribed from room:", room);
            }
          } catch (error) {
            console.error("Error handling disconnect for room:", room, error);
          }
        })
      );
    } catch (error) {
      console.error("Error in disconnect handler:", error);
    }
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
