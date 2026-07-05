"use client";

import { useState } from "react";
import { createNewAgent } from "@/actions/agent";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Loader2, Save } from "lucide-react";
import Link from "next/link";

export default function NewAgentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createNewAgent(formData);
      router.push("/agents");
    } catch (error) {
      console.error(error);
      alert("Failed to create agent");
    } finally {
      setIsSubmitting(false);
    }
  }

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
          <Link href="/dashboard" className="sidebar-item">
            <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span>Dashboard</span>
          </Link>
          <Link href="/chat" className="sidebar-item">
            <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Chats</span>
          </Link>
          <Link href="/agents" className="sidebar-item active">
            <Bot size={18} />
            <span>Agents</span>
          </Link>
          <Link href="/settings" className="sidebar-item">
            <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main" style={{ padding: "2rem", overflowY: "auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/agents" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", marginBottom: "1rem", fontSize: "0.9rem" }}>
            <ArrowLeft size={16} />
            Back to Agents
          </Link>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "600", marginBottom: "0.25rem" }}>Create New Agent</h1>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Configure a new custom AI agent persona.</p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "600px"
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.5rem", color: "rgba(255,255,255,0.8)" }}>Agent Name</label>
              <input 
                type="text" 
                name="name" 
                required 
                placeholder="e.g., Python Expert" 
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "white",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.5rem", color: "rgba(255,255,255,0.8)" }}>Description (Optional)</label>
              <input 
                type="text" 
                name="description" 
                placeholder="e.g., Helps debug Python code" 
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "white",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.5rem", color: "rgba(255,255,255,0.8)" }}>Model</label>
              <select 
                name="model" 
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "white",
                  outline: "none",
                  appearance: "none"
                }}
              >
                <option value="gemini-2.5-flash" style={{ background: "#121212" }}>Gemini 2.5 Flash</option>
                <option value="gemini-2.0-flash-lite" style={{ background: "#121212" }}>Gemini 2.0 Flash Lite</option>
                <option value="gemini-2.5-pro" style={{ background: "#121212" }}>Gemini 2.5 Pro</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.5rem", color: "rgba(255,255,255,0.8)" }}>System Prompt</label>
              <textarea 
                name="system_prompt" 
                rows={5}
                required
                placeholder="You are an expert Python developer. Respond using code blocks where necessary..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "white",
                  outline: "none",
                  resize: "vertical"
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                background: "white",
                color: "black",
                border: "none",
                padding: "0.75rem",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
                marginTop: "1rem",
                transition: "opacity 0.2s"
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="auth-spinner" style={{ animation: "spin 1s linear infinite" }} />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Create Agent
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
