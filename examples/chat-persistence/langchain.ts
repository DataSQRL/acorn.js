import {
  persistenceFormatters,
  PersistentSaver,
} from "@datasqrl/acorn/langchain";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

const createAgent = async () => {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY env variable is missing!");
    process.exit(1);
  }

  // Create Saver that will save chat messages to GraphQL API
  // by passing API uri, query to get messages, and mutation to save new message
  const persistentSaver = PersistentSaver.fromApi(
    "http:/localhost:8888/graphql",
    `query InternalGetChatMessages($customerid: Int!, $limit: Int = 10, $offset: Int = 0) {
      InternalGetChatMessages(customerid: $customerid, limit: $limit, offset: $offset) {
        role
        content
        name
        functionCall
        customerid
        timestamp
        uuid
      }
    }`,
    `mutation InternalSaveChatMessage($role: String!, $content: String!, $name: String, $functionCall: String, $customerid: Int) {
      InternalSaveChatMessage(message: { role: $role, content: $content, name: $name, functionCall: $functionCall, customerid: $customerid }) {
        event_time
      }
    }`,
    persistenceFormatters.defaultDataSqrlApi,
  );

  const agent = createReactAgent({
    llm: new ChatOpenAI({
      model: "gpt-4o",
    }),
    tools: [],
    // Use created saver as checkpointSaver so once new messages are available they are saved to the backend
    checkpointSaver: persistentSaver,
    // Get initial messages from API
    stateSchema: await persistentSaver.getInitialMessagesAsAnnotationFunction({
      limit: 10,
      customerid: 42,
    }),
  });

  return agent;
};
createAgent().then(async (agent) => {
  const subjects = ["loops", "recursion", "caching"];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  const agentFinalState = await agent.invoke(
    {
      messages: [new HumanMessage(`Tell a joke about ${subject}`)],
    },
    { configurable: { thread_id: 42 } },
  );

  // Print message history so you can see it include messages from previous script runs
  console.log(
    `\n\nCurrent agent has ${agentFinalState.messages.length} messages loaded in state:`,
  );
  agentFinalState.messages.forEach((message) => {
    console.log(`\n\n${message.getType()}:\n${message.content}`);
  });
});
