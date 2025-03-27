import { describe, test } from "@jest/globals";
import { checkFileContent, checkPackageJson, checkImports } from "./test.utils";

describe("LangChain Examples", () => {
  describe("Structure and Dependencies", () => {
    test("should have required package dependencies", () => {
      checkPackageJson("langchain", [
        "@datasqrl/acorn",
        "@langchain/core",
        "@langchain/langgraph",
        "@langchain/openai",
        "zod",
      ]);
    });
  });

  describe("Agent Implementation", () => {
    test("rick-and-morty-agent.ts should use the correct imports", () => {
      checkImports("langchain/rick-and-morty-agent.ts", [
        {
          module: "@datasqrl/acorn",
          imports: ["createToolsFromApiUri"],
        },
        {
          module: "@datasqrl/acorn/langchain",
          imports: ["toLangChainTools"],
        },
        {
          module: "@langchain/langgraph",
          imports: ["MemorySaver"],
        },
        {
          module: "@langchain/langgraph/prebuilt",
          imports: ["createReactAgent"],
        },
        {
          module: "@langchain/openai",
          imports: ["ChatOpenAI"],
        },
      ]);
    });

    test("rick-and-morty-agent.ts should use the correct functions and patterns", () => {
      checkFileContent("langchain/rick-and-morty-agent.ts", [
        "const createRickAndMortyAgent = async",
        'graphqlUri: "https://rickandmortyapi.graphcdn.app/"',
        "const agent = createReactAgent({",
        'model: "gpt-4o"',
        "tools: toLangChainTools(jsonTools)",
        "export default rickAndMortyAgent",
      ]);
    });
  });

  describe("Example Usage", () => {
    test("index.ts should use the correct imports", () => {
      checkImports("langchain/index.ts", [
        {
          module: "@langchain/core/messages",
          imports: ["HumanMessage"],
        },
        {
          module: "./rick-and-morty-agent",
          imports: ["*"],
        },
      ]);
    });

    test("index.ts should use the correct functions and patterns", () => {
      checkFileContent("langchain/index.ts", [
        "const bootstrap = async",
        "const agent = await rickAndMortyAgent.create()",
        "const agentFinalState = await agent.invoke",
        "new HumanMessage(",
        '{ configurable: { thread_id: "42" } }',
      ]);
    });

    test("interactive.ts should use the correct imports", () => {
      checkImports("langchain/interactive.ts", [
        {
          module: "node:readline",
          imports: ["*"],
        },
        {
          module: "@langchain/core/messages",
          imports: ["HumanMessage"],
        },
      ]);
    });

    test("interactive.ts should use the correct functions and patterns", () => {
      checkFileContent("langchain/interactive.ts", [
        "function waitForQuestion",
        "rl.question(",
        "const agentState = await agent.invoke",
        "new HumanMessage(message)",
        "console.log(agentState.messages[agentState.messages.length - 1].content)",
      ]);
    });
  });
});
