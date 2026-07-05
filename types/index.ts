// ─── Chat types ───────────────────────────────────────────────
export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  created_at?: string;
}

// ─── Database row types ───────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export type AgentModel =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-3.5-turbo"
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-haiku-20240307"
  | "llama-3.1-70b-versatile";

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  model: AgentModel | string;
  system_prompt: string | null;
  temperature: number;
  created_at: string;
}

export interface Chat {
  id: string;
  agent_id: string;
  user_id: string;
  title: string;
  created_at: string;
  summary?: string | null;
  // joined relations
  agent?: Agent;
  messages?: DbMessage[];
}

export interface DbMessage {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  created_at: string;
}

export type EmbeddingStatus = "pending" | "processing" | "done" | "error";

export interface Document {
  id: string;
  agent_id: string;
  user_id: string;
  filename: string;
  storage_url: string;
  embedding_status: EmbeddingStatus;
  created_at: string;
}

// ─── Form / action types ──────────────────────────────────────

export interface CreateAgentInput {
  name: string;
  description?: string;
  model: AgentModel | string;
  system_prompt?: string;
  temperature?: number;
}

export interface CreateChatInput {
  agent_id: string;
  title?: string;
}

export interface UserMemory {
  id: string;
  user_id: string;
  agent_id?: string | null;
  category: string;
  key: string;
  value: string;
  confidence?: number;
  source?: string;
  created_at: string;
  updated_at: string;
}
