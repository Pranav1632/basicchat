"use client";

import { useState } from "react";
import { Bot, MessageSquare, Settings, LogOut, Zap, Menu, X } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/actions/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: "dashboard" | "chat" | "agents" | "settings";
  initials: string;
  displayName: string;
  email: string;
}

export default function DashboardLayout({
  children,
  activeTab,
  initials,
  displayName,
  email,
}: DashboardLayoutProps) {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay (Mobile) */}
      <div 
        className={`sidebar-overlay ${isLeftSidebarOpen ? "open" : ""}`}
        onClick={() => setIsLeftSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isLeftSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div className="sidebar-logo">
            <Bot size={22} />
            <span>AgentA</span>
          </div>
          <button
            onClick={() => setIsLeftSidebarOpen(false)}
            className="sidebar-close-btn"
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.4)",
              cursor: "pointer",
              padding: "0.25rem",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link href="/dashboard" className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`} id="nav-dashboard">
            <Zap size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/chat" className={`sidebar-item ${activeTab === "chat" ? "active" : ""}`} id="nav-chat">
            <MessageSquare size={18} />
            <span>Chats</span>
          </Link>
          <Link href="/agents" className={`sidebar-item ${activeTab === "agents" ? "active" : ""}`} id="nav-agents">
            <Bot size={18} />
            <span>Agents</span>
          </Link>
          <Link href="/settings" className={`sidebar-item ${activeTab === "settings" ? "active" : ""}`} id="nav-settings">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{displayName}</p>
              <p className="sidebar-user-email">{email}</p>
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

      {/* Main content wrapper */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Mobile Header Bar */}
        <header className="mobile-only-header">
          <button
            onClick={() => setIsLeftSidebarOpen(true)}
            className="mobile-header-btn hamburger-btn"
            style={{ display: "flex" }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontWeight: "600", fontSize: "0.95rem", color: "white", textTransform: "capitalize" }}>
            {activeTab}
          </span>
        </header>

        {children}
      </div>
    </div>
  );
}
