import readline from "node:readline";
import { HumanMessage } from "@langchain/core/messages";
import rickAndMortyAgent, { RickAndMortyAgent } from "./rick-and-morty-agent";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function waitForQuestion(agent: RickAndMortyAgent) {
  rl.question(
    " >> Type your next question or `exit` to stop chat:\n",
    async (message) => {
      if (message === "exit") {
        rl.close();
        process.exit(0);
      }
      const agentState = await agent.invoke(
        { messages: [new HumanMessage(message)] },
        { configurable: { thread_id: "42" } },
      );

      console.log(">> Chatbot:");
      console.log(agentState.messages[agentState.messages.length - 1].content);

      waitForQuestion(agent);
    },
  );
}

rickAndMortyAgent.create().then(waitForQuestion);
