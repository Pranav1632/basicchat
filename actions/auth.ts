"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AuthState = { error?: string; success?: boolean } | undefined;

export async function signInWithEmail(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  let shouldRedirect = false;
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !email.includes("@")) {
      return { error: "Please enter a valid email address." };
    }
    if (!password) {
      return { error: "Please enter your password." };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[Actions] Supabase signIn error:", error);
      return { error: error.message };
    }

    shouldRedirect = true;
  } catch (error) {
    console.error("[Actions] Unexpected error in signInWithEmail:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }

  if (shouldRedirect) {
    redirect("/dashboard");
  }
}

export async function signUpWithEmailAndPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !email.includes("@")) {
      return { error: "Please enter a valid email address." };
    }
    if (!password || password.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      }
    });

    if (error) {
      console.error("[Actions] Supabase signUp error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Actions] Unexpected error in signUpWithEmailAndPassword:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("[Actions] Error signing out:", error);
  } finally {
    redirect("/login");
  }
}
