import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { readFileSync } from "node:fs";

function loadEnvValue(name: string) {
  try {
    const env = readFileSync(".env", "utf8");
    const line = env.split(/\r?\n/).find((entry) => entry.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, "");
  } catch {
    return undefined;
  }
}

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? loadEnvValue("GOOGLE_GENERATIVE_AI_API_KEY");

if (!apiKey) {
  throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is missing from the environment or .env file.");
}

const modelsToTest = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro"
];

async function testModels() {
  console.log("Starting Gemini API Tests...\n");
  
  for (const modelName of modelsToTest) {
    console.log(`Testing model: ${modelName}`);
    try {
      const model = new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: apiKey,
        temperature: 0.2,
        maxRetries: 0,
      });

      const response = await model.invoke([
        new HumanMessage("What is the capital of France? Answer in one word.")
      ]);
      
      console.log(`✅ Success: ${response.content.toString().trim()}\n`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.log(`❌ Failed: ${message}\n`);
    }
  }
}

testModels();
