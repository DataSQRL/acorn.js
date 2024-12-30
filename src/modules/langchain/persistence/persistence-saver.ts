import { BaseMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { Annotation, MemorySaver } from "@langchain/langgraph";
import {
  PendingWrite,
  SerializerProtocol,
} from "@langchain/langgraph-checkpoint";
import { FetchApiQueryExecutor } from "../../../api";
import { APIChatPersistence, ChatPersistence } from "../../../chat";

export interface PersistentSaverFormatters<TChatMessage> {
  messageToMutationVariables: (
    message: BaseMessage,
    config: RunnableConfig,
  ) => {};
  messageToApiMessage: (
    message: BaseMessage,
    config: RunnableConfig,
  ) => TChatMessage;
  queryResponseToMessageList: (apiMessages: TChatMessage[]) => BaseMessage[];
}

export interface DataSQRLChatMessage {
  uuid: string;
  role: string;
  content: string;
  customerid: string;
  timestamp: string;
  name?: string;
  functionCall?: string;
}

export class PersistentSaver<
  TChatMessage extends {} = DataSQRLChatMessage,
> extends MemorySaver {
  static fromApi<TChatMessage extends {} = DataSQRLChatMessage>(
    graphqlUri: string,
    getMessagesQuery: string,
    saveMessageMutation: string,
    formatters: PersistentSaverFormatters<TChatMessage>,
  ) {
    const apiExecutor = new FetchApiQueryExecutor({
      graphqlUri,
      enableValidation: true,
    });
    return new PersistentSaver(
      new APIChatPersistence<TChatMessage>(
        apiExecutor,
        { query: getMessagesQuery },
        { query: saveMessageMutation },
      ),
      formatters,
    );
  }

  constructor(
    protected readonly persistence: ChatPersistence<TChatMessage>,
    public readonly formatters: PersistentSaverFormatters<TChatMessage>,
    serde?: SerializerProtocol,
  ) {
    super(serde);
  }

  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string,
  ): Promise<void> {
    const messagesToWrite = writes
      .filter(([channelName]) => channelName === "messages")
      .flatMap(([_channelName, messages]) => messages as Array<BaseMessage>);

    for (let messageToWrite of messagesToWrite) {
      const apiMessage = this.formatters.messageToApiMessage(
        messageToWrite,
        config,
      );
      const variables = this.formatters.messageToMutationVariables(
        messageToWrite,
        config,
      );
      await this.persistence.saveChatMessage(apiMessage, variables);
    }

    return super.putWrites(config, writes, taskId);
  }

  async getInitialMessages<TQueryParams extends {} = {}>(args: TQueryParams) {
    const res = await this.persistence.getChatMessages(args);
    return this.formatters.queryResponseToMessageList(res);
  }

  async getInitialMessagesAsAnnotationFunction<TQueryParams extends {} = {}>(
    args: TQueryParams,
  ) {
    const initialMessages = await this.getInitialMessages(args);
    return Annotation.Root({
      messages: Annotation<BaseMessage[]>({
        reducer: (currentState, updateValue) =>
          currentState.concat(updateValue),
        default: () => initialMessages,
      }),
    });
  }
}
