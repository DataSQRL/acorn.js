import { describe, test } from "@jest/globals";
import { checkFileContent, checkPackageJson, checkImports } from "./test.utils";

describe("OpenAI Examples", () => {
  describe("Structure and Dependencies", () => {
    test("should have required package dependencies", () => {
      checkPackageJson("openai", ["@datasqrl/acorn", "openai"]);
    });
  });

  test("index.ts should use the correct imports", () => {
    checkImports("openai/index.ts", [
      {
        module: "@datasqrl/acorn",
        imports: ["createToolsFromApiUri"],
      },
      {
        module: "@datasqrl/acorn/openai",
        imports: ["createOpenAiToolResults", "toOpenAiTools"],
      },
      {
        module: "openai",
        imports: ["OpenAI"],
      },
      {
        module: "./print.utils",
        imports: ["printMessage", "printToolUsage"],
      },
    ]);
  });

  test("index.ts should use the correct functions and patterns", () => {
    checkFileContent("openai/index.ts", [
      "const bootstrap = async",
      "const jsonTools = await createToolsFromApiUri({",
      'graphqlUri: "https://rickandmortyapi.graphcdn.app/"',
      "const openai = new OpenAI()",
      "openai.chat.completions.create",
      'model: "gpt-4o"',
      "tools: toOpenAiTools",
      "const functionCallResultMessages = await createOpenAiToolResults",
    ]);
  });

  test("print.utils.ts should define the correct functions", () => {
    checkFileContent("openai/print.utils.ts", [
      "export const printMessage = (message: ChatCompletionMessageParam)",
      "export const printToolUsage = (",
      "console.log(`${message.role}: ${message.content}`)",
      "Calling function",
    ]);
  });
});
