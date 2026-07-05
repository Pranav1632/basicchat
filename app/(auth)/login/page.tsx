"use client";

import { useActionState, useState } from "react";
import { signInWithEmail, signInWithGoogle } from "@/actions/auth";
import { Bot, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [state, action, pending] = useActionState(
    signInWithEmail,
    undefined
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="auth-card">
      {/* Logo */}
      <div className="auth-logo">
        <div className="auth-logo-icon">
          <Bot size={28} />
        </div>
        <span className="auth-logo-text">AgentA</span>
      </div>

      <div className="auth-header">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">
          Sign in with your email and password
        </p>
      </div>

      <form action={action} className="auth-form">
        <div className="auth-field">
          <label htmlFor="email" className="auth-label">
            Email address
          </label>
          <div className="auth-input-wrapper">
            <Mail size={16} className="auth-input-icon" />
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="password" className="auth-label">
            Password
          </label>
          <div className="auth-input-wrapper">
            <Lock size={16} className="auth-input-icon" />
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
          </div>
        </div>

        {state?.error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{state.error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="auth-btn-primary"
          id="login-submit-btn"
        >
          {pending ? (
            <>
              <Loader2 size={16} className="auth-spinner" />
              Signing in…
            </>
          ) : (
            <>
              <Lock size={16} />
              Sign In
            </>
          )}
        </button>
      </form>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        margin: "1.5rem 0 1rem 0",
        color: "rgba(255,255,255,0.3)",
        fontSize: "0.8rem",
      }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
        <span>OR</span>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      </div>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "0.75rem",
            fontSize: "0.9rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background 0.2s",
            marginBottom: "1rem",
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </form>

      <p className="auth-footer-text">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="auth-link" id="go-to-signup">
          Sign up
        </Link>
      </p>
    </div>
  );
}
