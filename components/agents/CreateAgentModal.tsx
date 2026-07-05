"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createNewAgent } from "@/actions/agent";

export default function CreateAgentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      await createNewAgent(formData);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to create agent");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "white",
          color: "black",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        <Plus size={18} />
        Create Agent
      </button>

      {isOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}>
          <div style={{
            background: "#121212",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "500px",
            padding: "1.5rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Create New Agent</h2>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                  rows={4}
                  required
                  placeholder="You are an expert Python developer..."
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
                  marginTop: "0.5rem",
                  width: "100%",
                  padding: "0.75rem",
                  background: "white",
                  color: "black",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? "Creating..." : "Create Agent"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
