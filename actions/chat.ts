"use server";

import { getMessages, getChats, deleteChat } from "@/lib/supabase/db";
import { createClient } from "@/lib/supabase/server";

export async function fetchChatMessages(chatId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return getMessages(chatId);
}

export async function fetchUserChats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return getChats(user.id);
}

export async function removeChat(chatId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return deleteChat(chatId);
}
