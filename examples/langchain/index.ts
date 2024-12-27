import { HumanMessage } from "@langchain/core/messages";
import rickAndMortyAgent from "./rick-and-morty-agent";

const bootstrap = async () => {
  const agent = await rickAndMortyAgent.create();

  // See LangChain docs for more info on agent usage
  // https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/#making-your-first-agent-using-langgraph
  const agentFinalState = await agent.invoke(
    {
      messages: [
        new HumanMessage(
          "What characters from Rick and Morty currently have alive status?",
        ),
      ],
    },
    { configurable: { thread_id: "42" } },
  );
  console.log(
    agentFinalState.messages[agentFinalState.messages.length - 1].content,
  );

  const agentLastState = await agent.invoke(
    {
      messages: [new HumanMessage("Now show me info about Location #2?")],
    },
    { configurable: { thread_id: "42" } },
  );

  console.log(
    agentLastState.messages[agentLastState.messages.length - 1].content,
  );
};
bootstrap();
