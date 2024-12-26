import { Context } from "../tool/context";

export interface ChatPersistence {
  saveChatMessage<T extends {}>(
    message: T,
    context: Context<T>,
  ): Promise<string>;

  getChatMessages<T extends {}, TChatMessage>(
    context: Context<T>,
    limit: number,
  ): Promise<TChatMessage[]>;
}

export const ChatPersistenceNone: ChatPersistence = {
  async saveChatMessage(): Promise<string> {
    return "disabled";
  },

  async getChatMessages<TChatMessage>(): Promise<TChatMessage[]> {
    return [];
  },
};
