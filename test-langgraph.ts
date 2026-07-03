import { graph } from "./lib/ai/graph";
import { HumanMessage } from "@langchain/core/messages";

async function test() {
  console.log("Testing fallback stream events...");
  const stream = await graph.streamEvents(
    { messages: [new HumanMessage("What is 10 divided by 2?")] },
    { version: "v2", configurable: { provider: "nvidia" } } // Force NVIDIA to test fallback/streaming
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

test().catch(e => console.error("❌ Error:", e.message));
