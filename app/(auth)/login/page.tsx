"use client";

import { useActionState, useState } from "react";
import { signInWithEmail } from "@/actions/auth";
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

      <p className="auth-footer-text">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="auth-link" id="go-to-signup">
          Sign up
        </Link>
      </p>
    </div>
  );
}
