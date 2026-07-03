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
  });
}

function makeNvidiaModel() {
  return new ChatOpenAI({
    model: "meta/llama-3.3-70b-instruct",
    apiKey: process.env.NVIDIA_API_KEY,          // ✅ correct field name
    configuration: { baseURL: "https://integrate.api.nvidia.com/v1" },
    temperature: 0.7,
  });
}

// ─── Tool node ────────────────────────────────────────────────
const toolNode = new ToolNode(tools);

// ─── Agent node ───────────────────────────────────────────────
async function callModel(
  state: typeof MessagesAnnotation.State,
  config: any
) {
  const { messages } = state;
  const systemPrompt =
    config?.configurable?.systemPrompt ??
    "You are a helpful AI assistant. Be concise, clear, and friendly.";
  const provider = config?.configurable?.provider ?? "gemini";

  const baseModel =
    provider === "nvidia" ? makeNvidiaModel() : makeGeminiModel();

  // Bind tools
  const firstIsSystem = messages[0]?._getType?.() === "system";
  const fullMessages = firstIsSystem
    ? messages
    : [new SystemMessage(systemPrompt), ...messages];

  // Try Gemini first, fall back to NVIDIA on rate limit / quota error
  let response;
  try {
    const gemini = makeGeminiModel().bindTools(tools);
    response = await gemini.invoke(fullMessages);
  } catch (err: any) {
    const is429 =
      err?.status === 429 ||
      err?.message?.includes("quota") ||
      err?.message?.includes("rate limit");
    if (is429) {
      console.warn("[AI] Gemini rate limit — using NVIDIA llama-3.3-70b fallback");
      const nvidia = makeNvidiaModel().bindTools(tools);
      response = await nvidia.invoke(fullMessages);
    } else {
      throw err;
    }
  }

  return { messages: [response!] };
}

// ─── Routing ──────────────────────────────────────────────────
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolCalls = (lastMessage as any)?.tool_calls;
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
