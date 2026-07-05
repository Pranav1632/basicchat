import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// ─── Gemini (primary) ─────────────────────────────────────────
export function getLangChainGeminiModel(modelName = "gemini-2.5-flash") {
  return new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    temperature: 0.7,
  });
}

