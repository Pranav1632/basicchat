"use client";

import { useActionState, useState } from "react";
import { signInWithEmail } from "@/actions/auth";
import { Bot, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [state, action, pending] = useActionState(
    signInWithEmail,
    undefined
  );
  const [email, setEmail] = useState("");

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
          Enter your email and we&apos;ll send you a magic link to sign in
        </p>
      </div>

      {state?.success ? (
        <div className="auth-success">
          <CheckCircle size={20} className="auth-success-icon" />
          <div>
            <p className="auth-success-title">Check your inbox!</p>
            <p className="auth-success-desc">
              We sent a magic link to <strong>{email}</strong>. Click the link
              to sign in — no password needed.
            </p>
          </div>
        </div>
      ) : (
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
                Sending magic link…
              </>
            ) : (
              <>
                <Mail size={16} />
                Send magic link
              </>
            )}
          </button>
        </form>
      )}

      <p className="auth-footer-text">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="auth-link" id="go-to-signup">
          Sign up
        </Link>
      </p>
    </div>
  );
}
