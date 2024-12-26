import { createToolsFromApiUri } from "@datasqrl/acorn-node";
import { OpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { printMessage, printToolUsage } from "./print.utils";
import {
  createOpenAiToolResults,
  toOpenAiTools,
} from "@datasqrl/acorn-node/openai";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY env variable is missing!");
  process.exit(1);
}

const bootstrap = async () => {
  // Create Tools from API
  const jsonTools = await createToolsFromApiUri({
    // See https://rickandmortyapi.com for more info
    graphqlUri: "https://rickandmortyapi.graphcdn.app/",
    enableValidation: true,
  });

  // TODO: replace with GraphQLMemorySaver
  const messages: ChatCompletionMessageParam[] = [];

  const userRequest: ChatCompletionMessageParam = {
    role: "user",
    content: "Show top 3 characters from location Earth (C-137)",
  };
  messages.push(userRequest);
  printMessage(userRequest);

  const openai = new OpenAI();
  // Send user message
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    tools: toOpenAiTools(jsonTools),
  });

  // Add message to history
  messages.push(response.choices[0].message);
  printToolUsage(response.choices[0].message);

  // Process function calls
  const functionCallResultMessages = await createOpenAiToolResults(
    response.choices[0].message,
    jsonTools,
  );
  // Add function call results to history
  messages.push(...functionCallResultMessages);

  if (!functionCallResultMessages.length) {
    console.log("No functions were called");
    return;
  }
  // If there were any function calls
  // send another completion request to get response in a text format.
  const final_response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
  });

  printMessage(final_response.choices[0].message);
};
bootstrap();
