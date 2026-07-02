import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication – AgentA",
  description: "Sign in to your AgentA account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      {/* Animated gradient orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-content">{children}</div>
    </div>
  );
}
