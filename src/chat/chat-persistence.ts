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
