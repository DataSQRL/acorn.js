import { describe, test } from "@jest/globals";
import { checkFileContent, checkPackageJson, checkImports } from "./test.utils";

describe("Convert Operation Examples", () => {
  describe("Structure and Dependencies", () => {
    test("should have required package dependencies", () => {
      checkPackageJson("convert-operation", ["@datasqrl/acorn"]);
    });
  });

  test("index.ts should use the correct imports", () => {
    checkImports("convert-operation/index.ts", [
      {
        module: "@datasqrl/acorn",
        imports: ["convertOperations"],
      },
    ]);
  });

  test("index.ts should use the correct functions and patterns", () => {
    checkFileContent("convert-operation/index.ts", [
      "const bootstrap = async",
      "convertOperations(",
      "query character($id: ID!)",
      "const result = await lookupCharacterTool.validateAndExecute",
      'console.log("Info about character with id: 1")',
    ]);
  });
});
