"use client";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { useEffect, useState } from "react";
import { Wordcloud } from "@visx/wordcloud";
import { scaleLog } from "@visx/scale";
import { Text } from "@visx/text";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { submitComment } from "../actions";
import { io } from "socket.io-client";

const socket = io(
  "http://chatter-box-kbx3-bt086cm0i-sodha-manoharsinhs-projects.vercel.app"
);

interface WordData {
  text: string;
  value: number;
}

interface ClientPageProps {
  topicName: string;
  initialData: WordData[];
}

const COLORS = ["#143059", "#2F6B9A", "#82a6c2"];

const ClientPage: React.FC<ClientPageProps> = ({ topicName, initialData }) => {
  const [words, setWords] = useState<WordData[]>(initialData);
  const [input, setInput] = useState<string>("");

  console.log(initialData);
  console.log(words);

  useEffect(() => {
    socket.emit("join-room", `room:${topicName}`);
  }, [topicName]);

  useEffect(() => {
    const handleRoomUpdate = (message: string) => {
      console.log("room-update-called", message);
      const data: WordData[] = JSON.parse(message);

      setWords((prevWords) => {
        const updatedWords = prevWords.slice(); // Copy previous words

        data.forEach((newWord) => {
          const existingWord = updatedWords.find(
            (word) => word.text === newWord.text
          );

          if (existingWord) {
            // Increment the value of the existing word
            existingWord.value += newWord.value;
          } else if (updatedWords.length < 50) {
            // Add the new word if the limit is not exceeded
            updatedWords.push(newWord);
          }
        });

        return updatedWords;
      });
    };

    socket.on("room-update", handleRoomUpdate);

    return () => {
      socket.off("room-update", handleRoomUpdate);
    };
  }, [words, initialData]);

  const fontScale = scaleLog({
    domain: [
      Math.min(...words.map((w) => w.value)),
      Math.max(...words.map((w) => w.value)),
    ],
    range: [10, 100],
  });

  const { mutate, isPending } = useMutation({
    mutationFn: submitComment,
  });

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen bg-grid-zinc-50 pb-20">
      <MaxWidthWrapper className="flex flex-col items-center gap-6 pt-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-center tracking-tight text-balance">
          What people think about{" "}
          <span className="text-blue-600">{topicName}</span>:
        </h1>

        <p className="text-sm">(updated in real-time)</p>

        <div className="aspect-square max-w-xl flex items-center justify-center">
          <Wordcloud<WordData>
            words={words}
            width={500}
            height={500}
            fontSize={(data: WordData) => fontScale(data.value)}
            font={"Impact"}
            padding={2}
            spiral="archimedean"
            rotate={0}
            random={() => 0.5}
          >
            {(cloudWords: any[]) =>
              cloudWords.map((w, i) => (
                <Text
                  key={w.text}
                  fill={COLORS[i % COLORS.length]}
                  textAnchor="middle"
                  transform={`translate(${w.x}, ${w.y})`}
                  fontSize={w.size}
                  fontFamily={w.font}
                >
                  {w.text}
                </Text>
              ))
            }
          </Wordcloud>
        </div>

        <div className="max-w-lg w-full">
          <Label className="font-semibold tracking-tight text-lg pb-2">
            Here&apos;s what I think about {topicName}
          </Label>
          <div className="mt-1 flex gap-2 items-center">
            <Input
              value={input}
              onChange={({ target }) => setInput(target.value)}
              placeholder={`${topicName} is absolutely...`}
            />
            <Button
              disabled={isPending}
              onClick={() => mutate({ comment: input, topicName })}
            >
              Share
            </Button>
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
};

export default ClientPage;
