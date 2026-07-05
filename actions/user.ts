"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveUserApiKey(apiKey: string | null) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
      .from("users")
      .update({ gemini_api_key: apiKey })
      .eq("id", user.id);

    if (error) {
      console.error("[Actions] Supabase error in saveUserApiKey:", error);
      return { error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    console.error("[Actions] Error in saveUserApiKey:", error);
    return { error: error?.message || "An unexpected error occurred." };
  }
}
