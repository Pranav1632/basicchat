"use client";

import { useChat } from "ai/react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchChatMessages } from "@/actions/chat";
import {
  Send,
  Square,
  Bot,
  User,
  Zap,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";
import TypingIndicator from "@/components/chat/TypingIndicator";
import Link from "next/link";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const initialChatId = searchParams?.get("id") || "";
  const agentId = searchParams?.get("agentId") || "";
  
  const [activeProvider, setActiveProvider] = useState<string>("gemini-2.5-flash");
  const [chatId, setChatId] = useState<string>(initialChatId);
  const [isInitializing, setIsInitializing] = useState(!!initialChatId);

  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    error,
  } = useChat({
    api: "/api/chat",
    body: { chatId, agentId },
    onResponse(response) {
      const provider = response.headers.get("X-AI-Provider");
      if (provider) {
        setActiveProvider(provider);
      }
      const newChatId = response.headers.get("X-Chat-Id");
      if (newChatId && newChatId !== chatId) {
        setChatId(newChatId);
        window.history.replaceState(null, "", `/chat?id=${newChatId}`);
      }
    },
  });

  // Load initial messages if opening an existing chat
  useEffect(() => {
    if (initialChatId) {
      fetchChatMessages(initialChatId)
        .then((dbMessages) => {
          setMessages(
            dbMessages.map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
        })
        .catch(console.error)
        .finally(() => setIsInitializing(false));
    }
  }, [initialChatId, setMessages]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Bot size={22} />
            <span>AgentA</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <Link href="/dashboard" className="sidebar-item" id="nav-dashboard">
            <Zap size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/chat" className="sidebar-item active" id="nav-chat">
            <MessageSquare size={18} />
            <span>Chats</span>
          </Link>
          <Link href="/agents" className="sidebar-item" id="nav-agents">
            <Bot size={18} />
            <span>Agents</span>
          </Link>
          <Link href="/settings" className="sidebar-item" id="nav-settings">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>
        <div className="sidebar-footer">
          <Link href="/dashboard" className="sidebar-item" style={{ flex: 1 }}>
            <LogOut size={18} />
            <span>Back</span>
          </Link>
        </div>
      </aside>

      {/* Chat main */}
      <div className="chat-layout">
        {/* Chat header */}
        <header className="chat-top-bar">
          <div className="chat-top-info">
            <div className="chat-agent-dot" />
            <span className="chat-agent-name">AI Assistant</span>
            <span
              className="chat-model-badge"
              title="Active AI Model"
            >
              {activeProvider}
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="chat-messages">
          {isInitializing ? (
            <div className="chat-empty">
              <div className="chat-empty-icon" style={{ animation: "pulse 2s infinite" }}>
                <Bot size={40} />
              </div>
              <h2 className="chat-empty-title">Loading history...</h2>
            </div>
          ) : isEmpty ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">
                <Bot size={40} />
              </div>
              <h2 className="chat-empty-title">
                What can I help you with?
              </h2>
              <p className="chat-empty-sub">
                Ask me anything — I support markdown, code, tables and more.
              </p>
              <div className="chat-suggestions">
                {[
                  "Explain how LangGraph works",
                  "Write a Python function to sort a list",
                  "What is RAG in AI?",
                  "Give me a React hook example",
                ].map((s) => (
                  <button
                    key={s}
                    className="chat-suggestion-chip"
                    onClick={() => {
                      const event = {
                        target: { value: s },
                      } as React.ChangeEvent<HTMLTextAreaElement>;
                      handleInputChange(event);
                      textareaRef.current?.focus();
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-msg ${msg.role === "user" ? "chat-msg-user" : "chat-msg-assistant"}`}
            >
              <div className="chat-msg-avatar">
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="chat-msg-bubble">
                {msg.role === "assistant" ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <p className="chat-msg-text">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading &&
            (messages.length === 0 ||
              messages[messages.length - 1].role === "user") && (
              <TypingIndicator />
            )}

          {error && (
            <div className="chat-error">
              <span>⚠️ {error.message}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <form onSubmit={handleSubmit} className="chat-form">
            <div className="chat-input-box">
              <textarea
                ref={textareaRef}
                id="chat-message-input"
                className="chat-textarea"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message AI Assistant…"
                rows={1}
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={stop}
                  className="chat-stop-btn"
                  id="chat-stop-btn"
                  title="Stop generation"
                >
                  <Square size={16} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="chat-submit-btn"
                  id="chat-submit-btn"
                  disabled={!input.trim()}
                  title="Send message"
                >
                  <Send size={16} />
                </button>
              )}
            </div>
            <p className="chat-hint">
              Enter to send · Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageContent />
    </Suspense>
  );
}
