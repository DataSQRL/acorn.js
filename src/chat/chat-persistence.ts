/**
 * Interface for managing chat messages persistence.
 * @template TChatMessage - Type representing chat messages
 */
export interface ChatPersistence<TChatMessage> {
  readonly currentState: TChatMessage[];
  saveChatMessage<TMutationParams extends {} = {}>(
    message: TChatMessage,
    variables: TMutationParams,
  ): Promise<string>;

  getChatMessages<TQueryParams extends {} = {}>(
    variables: TQueryParams,
  ): Promise<TChatMessage[]>;
}
