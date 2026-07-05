import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/supabase/db";
import { ChevronRight, Plus, MessageSquare } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName =
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "there";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const stats = await getDashboardStats(user.id);

  return (
    <DashboardLayout
      activeTab="dashboard"
      initials={initials}
      displayName={displayName}
      email={user.email || ""}
    >
      {/* Main content */}
      <main className="dashboard-main">
        {/* Top bar */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">
              Good to see you, <span className="gradient-text">{displayName}</span> 👋
            </h1>
            <p className="dashboard-sub">
              Your AI workspace is ready. Start a chat or create an agent.
            </p>
          </div>
        </header>

        {/* Quick actions */}
        <section className="dashboard-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions">
            <Link href="/chat" className="quick-card" id="quick-new-chat">
              <div className="quick-card-icon">
                <MessageSquare size={24} />
              </div>
              <div className="quick-card-body">
                <h3>New Chat</h3>
                <p>Start a conversation with an AI agent</p>
              </div>
              <ChevronRight size={18} className="quick-card-arrow" />
            </Link>

            <Link href="/agents/new" className="quick-card" id="quick-new-agent">
              <div className="quick-card-icon">
                <Plus size={24} />
              </div>
              <div className="quick-card-body">
                <h3>Create Agent</h3>
                <p>Build a custom AI agent with tools and memory</p>
              </div>
              <ChevronRight size={18} className="quick-card-arrow" />
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="dashboard-section">
          <h2 className="section-title">Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Total Chats</p>
              <p className="stat-value">{stats.totalChats}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Agents Created</p>
              <p className="stat-value">{stats.totalAgents}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Documents</p>
              <p className="stat-value">{stats.totalDocuments}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Messages Sent</p>
              <p className="stat-value">{stats.totalMessages}</p>
            </div>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}
