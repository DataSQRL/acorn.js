import { ApiQuery } from "../api/api-query";
import { APIQueryExecutor } from "../api/query-executors/api-query-executor";
import { ChatPersistence } from "./chat-persistence";

export interface APIChatPersistenceFactoryConfig {
  graphQlUri: string;
  saveMessageMutation: string;
  getMessagesQuery: string;
}

export class APIChatPersistence<
  TChatMessage,
  TApiQuery extends ApiQuery = ApiQuery,
> implements ChatPersistence<TChatMessage>
{
  constructor(
    private apiExecutor: APIQueryExecutor<TApiQuery>,
    public readonly getMessagesQuery: TApiQuery,
    public readonly saveMessageMutation: TApiQuery,
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
    const res = await this.apiExecutor.executeQuery(
      this.saveMessageMutation,
      variables,
    );
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
      const response = await this.apiExecutor.executeQuery(
        this.getMessagesQuery,
        variables,
      );
      const root = JSON.parse(response);
      // we don't know the name of the query, so we just take the first value
      const messages = Object.values(root ?? {})[0] as TChatMessage[];
      // store the messages in reverse order to supply to LLM as context
      this._messages = messages.reverse() ?? [];
      return this._messages;
    } catch (error) {
      console.error("Error retrieving chat messages: ", error);
      throw error;
    }
  }
}
