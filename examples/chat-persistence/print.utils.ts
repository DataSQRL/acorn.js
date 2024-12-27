import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";

export const printMessage = (message: ChatCompletionMessageParam) => {
  console.log(`${message.role}: ${message.content}`);
};
