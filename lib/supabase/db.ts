import { createClient } from "@/lib/supabase/server";
import type { UserProfile, Agent, Chat, DbMessage, Document } from "@/types";

// ─── Users ────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Supabase error in getUserProfile:", error);
      return null;
    }
    return data as UserProfile;
  } catch (error) {
    console.error("Unexpected error in getUserProfile:", error);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, "name" | "avatar_url">>
): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error in updateUserProfile:", error);
      return null;
    }
    return data as UserProfile;
  } catch (error) {
    console.error("Unexpected error in updateUserProfile:", error);
    return null;
  }
}

// ─── Agents ───────────────────────────────────────────────────

export async function getAgents(userId: string): Promise<Agent[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error in getAgents:", error);
      return [];
    }
    return data as Agent[];
  } catch (error) {
    console.error("Unexpected error in getAgents:", error);
    return [];
  }
}

export async function getAgent(agentId: string): Promise<Agent | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (error) {
      console.error("Supabase error in getAgent:", error);
      return null;
    }
    return data as Agent;
  } catch (error) {
    console.error("Unexpected error in getAgent:", error);
    return null;
  }
}

export async function createAgent(
  userId: string,
  input: Omit<Agent, "id" | "user_id" | "created_at">
): Promise<Agent | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("agents")
      .insert({ ...input, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error("Supabase error in createAgent:", error);
      return null;
    }
    return data as Agent;
  } catch (error) {
    console.error("Unexpected error in createAgent:", error);
    return null;
  }
}

export async function updateAgent(
  agentId: string,
  updates: Partial<Omit<Agent, "id" | "user_id" | "created_at">>
): Promise<Agent | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("agents")
      .update(updates)
      .eq("id", agentId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error in updateAgent:", error);
      return null;
    }
    return data as Agent;
  } catch (error) {
    console.error("Unexpected error in updateAgent:", error);
    return null;
  }
}

export async function deleteAgent(agentId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("agents").delete().eq("id", agentId);
    if (error) {
      console.error("Supabase error in deleteAgent:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in deleteAgent:", error);
    return false;
  }
}

// ─── Chats ────────────────────────────────────────────────────

export async function getChats(userId: string): Promise<Chat[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("chats")
      .select("*, agent:agents(id, name, model)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error in getChats:", error);
      return [];
    }
    return data as Chat[];
  } catch (error) {
    console.error("Unexpected error in getChats:", error);
    return [];
  }
}

export async function getChat(chatId: string): Promise<Chat | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("chats")
      .select("*, agent:agents(*), messages(*)")
      .eq("id", chatId)
      .order("created_at", { foreignTable: "messages", ascending: true })
      .single();

    if (error) {
      console.error("Supabase error in getChat:", error);
      return null;
    }
    return data as Chat;
  } catch (error) {
    console.error("Unexpected error in getChat:", error);
    return null;
  }
}

export async function createChat(
  userId: string,
  agentId: string,
  title = "New Chat"
): Promise<Chat | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("chats")
      .insert({ user_id: userId, agent_id: agentId, title })
      .select()
      .single();

    if (error) {
      console.error("Supabase error in createChat:", error);
      return null;
    }
    return data as Chat;
  } catch (error) {
    console.error("Unexpected error in createChat:", error);
    return null;
  }
}

export async function updateChatTitle(
  chatId: string,
  title: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("chats")
      .update({ title })
      .eq("id", chatId);
    if (error) {
      console.error("Supabase error in updateChatTitle:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in updateChatTitle:", error);
    return false;
  }
}

export async function deleteChat(chatId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("chats").delete().eq("id", chatId);
    if (error) {
      console.error("Supabase error in deleteChat:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in deleteChat:", error);
    return false;
  }
}

// ─── Messages ─────────────────────────────────────────────────

export async function getMessages(chatId: string): Promise<DbMessage[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error in getMessages:", error);
      return [];
    }
    return data as DbMessage[];
  } catch (error) {
    console.error("Unexpected error in getMessages:", error);
    return [];
  }
}

