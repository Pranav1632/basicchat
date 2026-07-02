import { LangChainAdapter } from "ai";
import { createClient } from "@/lib/supabase/server";
import { graph } from "@/lib/ai/graph";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

export const runtime = "edge";

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

  // Convert Vercel AI SDK messages to LangChain messages
  const langchainMessages = [
    new SystemMessage(system),
    ...messages.map((m: any) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ];

  try {
    // We try to run the graph. By default it uses Gemini. 
    // If we wanted to use NVIDIA as fallback upon failure, we could pass { provider: "nvidia" } in config.
    // However, LangGraph's streamEvents executes immediately and returns a stream. 
    // A robust rate limit fallback requires intercepting errors in the stream or invoking the graph with a retry loop, 
    // which is complex with streams. For now, we'll stream from Gemini.

    const stream = await graph.streamEvents(
      { messages: langchainMessages },
      { version: "v2", configurable: { systemPrompt: system, provider: "gemini" } }
    );

    // Create a typed ReadableStream<string> from the LangGraph events
    const readableStream = new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const event of stream) {
            // We only want the stream output from the main model
            if (event.event === "on_chat_model_stream" && event.data.chunk) {
              const content = event.data.chunk.content;
              if (typeof content === "string" && content.length > 0) {
                controller.enqueue(content);
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

    // Let Vercel AI SDK handle the formatting, flushing, and headers
    const response = LangChainAdapter.toDataStreamResponse(readableStream);
    
    // Add our custom provider header
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