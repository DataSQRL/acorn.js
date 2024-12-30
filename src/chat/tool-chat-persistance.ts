import { APIFunction } from "../tool";
import { ChatPersistence } from "./chat-persistence";

export class ToolChatPersistence<TChatMessage>
  implements ChatPersistence<TChatMessage>
{
  constructor(
    public readonly getMessagesTool: APIFunction,
    public readonly saveMessageTool: APIFunction,
  ) {}

  protected _messages: TChatMessage[] = [];
  public get currentState() {
    return this._messages;
  }

  /**
   * Saves the generic chat message with the configured context asynchronously.
   * @param message message to save to the `currentState`. It is not related to variables used in the mutation.
   * @param variables variables to pass to mutation
   * @returns A Promise that resolves to the result as a string.
   */
  async saveChatMessage<T extends {} = {}>(
    message: TChatMessage,
    variables: T,
  ): Promise<string> {
    const res = await this.saveMessageTool.validateAndExecute(variables);
    this._messages.push(message);
    return res;
  }

  /**
   * Retrieves saved chat messages from the API via the configured function call.
   * @param variables variables to pass to query.
   * @returns A list of chat messages for the provided context.
   */
  async getChatMessages<T extends {} = {}>(
    variables: T,
  ): Promise<TChatMessage[]> {
    try {
      const response = await this.getMessagesTool.validateAndExecute(variables);
      const root = JSON.parse(response);
      // store the messages in reverse order to supply to LLM as context
      this._messages = root?.[this.getMessagesTool.getName()].reverse() ?? [];

      return this._messages;
    } catch (error) {
      console.error("Error retrieving chat messages: ", error);
      throw error;
    }
  }
}
