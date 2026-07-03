import { LangChainAdapter } from "ai";
import { createClient } from "@/lib/supabase/server";
import { graph } from "@/lib/ai/graph";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

// ⚠️ LangGraph uses AsyncLocalStorage — must run on Node.js, NOT edge runtime
export const runtime = "nodejs";

const DEFAULT_SYSTEM =
  "You are a helpful AI assistant. You have access to tools. Be concise, clear, and friendly. Format your responses using Markdown where appropriate.";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, systemPrompt } = await req.json();
  const system = systemPrompt ?? DEFAULT_SYSTEM;

  // Convert Vercel AI SDK messages to LangChain messages.
  // ⚠️ Do NOT include SystemMessage here — Gemini rejects it in the messages array.
  // We pass the system prompt via the graph's configurable instead (see graph.ts).
  const langchainMessages = messages.map((m: { role: string; content: string }) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );

  try {
    const stream = await graph.streamEvents(
      { messages: langchainMessages },
      {
        version: "v2",
        configurable: { systemPrompt: system, provider: "gemini" },
      }
    );

    // Stream only the final assistant text tokens to the frontend
    const readableStream = new ReadableStream<string>({
      async start(controller) {
        try {
          let hasStreamed = false;
          for await (const event of stream) {
            if (event.event === "on_chat_model_start") {
              hasStreamed = false;
            } else if (event.event === "on_chat_model_stream" && event.data.chunk) {
              const content = event.data.chunk.content;
              if (typeof content === "string" && content.length > 0) {
                hasStreamed = true;
                controller.enqueue(content);
              }
            } else if (event.event === "on_chat_model_end" && event.data.output) {
              const msg = event.data.output;
              if (!hasStreamed && msg && typeof msg.content === "string" && msg.content.length > 0) {
                controller.enqueue(msg.content);
              }
            }
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    // LangChainAdapter converts our string stream into Vercel AI Data Stream Protocol
    const response = LangChainAdapter.toDataStreamResponse(readableStream);

    const headers = new Headers(response.headers);
    headers.set("X-AI-Provider", "langgraph-gemini-2.5-flash");
    headers.set("Access-Control-Expose-Headers", "X-AI-Provider");

    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    console.error("[AI] LangGraph Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}