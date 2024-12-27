import { FetchApiQueryExecutor } from "../api";
import { APIFunction } from "../tool";
import {
  APIChatPersistence,
  APIChatPersistenceFactoryConfig,
} from "./api-chat-persistence";
import { ChatPersistence } from "./chat-persistence";
import { ToolChatPersistence } from "./tool-chat-persistance";

export * from "./api-chat-persistence";
export * from "./chat-persistence";

export const chatPersistence = {
  fromApi<TChatMessage>(
    config: APIChatPersistenceFactoryConfig,
  ): APIChatPersistence<TChatMessage> {
    const apiExecutor = new FetchApiQueryExecutor({
      graphqlUri: config.graphQlUri,
    });
    const getMessages = { query: config.getMessagesQuery };
    const saveMessage = { query: config.saveMessageMutation };
    return new APIChatPersistence(apiExecutor, getMessages, saveMessage);
  },
  fromTools<TChatMessage>(getMessages: APIFunction, saveMessage: APIFunction) {
    return new ToolChatPersistence<TChatMessage>(getMessages, saveMessage);
  },
  NONE: {
    get currentState() {
      return [];
    },
    async saveChatMessage(): Promise<string> {
      // return empty string to simulate success
      return "";
    },

    async getChatMessages() {
      return [];
    },
  } as ChatPersistence<unknown>,
};
