"use server";

import { getAgents, createAgent, deleteAgent } from "@/lib/supabase/db";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function fetchUserAgents() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return getAgents(user.id);
}

export async function createNewAgent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const model = formData.get("model") as string;
  const system_prompt = formData.get("system_prompt") as string;
  const description = formData.get("description") as string;

  if (!name || !model) throw new Error("Missing required fields");

  await createAgent(user.id, {
    name,
    model,
    system_prompt: system_prompt || "You are a helpful AI assistant.",
    temperature: 0.7,
    description: description || "",
  });

  revalidatePath("/agents");
  revalidatePath("/chat");
}

export async function removeAgent(agentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await deleteAgent(agentId);
  revalidatePath("/agents");
  revalidatePath("/chat");
}
