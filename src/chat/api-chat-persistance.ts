import { APIQuery } from "../api/api-query";
import { APIQueryExecutor } from "../api/api-query-executor";
import { Context } from "../tool/context";
import { FunctionUtil } from "../tool/function.utils";
import { ChatPersistence } from "./chat-persistence";

export class APIChatPersistence implements ChatPersistence {
  constructor(
    private apiExecutor: APIQueryExecutor,
    private saveMessage: APIQuery,
    private getMessages: APIQuery,
    private getMessageContextKeys: Set<string>,
  ) {}

  /**
   * Saves the generic chat message with the configured context asynchronously (i.e. does not block).
   * @param message Chat message to save.
   * @param context Context object.
   * @returns A Promise that resolves to the result as a string.
   */
  async saveChatMessage<T extends {}>(
    message: T,
    context: Context<T>,
  ): Promise<string> {
    // Inline context variables
    context.forEach((value, key) => {
      if (key in message) {
        console.warn(
          `Context variable overlaps with message field and is ignored: ${String(key)}`,
        );
      } else {
        message[key] = value;
      }
    });

    return this.apiExecutor.executeQuery(this.saveMessage, message);
  }

  /**
   * Retrieves saved chat messages from the API via the configured function call.
   * @param context Context object identifying a user or providing contextual information.
   * @param limit Maximum number of messages to retrieve.
   * @param messageClass Constructor for the ChatMessage class.
   * @returns A list of chat messages for the provided context.
   */
  async getChatMessages<TChatMessage, T extends {}>(
    context: Context<T>,
    limit: number,
  ): Promise<TChatMessage[]> {
    const argumentsNode = { limit };
    const variables = FunctionUtil.addOrOverrideContext(
      argumentsNode,
      this.getMessageContextKeys,
      context,
    );

    try {
      const response = await this.apiExecutor.executeQuery(
        this.getMessages,
        variables,
      );
      const root = JSON.parse(response);
      const messages: TChatMessage[] = root?.data ?? [];

      return messages.reverse(); // Newest should be last
    } catch (error) {
      console.error("Error retrieving chat messages: ", error);
      throw error;
    }
  }
}
