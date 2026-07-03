import { Bot, Trash2, Settings, Zap } from "lucide-react";
import Link from "next/link";
import { fetchUserAgents, removeAgent } from "@/actions/agent";
import CreateAgentModal from "@/components/agents/CreateAgentModal";

export default async function AgentsPage() {
  const agents = await fetchUserAgents();

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
          <Link href="/dashboard" className="sidebar-item">
            <Zap size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/chat" className="sidebar-item">
            <Bot size={18} />
            <span>Chats</span>
          </Link>
          <Link href="/agents" className="sidebar-item active">
            <Bot size={18} />
            <span>Agents</span>
          </Link>
          <Link href="/settings" className="sidebar-item">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "600", marginBottom: "0.25rem" }}>My Agents</h1>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Manage your customized AI personas.</p>
          </div>
          <CreateAgentModal />
        </div>

        {agents.length === 0 ? (
          <div className="chat-empty" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "4rem" }}>
            <Bot size={40} style={{ opacity: 0.5, marginBottom: "1rem" }} />
            <h2 className="chat-empty-title">No Agents Yet</h2>
            <p className="chat-empty-sub">Create your first custom AI agent to get started.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {agents.map(agent => (
              <div key={agent.id} style={{ 
                background: "rgba(255,255,255,0.03)", 
                border: "1px solid rgba(255,255,255,0.08)", 
                borderRadius: "12px", 
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.5rem", borderRadius: "8px" }}>
                      <Bot size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: "600", fontSize: "1.1rem" }}>{agent.name}</h3>
                      <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{agent.model}</span>
                    </div>
                  </div>
                  <form action={async () => {
                    "use server";
                    await removeAgent(agent.id);
                  }}>
                    <button type="submit" style={{ background: "none", border: "none", color: "rgba(255,100,100,0.7)", cursor: "pointer", padding: "0.25rem" }}>
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
                
                <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", flex: 1 }}>
                  {agent.description || "No description provided."}
                </div>
                
                <Link 
                  href={`/chat?agentId=${agent.id}`}
                  style={{ 
                    display: "block", 
                    textAlign: "center", 
                    background: "rgba(255,255,255,0.1)", 
                    color: "white", 
                    textDecoration: "none", 
                    padding: "0.5rem", 
                    borderRadius: "6px",
                    fontWeight: "500",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                >
                  Chat with {agent.name}
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
