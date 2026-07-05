import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const calculatorTool = tool(
  async ({ operation, a, b }) => {
    switch (operation) {
      case "add":
        return (a + b).toString();
      case "subtract":
        return (a - b).toString();
      case "multiply":
        return (a * b).toString();
      case "divide":
        if (b === 0) return "Error: Cannot divide by zero.";
        return (a / b).toString();
      default:
        return "Error: Unknown operation.";
    }
  },
  {
    name: "calculator",
    description: "Performs basic arithmetic operations (add, subtract, multiply, divide).",
    schema: z.object({
      operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("The arithmetic operation to perform."),
      a: z.number().describe("The first number."),
      b: z.number().describe("The second number."),
    }),
  }
);

export const wikipediaTool = tool(
  async ({ query }) => {
    try {
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
      const data = await res.json();
      const results = data.query?.search;
      if (!results || results.length === 0) return "No results found.";
      return results.slice(0, 3).map((r: { title: string; snippet: string }) => `Title: ${r.title}\nSnippet: ${r.snippet.replace(/<\/?[^>]+(>|$)/g, "")}`).join("\n\n");
    } catch {
      return "Failed to search Wikipedia.";
    }
  },
  {
    name: "wikipedia",
    description: "Search Wikipedia for information on any topic, person, or historical event.",
    schema: z.object({
      query: z.string().describe("The search query."),
    }),
  }
);

export const databaseStatsTool = tool(
  async ({ userId }) => {
    try {
      const { getDashboardStats } = await import("../supabase/db");
      const stats = await getDashboardStats(userId);
      return `User Stats:\nTotal Chats: ${stats.totalChats}\nTotal Agents: ${stats.totalAgents}\nTotal Documents: ${stats.totalDocuments}\nTotal Messages: ${stats.totalMessages}`;
    } catch {
      return "Failed to retrieve database stats.";
    }
  },
  {
    name: "database_stats",
    description: "Retrieves the current usage statistics (chats, messages, agents, documents) for a user from the Supabase database.",
    schema: z.object({
      userId: z.string().describe("The ID of the user to get stats for. You should ask the user for this if you don't know it, or use 'default' if running tests."),
    }),
  }
);

export const saveUserFactTool = tool(
  async ({ fact }, config) => {
    const userId = config?.configurable?.userId;
    if (!userId) return "Error: User ID not provided in system configuration.";
    
    const { addUserMemory } = await import("../supabase/db");
    const success = await addUserMemory(userId, fact);
    if (!success) return "Error: Failed to save fact to long-term memory.";
    
    return `Successfully remembered fact: "${fact}"`;
  },
  {
    name: "save_user_fact",
    description: "Saves a permanent fact or preference about the user to their long-term memory across chats (e.g. name, coding interests, preferred frameworks). Use this when the user mentions something personal about themselves or their preferred tech stack.",
    schema: z.object({
      fact: z.string().describe("The fact or preference to remember about the user."),
    }),
  }
);

export const tools = [calculatorTool, wikipediaTool, databaseStatsTool, saveUserFactTool];
