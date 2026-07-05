import { createClient } from "@/lib/supabase/server";
import type { UserProfile, Agent, Chat, DbMessage, Document, UserMemory } from "@/types";

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

export async function getUserMemories(userId: string): Promise<UserMemory[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_memories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error in getUserMemories:", error);
      return [];
    }
    return (data || []) as UserMemory[];
  } catch (error) {
    console.error("Unexpected error in getUserMemories:", error);
    return [];
  }
}

export async function addUserMemory(
  userId: string,
  memory: Omit<UserMemory, "id" | "user_id" | "created_at" | "updated_at">
): Promise<UserMemory | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_memories")
      .insert({ ...memory, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error("Supabase error in addUserMemory:", error);
      return null;
    }
    return data as UserMemory;
  } catch (error) {
    console.error("Unexpected error in addUserMemory:", error);
    return null;
  }
}

export async function saveOrUpdateUserMemory(
  userId: string,
  category: string,
  key: string,
  value: string,
  confidence = 1.0,
  source = "chat"
): Promise<UserMemory | null> {
  try {
    const supabase = await createClient();
    
    // Check if key already exists for this user in this category
    const { data: existing } = await supabase
      .from("user_memories")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("key", key)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("user_memories")
        .update({ value, confidence, source })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) {
        console.error("Supabase error updating user memory:", error);
        return null;
      }
      return data as UserMemory;
    } else {
      const { data, error } = await supabase
        .from("user_memories")
        .insert({
          user_id: userId,
          category,
          key,
          value,
          confidence,
          source,
        })
        .select()
        .single();
      if (error) {
        console.error("Supabase error inserting user memory:", error);
        return null;
      }
      return data as UserMemory;
    }
  } catch (error) {
    console.error("Unexpected error in saveOrUpdateUserMemory:", error);
    return null;
  }
}

export async function deleteUserMemory(userId: string, category: string, key: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("user_memories")
      .delete()
      .eq("user_id", userId)
      .eq("category", category)
      .eq("key", key);

    if (error) {
      console.error("Supabase error in deleteUserMemory:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error in deleteUserMemory:", error);
    return false;
  }
}

// Retrieve relevant memories based on query keyword matching (semantic proxy)
export async function searchUserMemories(userId: string, query: string): Promise<UserMemory[]> {
  try {
    const memories = await getUserMemories(userId);
    if (!memories || memories.length === 0) return [];
    
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (queryTokens.length === 0) return memories.slice(0, 5); // Return most recent as fallback

    // Calculate match scores
    const scored = memories.map(m => {
      let score = 0;
      const textToSearch = `${m.category} ${m.key} ${m.value}`.toLowerCase();
      queryTokens.forEach(token => {
        if (textToSearch.includes(token)) {
          score += 1;
        }
      });
      return { memory: m, score };
    });

    // Filter to matches or return top 5 recent if no specific query matched
    const matches = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.memory);
    if (matches.length > 0) return matches.slice(0, 5);
    return memories.slice(0, 5);
  } catch (error) {
    console.error("Error searching user memories:", error);
    return [];
  }
}