export async function addMessage(
  chatId: string,
  role: DbMessage["role"],
  content: string
): Promise<DbMessage | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ chat_id: chatId, role, content })
      .select()
      .single();

    if (error) {
      console.error("Supabase error in addMessage:", error);
      return null;
    }
    return data as DbMessage;
  } catch (error) {
    console.error("Unexpected error in addMessage:", error);
    return null;
  }
}

export async function addMessages(
  chatId: string,
  messages: Array<{ role: DbMessage["role"]; content: string }>
): Promise<DbMessage[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert(messages.map((m) => ({ ...m, chat_id: chatId })))
      .select();

    if (error) {
      console.error("Supabase error in addMessages:", error);
      return [];
    }
    return data as DbMessage[];
  } catch (error) {
    console.error("Unexpected error in addMessages:", error);
    return [];
  }
}

// ─── Documents ────────────────────────────────────────────────

export async function getDocuments(agentId: string): Promise<Document[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error in getDocuments:", error);
      return [];
    }
    return data as Document[];
  } catch (error) {
    console.error("Unexpected error in getDocuments:", error);
    return [];
  }
}

export async function createDocument(doc: {
  agent_id: string;
  user_id: string;
  filename: string;
  storage_url: string;
}): Promise<Document | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("documents")
      .insert(doc)
      .select()
      .single();

    if (error) {
      console.error("Supabase error in createDocument:", error);
      return null;
    }
    return data as Document;
  } catch (error) {
    console.error("Unexpected error in createDocument:", error);
    return null;
  }
}

export async function updateEmbeddingStatus(
  documentId: string,
  status: Document["embedding_status"]
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("documents")
      .update({ embedding_status: status })
      .eq("id", documentId);
    if (error) {
      console.error("Supabase error in updateEmbeddingStatus:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in updateEmbeddingStatus:", error);
    return false;
  }
}

export async function deleteDocument(documentId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("documents").delete().eq("id", documentId);
    if (error) {
      console.error("Supabase error in deleteDocument:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in deleteDocument:", error);
    return false;
  }
}

// ─── Dashboard stats ──────────────────────────────────────────

export async function getDashboardStats(userId: string) {
  try {
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
        .select("id, chats!inner(user_id)", { count: "exact", head: true })
        .eq("chats.user_id", userId),
    ]);

    if (chatsRes.error) console.error("Error fetching chat stats in getDashboardStats:", chatsRes.error);
    if (agentsRes.error) console.error("Error fetching agent stats in getDashboardStats:", agentsRes.error);
    if (docsRes.error) console.error("Error fetching document stats in getDashboardStats:", docsRes.error);
    if (msgsRes.error) console.error("Error fetching message stats in getDashboardStats:", msgsRes.error);

    return {
      totalChats: chatsRes.count ?? 0,
      totalAgents: agentsRes.count ?? 0,
      totalDocuments: docsRes.count ?? 0,
      totalMessages: msgsRes.count ?? 0,
    };
  } catch (error) {
    console.error("Unexpected error in getDashboardStats:", error);
    return {
      totalChats: 0,
      totalAgents: 0,
      totalDocuments: 0,
      totalMessages: 0,
    };
  }
}

// ─── Memory Helpers ───────────────────────────────────────────

export async function updateChatSummary(
  chatId: string,
  summary: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("chats")
      .update({ summary })
      .eq("id", chatId);
    if (error) {
      console.error("Supabase error in updateChatSummary:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in updateChatSummary:", error);
    return false;
  }
}

export async function getUserMemories(userId: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_memories")
      .select("memory")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error in getUserMemories:", error);
      return [];
    }
    return (data || []).map((m: any) => m.memory);
  } catch (error) {
    console.error("Unexpected error in getUserMemories:", error);
    return [];
  }
}

export async function addUserMemory(userId: string, memoryText: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("user_memories")
      .insert({ user_id: userId, memory: memoryText });

    if (error) {
      console.error("Supabase error in addUserMemory:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in addUserMemory:", error);
    return false;
  }
}
