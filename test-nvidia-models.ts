import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { readFileSync } from "node:fs";

function loadEnvValue(name: string) {
  const env = readFileSync(".env", "utf8");
  const line = env.split(/\r?\n/).find((entry) => entry.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, "");
}

const apiKey = process.env.NVIDIA_API_KEY ?? loadEnvValue("NVIDIA_API_KEY");

if (!apiKey) {
  throw new Error("NVIDIA_API_KEY is missing from the environment or .env file.");
}

const modelsToTest = [
  "meta/llama-3.3-70b-instruct",
  "mistralai/mixtral-8x22b-instruct-v0.1",
  "google/gemma-2-2b-it",
  "microsoft/phi-3-mini-128k-instruct"
];

async function testModels() {
  console.log("Starting NVIDIA API Tests...\n");
  
  for (const modelName of modelsToTest) {
    console.log(`Testing model: ${modelName}`);
    try {
      const model = new ChatOpenAI({
        model: modelName,
        apiKey: apiKey,
        configuration: { baseURL: "https://integrate.api.nvidia.com/v1" },
        temperature: 0.2,
        maxTokens: 50,
      });

      const response = await model.invoke([
        new HumanMessage("What is the capital of France? Answer in one word.")
      ]);
      
      console.log(`✅ Success: ${response.content}\n`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.log(`Failed: ${message}\n`);
    }
  }
}

testModels();

