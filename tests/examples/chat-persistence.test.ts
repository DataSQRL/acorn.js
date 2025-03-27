import { describe, test } from "@jest/globals";
import { checkFileContent, checkPackageJson, checkImports } from "./test.utils";

describe("Chat Persistence Examples", () => {
  describe("Structure and Dependencies", () => {
    test("should have required package dependencies", () => {
      checkPackageJson("chat-persistence", [
        "@datasqrl/acorn",
        "@langchain/core",
        "@langchain/langgraph",
        "@langchain/openai",
        "openai",
        "uuid",
      ]);
    });
  });

  describe("Basic OpenAI Chat Persistence", () => {
    test("index.ts should use the correct imports", () => {
      checkImports("chat-persistence/index.ts", [
        {
          module: "@datasqrl/acorn",
          imports: [
            "ChatPersistence",
            "chatPersistence",
            "createToolsFromApiUri",
          ],
        },
        {
          module: "@datasqrl/acorn/openai",
          imports: ["toOpenAiTools"],
        },
        {
          module: "uuid",
          imports: ["v4"],
        },
      ]);
    });

    test("index.ts should use the correct functions and patterns", () => {
      checkFileContent("chat-persistence/index.ts", [
        "const messageStore = chatPersistence.fromTools",
        "const openai = new OpenAI()",
        "openai.chat.completions.create",
        "tools: toOpenAiTools",
        "await messageStore.saveChatMessage",
      ]);
    });
  });

  describe("LangChain Chat Persistence", () => {
    test("langchain.ts should use the correct imports", () => {
      checkImports("chat-persistence/langchain.ts", [
        {
          module: "@datasqrl/acorn/langchain",
          imports: ["persistenceFormatters", "PersistentSaver"],
        },
        {
          module: "@langchain/core/messages",
          imports: ["HumanMessage"],
        },
        {
          module: "@langchain/langgraph",
          imports: ["*"], // We don't care about specific imports
        },
        {
          module: "@langchain/openai",
          imports: ["ChatOpenAI"],
        },
      ]);
    });

    test("langchain.ts should use the correct functions and patterns", () => {
      checkFileContent("chat-persistence/langchain.ts", [
        "PersistentSaver.fromApi",
        "persistenceFormatters.defaultDataSqrlApi",
        "const persistentSaver = PersistentSaver.fromApi(",
        "createReactAgent({",
        "stateSchema: await persistentSaver.getInitialMessagesAsAnnotationFunction",
      ]);
    });
  });
});
