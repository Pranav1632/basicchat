import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, systemPrompt, model = "gpt-4o-mini" } = await req.json();

  const result = streamText({
    model: openai(model),
    system:
      systemPrompt ??
      "You are a helpful AI assistant. Be concise, clear, and friendly.",
    messages,
  });

  return result.toDataStreamResponse();
}