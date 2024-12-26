import { APIFunction } from "../../tool";
import type {
  ContentBlockParam,
  Message,
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/index";

/**
 * Convert `APIFunction[]` to array of tools supported by `@anthropic-ai/sdk`
 */
export const toAnthropicAiTools = (tools: APIFunction[]) => {
  return tools.map<Tool>((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: {
      ...t.function.parameters,
      type: t.function.parameters.type as "object",
    },
  }));
};

/**
 * Executes tool calls provided in message and format response as a message with array of tool results
 * @param message Assistant's response message that contains a tool call
 * @param toolDefinitions what tools assistant was supplied with
 * @param toolSummarizationPrompt prompt used to force chatbot to provide summarized answer
 * based on provided tool call results (Default value is `Answer with these tool results`).
 * @returns message with array of content blocks that contain tool call results and text message
 * with instruction to use these results to provide answer to the user's question
 * (It will return array with 1 message if multiple tool calls are disabled in chat config).
 * @example
 * const messageHistory = [];
 * const functionCallResultMessage = await createAnthropicToolResult(
 *   messageWithTools, // assistant message with `tool_use` blocks
 *   jsonTools, // APIFunction[]
 * );
 * // Add function call results to history
 * messageHistory.push(functionCallResultMessage);
 *
 * // send another completion request to get response in a text format.
 * const responseMessage = await client.messages.create({
 *   max_tokens: 1024,
 *   messages: messages,
 *   model: "claude-3-5-sonnet-latest",
 *   tools: toAnthropicAiTools(jsonTools),
 * });
 * // Now `responseMessage` will contain summarized content from tool calls requested in `messageWithTools`
 */
export const createAnthropicToolResult = async (
  message: Message,
  toolDefinitions: APIFunction[],
  toolSummarizationPrompt = "Answer with these tool results",
): Promise<MessageParam> => {
  const toolUseBlocks = message.content.filter(
    (block) => block.type === "tool_use",
  );
  const results = await APIFunction.executeTools(
    toolUseBlocks.map((block) => ({
      name: block.name,
      arguments: block.input as Record<string, unknown>,
    })),
    toolDefinitions,
  );
  const resultBlocks = results.map<ContentBlockParam>((content, idx) => ({
    type: "tool_result",
    tool_use_id: toolUseBlocks[idx].id,
    content,
  }));
  return {
    role: "user",
    content: [
      ...resultBlocks,
      {
        type: "text",
        text: toolSummarizationPrompt,
      },
    ],
  };
};
