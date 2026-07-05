"use client";

import { useState } from "react";
import { saveUserApiKey } from "@/actions/user";
import { Key, Eye, EyeOff, Save, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface SettingsFormProps {
  initialApiKey: string | null;
}

export default function SettingsForm({ initialApiKey }: SettingsFormProps) {
  const [apiKey, setApiKey] = useState(initialApiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setMessage({ type: "error", text: "API key cannot be empty. If you want to remove it, click Delete." });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const res = await saveUserApiKey(apiKey.trim());
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Gemini API key saved successfully!" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save API key. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your custom Gemini API key? The system will fall back to the default project key.")) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    try {
      const res = await saveUserApiKey(null);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setApiKey("");
        setMessage({ type: "success", text: "Custom API key deleted. Falling back to default system key." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete API key. Please try again." });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      borderRadius: "12px",
      padding: "2rem",
      marginTop: "1.5rem",
    }}>
      <h2 style={{
        fontSize: "1.25rem",
        fontWeight: "600",
        color: "white",
        marginBottom: "0.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem"
      }}>
        <Key size={20} style={{ color: "#7C6FFF" }} />
        Custom Gemini API Key
      </h2>
      <p style={{
        fontSize: "0.875rem",
        color: "rgba(255, 255, 255, 0.5)",
        marginBottom: "1.5rem",
        lineHeight: "1.4"
      }}>
        Enter your own Gemini API key to customize rate limits, usage tiers, or billing. 
        If not set, your requests will automatically route to the default system key.
      </p>

      {message && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          fontSize: "0.875rem",
          background: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          border: message.type === "success" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
          color: message.type === "success" ? "#34d399" : "#f87171",
        }}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1.5rem",
        }}>
          <label htmlFor="api-key" style={{
            fontSize: "0.75rem",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "rgba(255, 255, 255, 0.6)",
          }}>
            API Key
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="api-key"
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              style={{
                width: "100%",
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.75rem 2.5rem 0.75rem 1rem",
                color: "white",
                fontSize: "0.875rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#7C6FFF"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255, 255, 255, 0.1)"}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "rgba(255, 255, 255, 0.4)",
                cursor: "pointer",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#7C6FFF",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s, opacity 0.2s",
              opacity: isSaving ? 0.7 : 1,
            }}
            onMouseOver={(e) => { if(!isSaving) e.currentTarget.style.background = "#6b5eff"; }}
            onMouseOut={(e) => { if(!isSaving) e.currentTarget.style.background = "#7C6FFF"; }}
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save Key"}
          </button>

          {initialApiKey && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: isDeleting ? 0.7 : 1,
              }}
              onMouseOver={(e) => {
                if(!isDeleting) {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                }
              }}
              onMouseOut={(e) => {
                if(!isDeleting) {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                }
              }}
            >
              <Trash2 size={16} />
              {isDeleting ? "Deleting..." : "Delete Key"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
