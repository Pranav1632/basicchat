"use client";

import { useChat } from "ai/react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchChatMessages, fetchUserChats, removeChat } from "@/actions/chat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const initialChatId = searchParams?.get("id") || "";
  const agentId = searchParams?.get("agentId") || "";
  
  const [activeProvider, setActiveProvider] = useState<string>("gemini-2.5-flash");
  const [chatId, setChatId] = useState<string>(initialChatId);

  // Sync state if search parameter changes
  useEffect(() => {
    setChatId(initialChatId);
  }, [initialChatId]);

  // Query for chat history list
  const { data: chats = [] } = useQuery({
    queryKey: ["user-chats"],
    queryFn: () => fetchUserChats(),
    staleTime: 30000,
  });

  // Query for active chat messages
  const { data: dbMessages, isLoading: isFetchingHistory } = useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: () => (chatId ? fetchChatMessages(chatId) : Promise.resolve([])),
    enabled: !!chatId,
    staleTime: 60000,
  });

  // Mutation to delete a chat
  const deleteChatMutation = useMutation({
    mutationFn: (id: string) => removeChat(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["user-chats"] });
      if (deletedId === chatId) {
        router.push("/chat");
      }
    },
  });

  const isInitializing = chatId ? isFetchingHistory : false;

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
        queryClient.invalidateQueries({ queryKey: ["user-chats"] });
        router.replace(`/chat?id=${newChatId}`);
      }
    },
  });

  // Sync fetched messages history to Vercel AI SDK local state
  useEffect(() => {
    if (dbMessages) {
      setMessages(
        dbMessages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    } else if (!chatId) {
      setMessages([]);
    }
  }, [dbMessages, chatId, setMessages]);

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

      {/* Right Sidebar - Chat History */}
      <aside className="chat-history-sidebar" style={{
        width: "280px",
        background: "rgba(15, 15, 24, 0.6)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        flexShrink: 0,
      }}>
        <div style={{
          padding: "1.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <h3 style={{ fontWeight: "600", fontSize: "1rem", color: "white" }}>Chat History</h3>
          <button
            onClick={() => {
              router.push("/chat");
            }}
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              padding: "0.4rem 0.8rem",
              fontSize: "0.8rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >
            New Chat
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}>
          {chats.length === 0 ? (
            <div style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.85rem",
              padding: "2rem 0",
            }}>
              No recent chats
            </div>
          ) : (
            chats.map((c) => {
              const isActive = c.id === chatId;
              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/chat?id=${c.id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    background: isActive ? "rgba(124, 111, 255, 0.15)" : "transparent",
                    border: isActive ? "1px solid rgba(124, 111, 255, 0.3)" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    overflow: "hidden",
                    marginRight: "1rem",
                    flex: 1,
                  }}>
                    <div style={{
                      minWidth: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: isActive ? "#7c6fff" : "rgba(255,255,255,0.2)",
                    }} />
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <p style={{
                        fontSize: "0.85rem",
                        fontWeight: isActive ? "600" : "400",
                        color: isActive ? "white" : "rgba(255,255,255,0.8)",
                        margin: 0,
                      }}>
                        {c.title || "Untitled Chat"}
                      </p>
                      <span style={{
                        fontSize: "0.7rem",
                        color: "rgba(255,255,255,0.4)",
                      }}>
                        {c.agent?.name || "AI Assistant"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this chat?")) {
                        deleteChatMutation.mutate(c.id);
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255,100,100,0.6)",
                      cursor: "pointer",
                      padding: "0.25rem",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = "rgba(255,100,100,1)"}
                    onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,100,100,0.6)"}
                  >
                    <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>
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
