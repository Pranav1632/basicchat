"use client";

import { useActionState, useState } from "react";
import { signInWithEmail } from "@/actions/auth";
import { Bot, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
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
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">
          Enter your email to get started — we&apos;ll send you a magic link
        </p>
      </div>

      {state?.success ? (
        <div className="auth-success">
          <CheckCircle size={20} className="auth-success-icon" />
          <div>
            <p className="auth-success-title">Check your inbox!</p>
            <p className="auth-success-desc">
              We sent a magic link to <strong>{email}</strong>. Click the link
              to complete your signup — no password needed.
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
            id="signup-submit-btn"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="auth-spinner" />
                Sending magic link…
              </>
            ) : (
              <>
                <Mail size={16} />
                Continue with Email
              </>
            )}
          </button>
        </form>
      )}

      <p className="auth-footer-text">
        Already have an account?{" "}
        <Link href="/login" className="auth-link" id="go-to-login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
