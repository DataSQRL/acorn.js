import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  isAIMessage,
  isToolMessage,
  MessageContentText,
  MessageType,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";

import {
  DataSQRLChatMessage,
  PersistentSaverFormatters,
} from "./persistence-saver";
import { v4 } from "uuid";

const baseMessageMappers: Record<
  MessageType,
  (apiMessage: DataSQRLChatMessage) => BaseMessage | null
> = {
  human: (m) =>
    new HumanMessage({
      content: m.content,
      name: m.name,
    }),
  ai: (m) =>
    new AIMessage({
      content: m.content,
      name: m.name,
      tool_calls: m.functionCall ? JSON.parse(m.functionCall) : undefined,
    }),
  generic: (m) =>
    new SystemMessage({
      content: m.content,
      name: m.name,
    }),
  developer: (m) =>
    new SystemMessage({
      content: m.content,
      name: m.name,
    }),
  system: (m) =>
    new SystemMessage({
      content: m.content,
      name: m.name,
    }),
  function: (m) =>
    new AIMessage({
      content: m.content,
      name: m.name,
      tool_calls: m.functionCall ? JSON.parse(m.functionCall) : undefined,
    }),
  tool: (m) =>
    new ToolMessage({
      content: m.content,
      name: m.name,
      ...JSON.parse(m.functionCall || "{}"), // here `functionCall` should contain { tool_call_id: "" } object
    }),
  remove: () => null,
};

// default formatters designed for usage with DataSQRL Chat API
const defaultDataSqrlApi: PersistentSaverFormatters<DataSQRLChatMessage> = {
  messageToMutationVariables: (message, config) => ({
    uuid: v4(),
    role: message.getType(),
    content: Array.isArray(message.content)
      ? message.content
          .filter((block) => block.type === "text")
          .map((block) => (block as MessageContentText).text)
          .join("\n")
      : message.content,
    customerid: config.configurable?.thread_id,
    timestamp: new Date().toISOString(),
    functionCall:
      isAIMessage(message) && message.tool_calls?.length
        ? JSON.stringify(message.tool_calls)
        : isToolMessage(message)
          ? JSON.stringify({
              tool_call_id: message.tool_call_id,
            })
          : undefined,
    name: message.name,
  }),
  messageToApiMessage: (message, config) => ({
    uuid: v4(),
    role: message.getType(),
    content: Array.isArray(message.content)
      ? message.content
          .filter((block) => block.type === "text")
          .map((block) => (block as MessageContentText).text)
          .join("\n")
      : message.content,
    customerid: config.configurable?.thread_id,
    timestamp: new Date().toISOString(),
    functionCall:
      isAIMessage(message) && message.tool_calls?.length
        ? JSON.stringify(message.tool_calls)
        : isToolMessage(message)
          ? JSON.stringify({
              name: message.name,
              tool_call_id: message.tool_call_id,
            })
          : undefined,
    name: message.name,
  }),
  queryResponseToMessageList: (apiMessages) => {
    return apiMessages
      .map((apiMessage) => {
        const mapper = baseMessageMappers[apiMessage.role as MessageType];
        return mapper?.(apiMessage);
      })
      .filter(Boolean) as BaseMessage[];
  },
};

export const persistenceFormatters = {
  defaultDataSqrlApi,
  baseMessageMappers,
};
