import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

// ─── Gemini (primary) ─────────────────────────────────────────
export function getGeminiModel(modelId = "gemini-2.5-flash-latest") {
  return google(modelId);
}

// ─── NVIDIA NIM (fallback) ────────────────────────────────────
// NVIDIA exposes an OpenAI-compatible endpoint at integrate.api.nvidia.com
const nvidia = createOpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY ?? "",
});

// llama-3.3-70b: free, 70B params — much stronger than gemma-2b for agents
export function getNvidiaModel(modelId = "meta/llama-3.3-70b-instruct") {
  return nvidia(modelId);
}

// ─── Rate-limit detector ──────────────────────────────────────
export function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const msg = error.message.toLowerCase();
  const isQuotaMsg =
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("too many requests") ||
    msg.includes("resource_exhausted");

  const status = (error as { status?: number }).status;
  const isQuotaStatus = status === 429;

  return isQuotaMsg || isQuotaStatus;
}
