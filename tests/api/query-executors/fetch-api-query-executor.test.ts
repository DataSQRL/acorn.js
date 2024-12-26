import { describe, expect, test } from "@jest/globals";
import {
  ErrorType,
  FetchApiQueryExecutor,
  FunctionDefinition,
} from "../../../src";

describe("FetchApiQueryExecutor", () => {
  const apiExecutorConfig = {
    graphqlUri: "",
    enableValidation: true,
  };
  const validFunctionDefinitionMock: FunctionDefinition = {
    name: "test function",
    parameters: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
      },
    },
  };
  const invalidFunctionDefinitionMock: FunctionDefinition = {
    name: "test function",
    parameters: {
      type: "some custom type",
      required: ["id"],
      properties: {},
    },
  };
  test("should validate function parameters schema", () => {
    const apiExecutor = new FetchApiQueryExecutor(apiExecutorConfig);

    const result = apiExecutor.validate(validFunctionDefinitionMock);

    expect(result.errorType).toBe(ErrorType.NONE);
  });
  test("should throw on invalid function parameters schema", () => {
    const apiExecutor = new FetchApiQueryExecutor(apiExecutorConfig);

    const result = apiExecutor.validate(invalidFunctionDefinitionMock);

    expect(result.errorType).toBe(ErrorType.INVALID_JSON);
    expect(result.errorMessage?.startsWith("schema is invalid: ")).toBeTruthy();
  });
  test("should validate function arguments", () => {
    const apiExecutor = new FetchApiQueryExecutor(apiExecutorConfig);
    const validArgs = { id: "42" };

    const result = apiExecutor.validate(validFunctionDefinitionMock, validArgs);

    expect(result.errorType).toBe(ErrorType.NONE);
  });
  test("should throw on invalid function arguments", () => {
    const apiExecutor = new FetchApiQueryExecutor(apiExecutorConfig);
    const invalidArgs = { id: 1 };

    const result = apiExecutor.validate(
      validFunctionDefinitionMock,
      invalidArgs,
    );

    expect(result.errorType).toBe(ErrorType.INVALID_ARGUMENT);
    expect(result.errorMessage).toBe("id must be string");
  });
});
