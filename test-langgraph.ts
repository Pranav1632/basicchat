import { readFileSync } from "node:fs";

function loadEnv() {
  try {
    const env = readFileSync(".env", "utf8");
    for (const line of env.split(/\r?\n/)) {
      if (line.includes("=")) {
        const [key, ...valueParts] = line.split("=");
        const value = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
        process.env[key.trim()] = value;
      }
    }
  } catch {
    // Ignore
  }
}
loadEnv();

async function test() {
  const { graph } = await import("./lib/ai/graph");
  const { HumanMessage } = await import("@langchain/core/messages");

  console.log("Testing fallback stream events...");
  const stream = await graph.streamEvents(
    { messages: [new HumanMessage("What is 10 divided by 2?")] },
    { version: "v2", configurable: { model: "gemini-2.5-flash" } } // Test Gemini streaming
  );

  let chunkCount = 0;
  for await (const event of stream) {
    if (event.event === "on_chat_model_stream" && event.data.chunk) {
      chunkCount++;
      const content = event.data.chunk.content;
      if (typeof content === "string" && content.length > 0) {
        process.stdout.write(content);
      }
    }
  }
  console.log(`\n✅ Graph pipeline finished! Chunks received: ${chunkCount}`);
}

test().catch(e => {
  console.error("❌ Error:");
  console.error(e);
});
