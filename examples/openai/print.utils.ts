import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";

export const printMessage = (message: ChatCompletionMessageParam) => {
  console.log(`${message.role}: ${message.content}`);
};

export const printToolUsage = (
  message: ChatCompletionAssistantMessageParam,
) => {
  message.tool_calls?.forEach((tool) => {
    console.log(
      `Calling function "${tool.function.name}" with arguments ${tool.function.arguments}`,
    );
  });
};
