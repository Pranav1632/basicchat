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

// We will add more tools here in the future
export const tools = [calculatorTool];
