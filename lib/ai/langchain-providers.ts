import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

// ─── Gemini (primary) ─────────────────────────────────────────
export function getLangChainGeminiModel(modelName = "gemini-2.5-flash") {
  return new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    temperature: 0.7,
  });
}

// ─── NVIDIA NIM (fallback) ────────────────────────────────────
// Using ChatOpenAI as a client for OpenAI-compatible endpoints like NVIDIA
export function getLangChainNvidiaModel(modelName = "meta/llama-3.3-70b-instruct") {
  return new ChatOpenAI({
    modelName: modelName,
    openAIApiKey: process.env.NVIDIA_API_KEY,
    configuration: {
      baseURL: "https://integrate.api.nvidia.com/v1",
    },
    temperature: 0.7,
  });
}
