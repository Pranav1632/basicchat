import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/supabase/db";
import { signOut } from "@/actions/auth";
import {
  Bot,
  MessageSquare,
  Settings,
  LogOut,
  Zap,
  ChevronRight,
  Plus,
} from "lucide-react";
import Link from "next/link";

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
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Bot size={22} />
            <span>AgentA</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link href="/dashboard" className="sidebar-item active" id="nav-dashboard">
            <Zap size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/chat" className="sidebar-item" id="nav-chat">
            <MessageSquare size={18} />
            <span>Chats</span>
          </Link>
          <Link href="/agents" className="sidebar-item" id="nav-agents">
            <Bot size={18} />
            <span>Agents</span>
          </Link>
          <Link href="/settings" className="sidebar-item" id="nav-settings">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{displayName}</p>
              <p className="sidebar-user-email">{user.email}</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="sidebar-logout"
              id="logout-btn"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </aside>

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
    </div>
  );
}
