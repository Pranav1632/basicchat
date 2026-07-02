import { MessagesAnnotation, StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tools } from "./tools";
import { getLangChainGeminiModel, getLangChainNvidiaModel } from "./langchain-providers";

// 1. Define the tools node
const toolNode = new ToolNode(tools);

// 2. Define the agent node
async function callModel(state: typeof MessagesAnnotation.State, config: any) {
  const { messages } = state;
  const systemPrompt = config?.configurable?.systemPrompt || "You are a helpful AI assistant. You can use tools to help answer questions.";
  const provider = config?.configurable?.provider || "gemini";
  
  // Select the model based on configuration
  let model;
  if (provider === "nvidia") {
    model = getLangChainNvidiaModel();
  } else {
    model = getLangChainGeminiModel();
  }

  // Bind tools to the model
  const modelWithTools = model.bindTools(tools);
  
  // Add system prompt if we have messages and the first isn't a system message
  // For simplicity, we just pass messages to the model. In production, we'd ensure system prompt is included.
  const response = await modelWithTools.invoke(messages);
  
  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// 3. Define the router function
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.additional_kwargs?.tool_calls?.length || (lastMessage as any).tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user)
  return END;
}

// 4. Build the graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

// Compile the graph
export const graph = workflow.compile();
