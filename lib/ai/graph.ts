import { MessagesAnnotation, StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage } from "@langchain/core/messages";
import { tools } from "./tools";

// ─── Model factory functions ──────────────────────────────────
export function makeGeminiModel(modelName?: string) {
  let targetModel = modelName || "gemini-2.5-flash";
  // Fall back to gemini-2.5-flash if the requested model is hitting quota limits (lite/pro) or is an old Nvidia model
  if (
    targetModel === "gemini-2.0-flash-lite" ||
    targetModel === "gemini-2.5-pro" ||
    targetModel.includes("llama") ||
    targetModel.includes("nvidia") ||
    targetModel.includes("gemma")
  ) {
    targetModel = "gemini-2.5-flash";
  }

  return new ChatGoogleGenerativeAI({
    model: targetModel,
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    temperature: 0.7,
    maxRetries: 0,
    streaming: true, // Forces streaming chunks
  });
}

async function invokeModelWithRetry(geminiModel: any, messages: any[], retries = 3, delay = 2000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await geminiModel.invoke(messages);
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
        console.log(`[AI Quota Retry] Main model hit 429. Waiting ${waitMs}ms before retry... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}

// ─── Tool node ────────────────────────────────────────────────
const toolNode = new ToolNode(tools);

// ─── Agent node ───────────────────────────────────────────────
async function callModel(
  state: typeof MessagesAnnotation.State,
  config: import("@langchain/core/runnables").RunnableConfig
) {
  const { messages } = state;
  const systemPrompt =
    config?.configurable?.systemPrompt ??
    "You are a helpful AI assistant. Be concise, clear, and friendly.";
  const modelName = config?.configurable?.model;
  const userId = config?.configurable?.userId;
  const agentId = config?.configurable?.agentId ?? null;

  let fullSystemPrompt = systemPrompt;
  if (userId) {
    try {
      const { searchUserMemories } = await import("../supabase/db");
      const lastUserMsg = messages[messages.length - 1]?.content?.toString() || "";
      const memories = await searchUserMemories(userId, agentId, lastUserMsg);
      if (memories && memories.length > 0) {
        fullSystemPrompt += "\n\nRelevant things you remember about the user (Long-Term Memory):\n" + 
          memories.map((m) => `- [${m.category}] ${m.key}: ${m.value}`).join("\n");
      }
    } catch (e) {
      console.error("Failed to load user memories:", e);
    }
  }

  // Bind tools
  const firstIsSystem = messages[0]?._getType?.() === "system";
  const fullMessages = firstIsSystem
    ? messages
    : [new SystemMessage(fullSystemPrompt), ...messages];

  try {
    const gemini = makeGeminiModel(modelName).bindTools(tools);
    const response = await invokeModelWithRetry(gemini, fullMessages, 3, 2000);
    return { messages: [response] };
  } catch (err: unknown) {
    console.error("[AI] Error calling Gemini model:", err);
    throw err;
  }
}

// ─── Routing ──────────────────────────────────────────────────
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolCalls = (lastMessage as import("@langchain/core/messages").AIMessage)?.tool_calls;
  return Array.isArray(toolCalls) && toolCalls.length > 0 ? "tools" : END;
}

// ─── Graph ────────────────────────────────────────────────────
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

export const graph = workflow.compile();
