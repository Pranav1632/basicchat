import { graph } from "./lib/ai/graph";
import { HumanMessage } from "@langchain/core/messages";

async function test() {
  const stream = await graph.streamEvents(
    { messages: [new HumanMessage("What is 2 + 2?")] },
    { version: "v2" }
  );

  console.log("Starting stream...");
  for await (const event of stream) {
    if (event.event === "on_chat_model_stream") {
      console.log("CHUNK:", event.data.chunk?.content);
    }
  }
  console.log("Stream finished.");
}

test().catch(console.error);
