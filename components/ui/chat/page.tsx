"use client";

import { useState } from "react";
import { Message } from "@/lib/types";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your RAG + LangGraph assistant.",
    },
  ]);

const sendMessage = async (content: string) => {
  const userMessage: Message = {
    id: crypto.randomUUID(),
    role: "user",
    content,
  };

  setMessages((prev) => [...prev, userMessage]);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: content,
      }),
    });

    const data = await res.json();

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: data.response,
    };

    setMessages((prev) => [...prev, assistantMessage]);
  } catch {
    const errorMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Failed to connect to server.",
    };

    setMessages((prev) => [...prev, errorMessage]);
  }
};

  return (
    <main className="h-screen flex flex-col">
      <div className="border-b p-4 text-xl font-bold">
        LangGraph Chat
      </div>

      <ChatWindow messages={messages} />

      <ChatInput onSend={sendMessage} />
    </main>
  );
}