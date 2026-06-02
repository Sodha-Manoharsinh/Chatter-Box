"use server";

import { redis } from "@/lib/redis";
import { redirect } from "next/navigation";

export const createTopic = async ({ topicName }: { topicName: string }) => {
  const regex = /^[a-zA-Z-]+$/;

  if (!topicName || topicName.length > 50) {
    return { error: "Name must be between 1 and 50 characters" };
  }

  if (!regex.test(topicName)) {
    return { error: "Only letters and hyphens are allowed in name" };
  }

  await redis.sadd("existing-topic", topicName);

  redirect(`/${topicName}`);
};

function wordFreq(text: string): { text: string; value: number }[] {
  const words: string[] = text.replace(/\./g, "").split(/\s/);
  const freqMap: Record<string, number> = {};

  for (const w of words) {
    if (!freqMap[w]) freqMap[w] = 0;
    freqMap[w] += 1;
  }
  return Object.keys(freqMap).map((word) => ({
    text: word,
    value: freqMap[word],
  }));
}

export const submitComment = async ({
  comment,
  topicName,
}: {
  comment: string;
  topicName: string;
}) => {
  // Validate input
  if (!comment || comment.trim().length === 0) {
    return { error: "Comment cannot be empty" };
  }
  if (comment.length > 500) {
    return { error: "Comment must be less than 500 characters" };
  }
  if (!topicName || typeof topicName !== "string" || topicName.length > 50) {
    return { error: "Invalid topic name" };
  }

  try {
    // Verify topic exists
    const topicExists = await redis.sismember("existing-topic", topicName);
    if (!topicExists) {
      return { error: "Topic does not exist" };
    }

    const words = wordFreq(comment);

    await Promise.all(
      words.map(async (word) => {
        await redis.zadd(
          `room:${topicName}`,
          { incr: true },
          { member: word.text, score: word.value }
        );
      })
    );
    await redis.incr("served-requests");

    await redis.publish(`room:${topicName}`, JSON.stringify(words));

    return { success: true };
  } catch (error) {
    console.error("Error submitting comment:", error);
    return { error: "Failed to submit comment" };
  }
};
