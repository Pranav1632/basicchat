"use client";

import { useActionState, useState } from "react";
import { signUpWithEmailAndPassword } from "@/actions/auth";
import { Bot, Mail, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [state, action, pending] = useActionState(
    signUpWithEmailAndPassword,
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
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">
          Sign up with your email and password
        </p>
      </div>

      {state?.success ? (
        <div className="auth-success">
          <CheckCircle size={20} className="auth-success-icon" style={{ flexShrink: 0 }} />
          <div>
            <p className="auth-success-title">Check your inbox!</p>
            <p className="auth-success-desc">
              We sent a verification link to <strong>{email}</strong>. Click the link
              in your email to confirm your account and log in.
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

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              Password (at least 6 characters)
            </label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••"
                required
                minLength={6}
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
            id="signup-submit-btn"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="auth-spinner" />
                Registering…
              </>
            ) : (
              <>
                <Bot size={16} />
                Sign Up
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
