import { describe, expect, test, jest, beforeEach } from "@jest/globals";
import {
  convertSchema,
  StandardAPIFunctionFactory,
  FunctionDefinition,
  ApiQuery,
  ValidationResult,
} from "../../../src";
import {
  toOpenAiTools,
  createOpenAiToolResults,
} from "../../../src/modules/openai";

// Create a mock implementation of CustomApiQueryExecutor
class MockCustomApiQueryExecutor {
  public enableValidation: boolean;
  private graphqlEndpoint: string;
  private apiKey: string;

  constructor(
    graphqlEndpoint: string,
    apiKey: string,
    options: {
      enableValidation?: boolean;
    } = {},
  ) {
    this.graphqlEndpoint = graphqlEndpoint;
    this.apiKey = apiKey;
    this.enableValidation = options.enableValidation || false;
  }

  validate = jest.fn().mockReturnValue(ValidationResult.VALID);

  executeQuery = jest.fn().mockImplementation((query, args) => {
    // Mock implementation that returns different responses based on the function name in the query
    if (query.query.includes("getProduct")) {
      return Promise.resolve(
        JSON.stringify({
          getProduct: {
            id: args.id,
            name: "Test Product",
            price: 99.99,
            description: "A test product",
            inStock: true,
          },
        }),
      );
    }

    if (query.query.includes("searchProducts")) {
      return Promise.resolve(
        JSON.stringify({
          searchProducts: [
            { id: "1", name: "Result 1", price: 10.99 },
            { id: "2", name: "Result 2", price: 20.99 },
          ],
        }),
      );
    }

    return Promise.resolve(JSON.stringify({}));
  });

  executeRawQuery = jest.fn();
}

// Mock the real executor with our mock implementation
jest.mock(
  "../../../examples/custom-query-executor/CustomApiQueryExecutor",
  () => {
    return {
      CustomApiQueryExecutor: jest
        .fn()
        .mockImplementation(
          (graphqlEndpoint, apiKey, options = {}) =>
            new MockCustomApiQueryExecutor(graphqlEndpoint, apiKey, options),
        ),
    };
  },
);

// Import the mocked version
import { CustomApiQueryExecutor } from "../../../examples/custom-query-executor/CustomApiQueryExecutor";

// Mock OpenAI
jest.mock("openai", () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: null,
                  tool_calls: [
                    {
                      id: "call_123",
                      function: {
                        name: "getProduct",
                        arguments: JSON.stringify({ id: "42" }),
                      },
                    },
                  ],
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

describe("Custom Executor Integration Tests", () => {
  let executor: CustomApiQueryExecutor;
  const graphqlEndpoint = "https://example.com/graphql";
  const apiKey = "test-api-key";

  const sampleSchema = `
    type Query {
      getProduct(id: ID!): Product
      searchProducts(query: String!, limit: Int): [Product]
    }

    type Product {
      id: ID!
      name: String!
      price: Float!
      description: String
      inStock: Boolean!
    }
  `;

  beforeEach(() => {
    jest.clearAllMocks();
    executor = new CustomApiQueryExecutor(graphqlEndpoint, apiKey, {
      enableValidation: true,
    });
  });

  test("should convert GraphQL schema to functions using custom executor", () => {
    const functions = convertSchema(sampleSchema, executor);

    expect(functions).toHaveLength(2);
    expect(functions[0].getName()).toBe("getProduct");
    expect(functions[1].getName()).toBe("searchProducts");

    const getProductFunction = functions[0];
    expect(getProductFunction.function.parameters.required).toContain("id");
  });

  test("should convert functions to OpenAI tools format", () => {
    const functions = convertSchema(sampleSchema, executor);
    const openAITools = toOpenAiTools(functions);

    expect(openAITools).toHaveLength(2);
    expect(openAITools[0].function.name).toBe("getProduct");
    expect(openAITools[0].type).toBe("function");
    expect(openAITools[0].function.parameters.required).toContain("id");
  });

  test("should successfully execute queries through the tool system", async () => {
    const functions = convertSchema(sampleSchema, executor);

    // Mock a message with tool calls from OpenAI
    const message = {
      tool_calls: [
        {
          id: "call_123",
          function: {
            name: "getProduct",
            arguments: JSON.stringify({ id: "42" }),
          },
        },
      ],
    };

    const toolResults = await createOpenAiToolResults(
      message as any,
      functions,
    );

    expect(toolResults).toHaveLength(1);
    expect(toolResults[0].tool_call_id).toBe("call_123");

    // Verify the content contains our mocked product data
    const content = JSON.parse(toolResults[0].content);
    expect(content).toHaveProperty("getProduct");
    expect(content.getProduct.name).toBe("Test Product");
  });

  test("should handle invalid function calls gracefully", async () => {
    const functions = convertSchema(sampleSchema, executor);

    // Mock a message with tool calls for a non-existent function
    const message = {
      tool_calls: [
        {
          id: "call_456",
          function: {
            name: "nonExistentFunction",
            arguments: JSON.stringify({ param: "value" }),
          },
        },
      ],
    };

    const toolResults = await createOpenAiToolResults(
      message as any,
      functions,
    );

    expect(toolResults).toHaveLength(1);
    expect(toolResults[0].tool_call_id).toBe("call_456");
    expect(toolResults[0].content).toContain("");
  });

  test("should process multiple function calls in a single message", async () => {
    const functions = convertSchema(sampleSchema, executor);

    // Mock a message with multiple tool calls
    const message = {
      tool_calls: [
        {
          id: "call_product",
          function: {
            name: "getProduct",
            arguments: JSON.stringify({ id: "42" }),
          },
        },
        {
          id: "call_search",
          function: {
            name: "searchProducts",
            arguments: JSON.stringify({ query: "search term", limit: 2 }),
          },
        },
      ],
    };

    const toolResults = await createOpenAiToolResults(
      message as any,
      functions,
    );

    expect(toolResults).toHaveLength(2);

    // Check first result
    expect(toolResults[0].tool_call_id).toBe("call_product");
    const productContent = JSON.parse(toolResults[0].content);
    expect(productContent.getProduct.name).toBe("Test Product");

    // Check second result
    expect(toolResults[1].tool_call_id).toBe("call_search");
    const searchContent = JSON.parse(toolResults[1].content);
    expect(searchContent.searchProducts).toHaveLength(2);
    expect(searchContent.searchProducts[0].name).toBe("Result 1");
  });

  test("should use the StandardAPIFunctionFactory with custom executor", () => {
    const functionFactory = new StandardAPIFunctionFactory(executor);

    // Create a function definition manually
    const functionDef: FunctionDefinition = {
      name: "customFunction",
      description: "A custom function",
      parameters: {
        type: "object",
        properties: {
          param: { type: "string" },
        },
        required: ["param"],
      },
    };

    const query: ApiQuery = {
      query:
        "query customFunction($param: String!) { customField(param: $param) }",
    };

    // Create a function using the factory
    const func = functionFactory.create(functionDef, query);

    expect(func.getName()).toBe("customFunction");
    expect(func.function).toBe(functionDef);
    expect(func.apiQuery).toBe(query);
  });
});
