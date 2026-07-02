"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="chat-input-bar">
      <div className="chat-input-wrapper">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something…"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="chat-send-btn"
          id="chat-send-btn"
        >
          <Send size={18} />
        </button>
      </div>
      <p className="chat-input-hint">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
