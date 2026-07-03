import { graph } from "./lib/ai/graph";
import { HumanMessage } from "@langchain/core/messages";

async function test() {
  console.log("Testing full LangGraph pipeline via NVIDIA...");
  const stream = await graph.streamEvents(
    { messages: [new HumanMessage("What is 1234 multiplied by 56? Use the calculator tool.")] },
    { version: "v2", configurable: { provider: "nvidia" } } // force NVIDIA since Gemini is rate-limited
  );

  for await (const event of stream) {
    if (event.event === "on_chat_model_stream" && event.data.chunk) {
      const content = event.data.chunk.content;
      if (typeof content === "string" && content.length > 0) {
        process.stdout.write(content);
      }
    }
  }
  console.log("\n✅ Graph pipeline works!");
}

test().catch(e => console.error("❌ Error:", e.message));
