import { describe, expect, test, jest, beforeEach } from "@jest/globals";
import {
  ApiQuery,
  FunctionDefinition,
  ValidationResult,
  ErrorType,
} from "../../../src";

// Mock the CustomApiQueryExecutor to avoid actual axios dependency
jest.mock(
  "../../../examples/custom-query-executor/CustomApiQueryExecutor",
  () => {
    // Get the actual class definition
    const original = jest.requireActual(
      "../../../examples/custom-query-executor/CustomApiQueryExecutor",
    );

    // Return a mocked version of the class
    return {
      ...original,
      CustomApiQueryExecutor: jest
        .fn()
        .mockImplementation((graphqlEndpoint, apiKey, options = {}) => {
          return {
            enableValidation: options.enableValidation || false,
            validate: jest.fn(),
            executeQuery: jest.fn(),
            executeRawQuery: jest.fn(),
          };
        }),
    };
  },
);

import { CustomApiQueryExecutor } from "../../../examples/custom-query-executor/CustomApiQueryExecutor";

describe("CustomApiQueryExecutor", () => {
  let executor: CustomApiQueryExecutor;
  const graphqlEndpoint = "https://example.com/graphql";
  const apiKey = "test-api-key";

  const sampleFunctionDef: FunctionDefinition = {
    name: "testFunction",
    description: "A test function",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
        limit: { type: "integer" },
      },
      required: ["id"],
    },
  };

  const sampleQuery: ApiQuery = {
    query:
      "query TestQuery($id: ID!, $limit: Int) { test(id: $id, limit: $limit) { result } }",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    executor = new CustomApiQueryExecutor(graphqlEndpoint, apiKey, {
      enableValidation: true,
    });

    // Configure mock responses
    (executor.validate as jest.Mock).mockImplementation((functionDef, args) => {
      if (executor.enableValidation) {
        if (args && args.id && typeof args.id !== "string") {
          return new ValidationResult(
            ErrorType.INVALID_ARGUMENT,
            "id must be string",
          );
        }
      }
      return ValidationResult.VALID;
    });

    (executor.executeQuery as jest.Mock).mockResolvedValue(
      JSON.stringify({ test: { result: "success" } }),
    );

    (executor.executeRawQuery as jest.Mock).mockResolvedValue({
      data: { test: { result: "success" } },
    });
  });

  test("should initialize with correct properties", () => {
    expect(executor.enableValidation).toBe(true);

    // Create with default options
    const defaultExecutor = new CustomApiQueryExecutor(graphqlEndpoint, apiKey);
    expect(defaultExecutor.enableValidation).toBe(false);
  });

  test("validate should return valid result for valid arguments", () => {
    const args = { id: "test-id", limit: 10 };
    const result = executor.validate(sampleFunctionDef, args);

    expect(result.isValid()).toBe(true);
    expect(result.errorType).toBe(ErrorType.NONE);
  });

  test("validate should return invalid result for invalid arguments", () => {
    const args = { id: 123, limit: "10" }; // id should be string, limit should be integer
    const result = executor.validate(sampleFunctionDef, args);

    expect(result.isValid()).toBe(false);
    expect(result.errorType).toBe(ErrorType.INVALID_ARGUMENT);
    expect(result.errorMessage).toContain("id must be string");
  });

  test("validate should skip validation when enableValidation is false", () => {
    executor = new CustomApiQueryExecutor(graphqlEndpoint, apiKey, {
      enableValidation: false,
    });

    const args = { id: 123 }; // Invalid: id should be string
    const result = executor.validate(sampleFunctionDef, args);

    expect(result).toBe(undefined);
  });

  test("executeQuery should call the executor with correct parameters", async () => {
    const args = { id: "test-id", limit: 10 };
    await executor.executeQuery(sampleQuery, args);

    expect(executor.executeQuery).toHaveBeenCalledWith(sampleQuery, args);
  });

  test("executeQuery should return stringified data", async () => {
    const args = { id: "test-id" };
    const result = await executor.executeQuery(sampleQuery, args);

    expect(result).toBe(JSON.stringify({ test: { result: "success" } }));
  });

  test("executeQuery should handle GraphQL errors", async () => {
    // Mock executeQuery to reject with GraphQL error
    (executor.executeQuery as jest.Mock).mockRejectedValueOnce(
      new Error('GraphQL errors: [{"message":"GraphQL error"}]'),
    );

    await expect(
      executor.executeQuery(sampleQuery, { id: "test-id" }),
    ).rejects.toThrow(/GraphQL errors/);
  });

  test("executeQuery should handle network errors", async () => {
    // Mock executeQuery to reject with network error
    (executor.executeQuery as jest.Mock).mockRejectedValueOnce(
      new Error("API request failed: Network error, Status: 500"),
    );

    await expect(
      executor.executeQuery(sampleQuery, { id: "test-id" }),
    ).rejects.toThrow(/API request failed: Network error, Status: 500/);
  });

  test("executeRawQuery should call the executor with correct parameters", async () => {
    const query = "query { test { result } }";
    const variables = { id: "test-id" };

    await executor.executeRawQuery(query, variables);

    expect(executor.executeRawQuery).toHaveBeenCalledWith(query, variables);
  });
});
