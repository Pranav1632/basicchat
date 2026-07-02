"use client";

import { useState } from "react";

interface Props {
  onSend: (message: string) => void;
}

export default function ChatInput({
  onSend,
}: Props) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    onSend(input);
    setInput("");
  };

  return (
    <div className="border-t p-4 flex gap-2">
      <input
        className="flex-1 border rounded-lg px-4 py-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSend();
          }
        }}
      />

      <button
        onClick={handleSend}
        className="bg-black text-white px-5 rounded-lg"
      >
        Send
      </button>
    </div>
  );
}