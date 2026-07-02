import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Bot, Zap, Shield, Cpu } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="landing">
      {/* Background orbs */}
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />

      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <Bot size={24} />
          <span>AgentA</span>
        </div>
        <Link href="/login" className="landing-nav-btn" id="nav-login-btn">
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-badge">
          <Zap size={12} />
          <span>Powered by LangGraph + RAG</span>
        </div>

        <h1 className="landing-title">
          Your AI Agent <br />
          <span className="gradient-text">Platform</span>
        </h1>

        <p className="landing-desc">
          Build custom AI agents with memory, tool calling, and document
          retrieval. Chat with them using a beautiful, streaming interface.
        </p>

        <div className="landing-ctas">
          <Link href="/signup" className="btn-primary-lg" id="hero-signup-btn">
            Get started free
          </Link>
          <Link href="/login" className="btn-ghost-lg" id="hero-login-btn">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">
            <Bot size={22} />
          </div>
          <h3>Custom Agents</h3>
          <p>Create agents with unique system prompts, tools, and models.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <Cpu size={22} />
          </div>
          <h3>LangGraph Orchestration</h3>
          <p>Multi-step reasoning with nodes, edges, and conditional routing.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <Shield size={22} />
          </div>
          <h3>Secure by Default</h3>
          <p>Row-level security, auth sessions, and encrypted storage.</p>
        </div>
      </section>
    </main>
  );
}