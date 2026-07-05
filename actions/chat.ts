"use server";

import { getMessages, getChats, deleteChat } from "@/lib/supabase/db";
import { createClient } from "@/lib/supabase/server";

export async function fetchChatMessages(chatId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    return await getMessages(chatId);
  } catch (error) {
    console.error("[Actions] Error fetching chat messages:", error);
    return [];
  }
}

export async function fetchUserChats() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    return await getChats(user.id);
  } catch (error) {
    console.error("[Actions] Error fetching user chats:", error);
    return [];
  }
}

export async function removeChat(chatId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    return await deleteChat(chatId);
  } catch (error) {
    console.error("[Actions] Error removing chat:", error);
    return false;
  }
}
