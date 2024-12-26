import { APIFunction } from "../../tool";
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
} from "openai/resources";

/**
 * Convert `APIFunction[]` to array of tools supported by `openai`
 */
export const toOpenAiTools = (tools: APIFunction[]) => {
  return tools.map<ChatCompletionTool>((t) => ({
    type: "function",
    function: {
      ...t.function,
      additionalProperties: false,
    },
    strict: true,
  }));
};

/**
 * Executes tool calls provided in message and format response as an array of tool message
 * @param message Assistant's response message that contains a tool calls
 * @param toolDefinitions what tools assistant was supplied with
 * @returns array of messages with tool call results that should to be added to the history
 * (It will return array with 1 message if multiple tool calls are disabled in chat config).
 * @example
 * const messageHistory = [];
 * const functionCallResultMessage = await createOpenAiToolResults(
 *   responseWithTools.choices[0].message, // assistant message with `tool_calls`
 *   jsonTools, // APIFunction[]
 * );
 * // Add function call results to history
 * messageHistory.push(...functionCallResultMessages);
 *
 * // send another completion request to get response in a text format.
 * const responseMessage = await openai.chat.completions.create({
 *   model: "gpt-4o",
 *   messages,
 * });
 * // Now `responseMessage` will contain summarized content from tool calls requested in `responseWithTools`
 */
export const createOpenAiToolResults = async (
  message: ChatCompletionAssistantMessageParam,
  toolDefinitions: APIFunction[],
): Promise<ChatCompletionToolMessageParam[]> => {
  if (!message.tool_calls) {
    return [];
  }
  const toolCalls = message.tool_calls;

  const results = await APIFunction.executeTools(
    toolCalls.map((toolCall) => ({
      name: toolCall.function.name,
      arguments: JSON.parse(toolCall.function.arguments),
    })),
    toolDefinitions,
  );
  const messages = results.map<ChatCompletionToolMessageParam>(
    (content, idx) => ({
      role: "tool",
      content: content || "",
      tool_call_id: toolCalls[idx].id,
    }),
  );
  return messages;
};
