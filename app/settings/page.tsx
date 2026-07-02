import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
import {
  Bot,
  MessageSquare,
  Settings,
  LogOut,
  Zap,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName =
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinedAt = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
          <Link href="/dashboard" className="sidebar-item" id="nav-dashboard">
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
          <Link href="/settings" className="sidebar-item active" id="nav-settings">
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
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">Profile & Settings</h1>
            <p className="dashboard-sub">Manage your account details</p>
          </div>
        </header>

        {/* Profile card */}
        <section className="dashboard-section">
          <div className="profile-card">
            <div className="profile-avatar-lg">{initials}</div>

            <div className="profile-info">
              <h2 className="profile-name">{displayName}</h2>

              <div className="profile-detail">
                <Mail size={15} />
                <span>{user.email}</span>
              </div>

              <div className="profile-detail">
                <Calendar size={15} />
                <span>Joined {joinedAt}</span>
              </div>

              <div className="profile-detail">
                <User size={15} />
                <span>User ID: {user.id.slice(0, 8)}…</span>
              </div>
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section className="dashboard-section">
          <h2 className="section-title">Account</h2>
          <div className="danger-card">
            <div>
              <p className="danger-title">Sign out of all devices</p>
              <p className="danger-desc">
                You&apos;ll need to sign in again with your email magic link.
              </p>
            </div>
            <form action={signOut}>
              <button type="submit" className="btn-danger" id="signout-all-btn">
                <LogOut size={15} />
                Sign Out
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
