import { LangChainAdapter } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getAgents, getAgent, createAgent, createChat, addMessage } from "@/lib/supabase/db";
import { graph } from "@/lib/ai/graph";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

// ⚠️ LangGraph uses AsyncLocalStorage — must run on Node.js, NOT edge runtime
export const runtime = "nodejs";

const DEFAULT_SYSTEM =
  "You are a helpful AI assistant. You have access to tools. Be concise, clear, and friendly. Format your responses using Markdown where appropriate.";

function extractTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, systemPrompt, chatId, agentId } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request: messages array is required", { status: 400 });
    }

    let system = systemPrompt ?? DEFAULT_SYSTEM;
    let model = "gemini-2.0-flash-lite"; // default

    let currentChatId = chatId;
    let currentAgent = null;

    // 1. Create a chat if it doesn't exist
    if (!currentChatId) {
      if (agentId) {
        currentAgent = await getAgent(agentId);
      }
      
      if (!currentAgent) {
        const agents = await getAgents(user.id);
        currentAgent = agents[0];
      }
      
      if (!currentAgent) {
        currentAgent = await createAgent(user.id, {
          name: "AI Assistant",
          model: "gemini-2.0-flash-lite",
          system_prompt: system,
          temperature: 0.7,
          description: "Default AI Assistant",
        }) as NonNullable<Awaited<ReturnType<typeof createAgent>>>;
      }
      
      if (currentAgent) {
        const newChat = await createChat(user.id, currentAgent.id, "New Chat");
        currentChatId = newChat?.id;
      }
    } else {
      // If chat exists, we need to load its agent to use the right model & prompt
      const { getChat } = await import("@/lib/supabase/db");
      const chat = await getChat(currentChatId);
      if (chat && chat.agent) {
        currentAgent = chat.agent;
      }
    }

    // Set the specific agent's prompt and model
    if (currentAgent) {
      system = currentAgent.system_prompt || system;
      model = currentAgent.model || model;
    }

    // 2. Save the incoming user message
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === "user" && currentChatId) {
      await addMessage(currentChatId, "user", lastUserMessage.content);
    }

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
          configurable: { systemPrompt: system, model },
        }
      );

      // Stream only the final assistant text tokens to the frontend
      const readableStream = new ReadableStream<string>({
        async start(controller) {
          let fullAssistantMessage = ""; // Buffer for the final message
          try {
            let hasStreamed = false;
            for await (const event of stream) {
              if (event.event === "on_chat_model_start") {
                hasStreamed = false;
              } else if (event.event === "on_chat_model_stream" && event.data.chunk) {
                const content = extractTextContent(event.data.chunk.content);
                if (content.length > 0) {
                  hasStreamed = true;
                  fullAssistantMessage += content;
                  controller.enqueue(content);
                }
              } else if (event.event === "on_chat_model_end" && event.data.output) {
                const msg = event.data.output;
                const content = extractTextContent(msg?.content);
                if (!hasStreamed && content.length > 0) {
                  fullAssistantMessage += content;
                  controller.enqueue(content);
                }
              }
            }
          } catch (e) {
            controller.error(e);
          } finally {
            // 3. Save the final AI response
            if (currentChatId && fullAssistantMessage.length > 0) {
              await addMessage(currentChatId, "assistant", fullAssistantMessage);
            }
            controller.close();
          }
        },
      });

      // LangChainAdapter converts our string stream into Vercel AI Data Stream Protocol
      const response = LangChainAdapter.toDataStreamResponse(readableStream);

      const headers = new Headers(response.headers);
      headers.set("X-AI-Provider", `langgraph-${model}`);
      headers.set("Access-Control-Expose-Headers", "X-AI-Provider, X-Chat-Id");
      if (currentChatId) {
        headers.set("X-Chat-Id", currentChatId);
      }

      return new Response(response.body, { status: response.status, headers });
    } catch (error) {
      console.error("[AI] LangGraph Error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to process chat pipeline." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[AI API] Chat Route Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred while setting up the chat." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
