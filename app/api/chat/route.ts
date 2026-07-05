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

async function callModelWithRetry(model: any, messages: any[], retries = 3, delay = 2000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.invoke(messages);
    } catch (err: any) {
      const isRateLimit = err?.status === 429 || err?.message?.includes("429") || err?.toString()?.includes("429");
      if (isRateLimit && i < retries - 1) {
        let waitMs = delay;
        if (err?.errorDetails) {
          const retryInfo = err.errorDetails.find((d: any) => d?.retryDelay || d?.["@type"]?.includes("RetryInfo"));
          if (retryInfo?.retryDelay) {
            const seconds = parseInt(retryInfo.retryDelay);
            if (!isNaN(seconds)) {
              waitMs = (seconds + 1) * 1000;
            }
          }
        }
        console.log(`[AI Quota Retry] Hit 429. Waiting ${waitMs}ms before retry... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
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

    const { getUserProfile } = await import("@/lib/supabase/db");
    const userProfile = await getUserProfile(user.id);
    const userApiKey = userProfile?.gemini_api_key || null;

    const { messages, systemPrompt, chatId, agentId } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request: messages array is required", { status: 400 });
    }

    let system = systemPrompt ?? DEFAULT_SYSTEM;
    let model = "gemini-2.5-flash"; // default

    let currentChatId = chatId;
    let currentAgent = null;
    let isNewChat = false;

    // 1. Create a chat if it doesn't exist
    if (!currentChatId) {
      isNewChat = true;
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
          model: "gemini-2.5-flash",
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

    // Enforce 1-2 line limit on text responses for all agents (except code/examples)
    system += "\n\nCRITICAL CONSTRAINT: You must limit all text responses, replies, and explanations to 1 to 2 lines maximum. This limit applies strictly to ordinary text, descriptions, and conversation turns. It does NOT apply to code snippets, code blocks, or markdown code examples.";

    // 2. Save the incoming user message
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === "user" && currentChatId) {
      await addMessage(currentChatId, "user", lastUserMessage.content);
    }

    // Auto-name chat in background if it's a new chat
    if (isNewChat && currentChatId && lastUserMessage?.content) {
      (async () => {
        const { updateChatTitle } = await import("@/lib/supabase/db");
        try {
          const { makeGeminiModel } = await import("@/lib/ai/graph");
          const { HumanMessage } = await import("@langchain/core/messages");
          const titleModel = makeGeminiModel("gemini-2.5-flash", userApiKey);
          const prompt = `Create a short, 3-5 word title for a conversation that starts with the following prompt. Do not use quotes, punctuation, or markdown. Output ONLY the title itself.
          
Prompt: "${lastUserMessage.content}"`;
          const response = await callModelWithRetry(titleModel, [new HumanMessage(prompt)], 2, 1000);
          const generatedTitle = response.content.toString().trim().replace(/^["']|["']$/g, "");
          if (generatedTitle && generatedTitle.length > 0) {
            await updateChatTitle(currentChatId, generatedTitle);
          }
        } catch (e) {
          console.error("[AI Auto-Name] Failed to generate title, falling back to first 4 words:", e);
          let fallbackTitle = lastUserMessage.content.split(/\s+/).slice(0, 4).join(" ");
          if (fallbackTitle.length > 30) {
            fallbackTitle = fallbackTitle.substring(0, 30) + "...";
          }
          if (!fallbackTitle) fallbackTitle = "New Chat";
          await updateChatTitle(currentChatId, fallbackTitle);
        }
      })();
    }

    // Load existing summary if available
    let chatSummary = "";
    if (currentChatId) {
      try {
        const { getChat } = await import("@/lib/supabase/db");
        const chat = await getChat(currentChatId);
        if (chat?.summary) {
          chatSummary = chat.summary;
        }
      } catch (e) {
        console.error("Failed to load chat summary:", e);
      }
    }

    let systemPromptWithSummary = system;
    if (chatSummary) {
      systemPromptWithSummary += `\n\nShort-Term Conversation Summary (earlier messages context):\n${chatSummary}`;
    }

    // Convert Vercel AI SDK messages to LangChain messages.
    // We only pass the last 6 messages to optimize token context, since the summary covers the earlier history.
    const messageLimit = 6;
    const recentMessages = messages.slice(-messageLimit);
    const langchainMessages = recentMessages.map((m: { role: string; content: string }) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    );

    try {
      const stream = await graph.streamEvents(
        { messages: langchainMessages },
        {
          version: "v2",
          configurable: { 
            systemPrompt: systemPromptWithSummary, 
            model,
            userId: user.id,
            chatId: currentChatId,
            agentId: currentAgent?.id || null,
          },
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

              // 4. Background tasks: Short-term summarizer & Long-term memory extraction
              (async () => {
                try {
                  const { makeGeminiModel } = await import("@/lib/ai/graph");
                  const { getChat, updateChatSummary, saveOrUpdateUserMemory } = await import("@/lib/supabase/db");
                  const chat = await getChat(currentChatId);
                  if (!chat || !chat.messages) return;

                  // A. Summarize conversation if history grows
                  if (chat.messages.length > 5) {
                    try {
                      const summaryModel = makeGeminiModel("gemini-2.5-flash", userApiKey);
                      let promptPrompt = "Summarize the following conversation history concisely in 2-3 sentences. Focus on the main topics discussed and key facts shared.";
                      if (chat.summary) {
                        promptPrompt += `\nExisting Summary: "${chat.summary}"`;
                      }
                      const chatContent = chat.messages
                        .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
                        .join("\n");
                      
                      const { HumanMessage } = await import("@langchain/core/messages");
                      const response = await callModelWithRetry(
                        summaryModel,
                        [new HumanMessage(`${promptPrompt}\n\nMessages:\n${chatContent}`)],
                        2,
                        1000
                      );
                      const newSummary = response.content.toString().trim();
                      await updateChatSummary(currentChatId, newSummary);
                    } catch (e) {
                      console.error("[AI Summarizer] Error:", e);
                    }
                  }

                  // B. Intelligent Long-Term Memory Extraction (Step 8 & 9)
                  try {
                    const lastTwo = chat.messages.slice(-2);
                    if (lastTwo.length === 2) {
                      const userMsgLower = lastTwo[0].content.toLowerCase();
                      const memoryKeywords = [
                        "my name", "i am", "i live", "i work", "my job", "my preference", "i prefer", 
                        "favorite", "dislike", "my stack", "my framework", "my hobby", "my hobbies", 
                        "my goal", "my goals", "hobbies", "habit", "remember", "forget", "interest", 
                        "interests", "tech stack", "languages", "concise", "detailed"
                      ];
                      
                      const hasMemoryKeyword = memoryKeywords.some(keyword => userMsgLower.includes(keyword));

                      if (hasMemoryKeyword) {
                        const extractorModel = makeGeminiModel("gemini-2.5-flash", userApiKey);
                        const extractionPrompt = `You are a memory extraction engine. Analyze the following conversation turn to see if the user shared personal profile details, habits, preferences, tech stacks, or goals that are worth remembering for future sessions.
                        
Do NOT extract calculations, greetings, casual jokes, or one-time temporary questions.

Output must be in JSON format:
{
  "decision": "SAVE" | "IGNORE",
  "category": "personal" | "preferences" | "projects" | "communication" | "goals",
  "key": "camelCaseNameOfFact",
  "value": "Description of the fact to remember"
}

Conversation:
User: "${lastTwo[0].content}"
Assistant: "${lastTwo[1].content}"

JSON Output:`;

                        const { HumanMessage } = await import("@langchain/core/messages");
                        const response = await callModelWithRetry(
                          extractorModel,
                          [new HumanMessage(extractionPrompt)],
                          2,
                          1000
                        );
                        const cleanText = response.content.toString().trim().replace(/```json|```/g, "");
                        const parsed = JSON.parse(cleanText);
                        
                        if (parsed.decision === "SAVE" && parsed.category && parsed.key && parsed.value) {
                          await saveOrUpdateUserMemory(user.id, currentAgent?.id || null, parsed.category, parsed.key, parsed.value);
                          console.log(`[Memory Extraction] Saved memory: [${parsed.category}] ${parsed.key} = ${parsed.value}`);
                        }
                      } else {
                        console.log("[Memory Extraction] No profile memory keywords detected. Skipping extraction API call.");
                      }
                    }
                  } catch (e) {
                    console.error("[Memory Extraction] Error:", e);
                  }

                } catch (e) {
                  console.error("[Background Tasks] Error:", e);
                }
              })();
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
