import { Context } from "../tool/context";

export interface ChatPersistence {
  saveChatMessage<T extends {}>(
    message: T,
    context: Context<T>
  ): Promise<string>;

  getChatMessages<T extends {}, TChatMessage>(
    context: Context<T>,
    limit: number
  ): Promise<TChatMessage[]>;
}

// TODO: move to a separate class instance
export const ChatPersistenceNone: ChatPersistence = {
  async saveChatMessage<T extends {}>(
    message: T,
    context: Context<T>
  ): Promise<string> {
    return "disabled";
  },

  async getChatMessages<T extends {}, TChatMessage>(
    context: Context<T>,
    limit: number
  ): Promise<TChatMessage[]> {
    return [];
  },
};
