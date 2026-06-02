"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useMutation } from "@tanstack/react-query";
import { createTopic } from "@/app/actions";

const TopicCreator = () => {
  const [input, setInput] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { mutate, isPending } = useMutation({
    mutationFn: createTopic,
    onError: (error) => {
      setError(error instanceof Error ? error.message : "Failed to create topic");
    },
  });

  const handleCreateTopic = () => {
    setError("");
    mutate({ topicName: input });
  };

  return (
    <div className="mt-12 flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          className="bg-white min-w-64"
          placeholder="Enter topic here..."
          value={input}
          onChange={({ target }) => setInput(target.value)}
        />
        <Button
          disabled={isPending || !input.trim()}
          onClick={handleCreateTopic}
        >
          {isPending ? "Creating..." : "Create"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default TopicCreator;
