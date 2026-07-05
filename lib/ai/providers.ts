import { google } from "@ai-sdk/google";

// ─── Gemini (primary) ─────────────────────────────────────────
export function getGeminiModel(modelId = "gemini-2.5-flash-latest") {
  return google(modelId);
}

