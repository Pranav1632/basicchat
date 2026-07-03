import { MessagesAnnotation, StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage } from "@langchain/core/messages";
import { tools } from "./tools";

// ─── Model factory functions ──────────────────────────────────
function makeGeminiModel() {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite", // Quota-friendly, confirmed available, works with tools
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    temperature: 0.7,
    maxRetries: 0,
    streaming: true, // Forces streaming chunks
  });
}

function makeNvidiaModel() {
  return new ChatOpenAI({
    model: "meta/llama-3.3-70b-instruct",
    apiKey: process.env.NVIDIA_API_KEY,          // ✅ correct field name
    configuration: { baseURL: "https://integrate.api.nvidia.com/v1" },
    temperature: 0.7,
    maxRetries: 1,
    timeout: 60000,
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
  const provider =
    config?.configurable?.provider === "nvidia" ? "nvidia" : "gemini";

  // Bind tools
  const firstIsSystem = messages[0]?._getType?.() === "system";
  const fullMessages = firstIsSystem
    ? messages
    : [new SystemMessage(systemPrompt), ...messages];

  const invokeNvidia = async () => makeNvidiaModel().bindTools(tools).invoke(fullMessages);

  // Try Gemini first, fall back to NVIDIA on rate limit / quota error.
  // If the route already selected an NVIDIA agent, skip Gemini entirely.
  let response;
  if (provider === "nvidia") {
    response = await invokeNvidia();
    return { messages: [response] };
  }

  try {
    const gemini = makeGeminiModel().bindTools(tools);
    response = await gemini.invoke(fullMessages);
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    const is429 =
      error?.status === 429 ||
      error?.message?.includes("quota") ||
      error?.message?.includes("rate limit");
    if (is429) {
      console.warn("[AI] Gemini rate limit — using NVIDIA llama-3.3-70b fallback");
      response = await invokeNvidia();
    } else {
      throw err;
    }
  }

  return { messages: [response!] };
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
