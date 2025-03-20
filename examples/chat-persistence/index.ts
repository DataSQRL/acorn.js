import {
  ChatPersistence,
  chatPersistence,
  createToolsFromApiUri,
} from "@datasqrl/acorn";
import { toOpenAiTools } from "@datasqrl/acorn/openai";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { printMessage } from "./print.utils";
import { v4 } from "uuid";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY env variable is missing!");
  process.exit(1);
}

// Returns common data used to save chat messages
const getCustomerContext = () => ({
  customerid: 42,
  timestamp: new Date().toISOString(),
  uuid: v4(),
});

// Prefill message history with some data if it is empty so chat have some context to work with
const prefillMessageHistoryIfEmpty = async (
  messageStore: ChatPersistence<ChatCompletionMessageParam>,
) => {
  if (messageStore.currentState.length > 0) {
    // no need to prefill
    return;
  }
  const messages = [
    "I like spicy food",
    "I like to play soccer",
    "I hate rainy days",
  ];
  for (const message of messages) {
    const params: ChatCompletionMessageParam = {
      role: "user",
      content: message,
    };
    await messageStore.saveChatMessage(params, {
      ...params,
      ...getCustomerContext(),
    });
  }
};

const bootstrap = async () => {
  // Get all tools from the API
  const allTools = await createToolsFromApiUri({
    graphqlUri: "http://localhost:8888/graphql",
    enableValidation: true,
  });

  // Extract chat message related mutation and query from tools
  const saveMessageTool = allTools.find(
    (tool) => tool.getName() === "InternalSaveChatMessage",
  );
  const getMessagesTool = allTools.find(
    (tool) => tool.getName() === "InternalGetChatMessages",
  );
  if (!saveMessageTool || !getMessagesTool) {
    throw new Error("Chat message tools not found");
  }
  // And remove them from the tool list so these functions are not called by the chatbot
  const chatTools = allTools.filter(
    (tool) =>
      !["InternalSaveChatMessage", "InternalGetChatMessages"].includes(
        tool.getName(),
      ),
  );

  // You can also use `chatPersistence.fromApi` to manually specify GraphQL query and mutation
  const messageStore = chatPersistence.fromTools<ChatCompletionMessageParam>(
    getMessagesTool,
    saveMessageTool,
  );

  // Fetch initial messages
  await messageStore.getChatMessages({
    limit: 10,
    customerid: 42,
  });

  await prefillMessageHistoryIfEmpty(messageStore);

  // Send user message
  const userMessage: ChatCompletionMessageParam = {
    role: "user",
    content: "Summarize the last 3 messages of this discussion",
  };
  // Save this message to the chat store
  await messageStore.saveChatMessage(userMessage, {
    ...userMessage,
    ...getCustomerContext(),
  });

  const openai = new OpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messageStore.currentState,
    tools: toOpenAiTools(chatTools),
  });
  const responseMessage = response.choices[0].message;

  // Save the response to the chat store
  await messageStore.saveChatMessage(responseMessage, {
    role: responseMessage.role,
    content: responseMessage.content || "",
    functionCall: responseMessage.tool_calls
      ? JSON.stringify(responseMessage.tool_calls)
      : undefined,
    ...getCustomerContext(),
  });

  // The last message in store is the response
  printMessage(messageStore.currentState[messageStore.currentState.length - 1]);
};
bootstrap();
