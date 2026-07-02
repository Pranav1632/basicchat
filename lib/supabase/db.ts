import { createClient } from "@/lib/supabase/server";
import type { UserProfile, Agent, Chat, DbMessage, Document } from "@/types";

// ─── Users ────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as UserProfile;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, "name" | "avatar_url">>
): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) return null;
  return data as UserProfile;
}

// ─── Agents ───────────────────────────────────────────────────

export async function getAgents(userId: string): Promise<Agent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as Agent[];
}

export async function getAgent(agentId: string): Promise<Agent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single();

  if (error) return null;
  return data as Agent;
}

export async function createAgent(
  userId: string,
  input: Omit<Agent, "id" | "user_id" | "created_at">
): Promise<Agent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .insert({ ...input, user_id: userId })
    .select()
    .single();

  if (error) return null;
  return data as Agent;
}

export async function updateAgent(
  agentId: string,
  updates: Partial<Omit<Agent, "id" | "user_id" | "created_at">>
): Promise<Agent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .update(updates)
    .eq("id", agentId)
    .select()
    .single();

  if (error) return null;
  return data as Agent;
}

export async function deleteAgent(agentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("agents").delete().eq("id", agentId);
  return !error;
}

// ─── Chats ────────────────────────────────────────────────────

export async function getChats(userId: string): Promise<Chat[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chats")
    .select("*, agent:agents(id, name, model)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as Chat[];
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chats")
    .select("*, agent:agents(*), messages(*)")
    .eq("id", chatId)
    .order("created_at", { foreignTable: "messages", ascending: true })
    .single();

  if (error) return null;
  return data as Chat;
}

export async function createChat(
  userId: string,
  agentId: string,
  title = "New Chat"
): Promise<Chat | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chats")
    .insert({ user_id: userId, agent_id: agentId, title })
    .select()
    .single();

  if (error) return null;
  return data as Chat;
}

export async function updateChatTitle(
  chatId: string,
  title: string
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("chats")
    .update({ title })
    .eq("id", chatId);
  return !error;
}

export async function deleteChat(chatId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("chats").delete().eq("id", chatId);
  return !error;
}

// ─── Messages ─────────────────────────────────────────────────

export async function getMessages(chatId: string): Promise<DbMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data as DbMessage[];
}

export async function addMessage(
  chatId: string,
  role: DbMessage["role"],
  content: string
): Promise<DbMessage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, role, content })
    .select()
    .single();

  if (error) return null;
  return data as DbMessage;
}

export async function addMessages(
  chatId: string,
  messages: Array<{ role: DbMessage["role"]; content: string }>
): Promise<DbMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert(messages.map((m) => ({ ...m, chat_id: chatId })))
    .select();

  if (error) return [];
  return data as DbMessage[];
}

// ─── Documents ────────────────────────────────────────────────

export async function getDocuments(agentId: string): Promise<Document[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as Document[];
}

export async function createDocument(doc: {
  agent_id: string;
  user_id: string;
  filename: string;
  storage_url: string;
}): Promise<Document | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert(doc)
    .select()
    .single();

  if (error) return null;
  return data as Document;
}

export async function updateEmbeddingStatus(
  documentId: string,
  status: Document["embedding_status"]
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ embedding_status: status })
    .eq("id", documentId);
  return !error;
}

export async function deleteDocument(documentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  return !error;
}

// ─── Dashboard stats ──────────────────────────────────────────

export async function getDashboardStats(userId: string) {
  const supabase = await createClient();

  const [chatsRes, agentsRes, docsRes, msgsRes] = await Promise.all([
    supabase
      .from("chats")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("agents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("messages")
      .select("messages.id", { count: "exact", head: true })
      .eq("chats.user_id", userId),
  ]);

  return {
    totalChats: chatsRes.count ?? 0,
    totalAgents: agentsRes.count ?? 0,
    totalDocuments: docsRes.count ?? 0,
    totalMessages: msgsRes.count ?? 0,
  };
}
