import type { MessageParam } from "@anthropic-ai/sdk/resources/index.mjs";

export const printMessage = (message: MessageParam) => {
  const content = Array.isArray(message.content)
    ? message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
    : message.content;
  console.log(`${message.role}: ${content}`);
};
export const printToolUsage = (message: MessageParam) => {
  if (!Array.isArray(message.content)) {
    return;
  }
  message.content
    .filter((block) => block.type === "tool_use")
    .forEach((block) => {
      console.log(
        `Calling function "${block.name}" with arguments ${JSON.stringify(block.input)}`,
      );
    });
};
