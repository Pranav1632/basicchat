import { MessagesAnnotation, StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage } from "@langchain/core/messages";
import { tools } from "./tools";

// ─── Model factory functions ──────────────────────────────────
function makeGeminiModel(modelName?: string) {
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

  // Bind tools
  const firstIsSystem = messages[0]?._getType?.() === "system";
  const fullMessages = firstIsSystem
    ? messages
    : [new SystemMessage(systemPrompt), ...messages];

  try {
    const gemini = makeGeminiModel(modelName).bindTools(tools);
    const response = await gemini.invoke(fullMessages);
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
