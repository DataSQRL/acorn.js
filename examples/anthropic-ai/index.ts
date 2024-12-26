import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/index.mjs";
import { createToolsFromApiUri } from "@datasqrl/acorn-node";
import { printMessage, printToolUsage } from "./print.utils";
import {
  createAnthropicToolResult,
  toAnthropicAiTools,
} from "@datasqrl/acorn-node/anthropic";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY env variable is missing!");
  process.exit(1);
}

const bootstrap = async () => {
  // Create Tools from API
  const jsonTools = await createToolsFromApiUri({
    // See https://rickandmortyapi.com for more info
    graphqlUri: "https://rickandmortyapi.graphcdn.app/",
    enableValidation: true,
  });

  // replace with GraphQLMemorySaver
  const messages: MessageParam[] = [];

  const userRequest: MessageParam = {
    role: "user",
    content: "Show info about character with ID #1",
  };
  messages.push(userRequest);
  printMessage(userRequest);

  const client = new Anthropic();

  // Send user message
  const message = await client.messages.create({
    max_tokens: 1024,
    messages,
    model: "claude-3-5-sonnet-latest",
    tools: toAnthropicAiTools(jsonTools),
  });

  // Add message to history
  messages.push({ role: message.role, content: message.content });
  printMessage(message);
  printToolUsage(message);

  // Process function calls
  const functionCallResultMessage = await createAnthropicToolResult(
    message,
    jsonTools,
  );
  // Add function call results to history
  messages.push(functionCallResultMessage);

  if (!functionCallResultMessage.content.length) {
    console.log("No functions were called");
    return;
  }
  // If there were any function calls
  // send another completion request to get response in a text format.
  const finalMessage = await client.messages.create({
    max_tokens: 1024,
    messages,
    model: "claude-3-5-sonnet-latest",
    tools: toAnthropicAiTools(jsonTools),
  });

  printMessage(finalMessage);
};
bootstrap();
