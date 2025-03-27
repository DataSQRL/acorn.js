import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { APIFunction } from "../../../src";
import { createToolsFromApiUri } from "../../../src";
import {
  toAnthropicAiTools,
  createAnthropicToolResult,
} from "../../../src/modules/anthropic";
import type { Message } from "@anthropic-ai/sdk/resources/index.mjs";

// Mock createToolsFromApiUri
jest.mock("../../../src/converter", () => {
  const originalModule = jest.requireActual("../../../src/converter");
  return {
    ...originalModule,
    createToolsFromApiUri: jest.fn(),
  };
});

// Mock APIFunction.executeTools
jest.mock("../../../src/tool/api-function", () => {
  const originalModule = jest.requireActual("../../../src/tool/api-function");
  return {
    ...originalModule,
    APIFunction: {
      ...originalModule.APIFunction,
      executeTools: jest.fn(),
    },
  };
});

describe("Anthropic AI Example Integration", () => {
  let mockApiFunction: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock API function
    mockApiFunction = {
      function: {
        name: "character",
        description: "Get character information",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
      },
      apiQuery: {
        query:
          "query character($id: ID!) { character(id: $id) { id name status species } }",
      },
      apiExecutor: {},
      getName: () => "character",
    };

    // Mock createToolsFromApiUri to return our mock function
    (createToolsFromApiUri as jest.Mock).mockResolvedValue([mockApiFunction]);

    // Mock APIFunction.executeTools
    (APIFunction.executeTools as jest.Mock).mockResolvedValue([
      JSON.stringify({
        character: {
          id: "1",
          name: "Rick Sanchez",
          status: "Alive",
          species: "Human",
        },
      }),
    ]);
  });

  test("Example workflow components work together correctly", async () => {
    // Step 1: Create tools from API
    const jsonTools = await createToolsFromApiUri({
      graphqlUri: "https://rickandmortyapi.graphcdn.app/",
      enableValidation: true,
    });

    expect(createToolsFromApiUri).toHaveBeenCalledWith({
      graphqlUri: "https://rickandmortyapi.graphcdn.app/",
      enableValidation: true,
    });

    // Step 2: Convert tools to Anthropic format
    const tools = toAnthropicAiTools(jsonTools);

    expect(tools).toEqual([
      {
        name: "character",
        description: "Get character information",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
      },
    ]);

    // Step 3: Simulate Claude's response with tool calls
    const mockMessage: Message = {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "I'll help you find information about the character with ID #1.",
        },
        {
          type: "tool_use",
          id: "tool-use-1",
          name: "character",
          input: {
            id: "1",
          },
        },
      ],
      model: "claude-3-5-sonnet-latest",
      id: "msg_01234567890",
      type: "message",
      usage: { input_tokens: 10, output_tokens: 20 },
      stop_reason: "end_turn",
      stop_sequence: null,
    };

    // Step 4: Process function calls
    const functionCallResultMessage = await createAnthropicToolResult(
      mockMessage,
      jsonTools,
    );

    // Verify executeTools was called with correct arguments
    expect(APIFunction.executeTools).toHaveBeenCalledWith(
      [{ name: "character", arguments: { id: "1" } }],
      jsonTools,
    );

    // Step 5: Verify tool results message format
    expect(functionCallResultMessage).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "tool-use-1",
          content: JSON.stringify({
            character: {
              id: "1",
              name: "Rick Sanchez",
              status: "Alive",
              species: "Human",
            },
          }),
        },
        {
          type: "text",
          text: "Answer with these tool results",
        },
      ],
    });
  });

  test("createAnthropicToolResult handles custom prompt parameter", async () => {
    const mockMessage: Message = {
      role: "assistant",
      content: [
        {
          type: "tool_use",
          id: "tool-use-1",
          name: "character",
          input: { id: "1" },
        },
      ],
      model: "claude-3-5-sonnet-latest",
      id: "msg_01234567890",
      type: "message",
      usage: { input_tokens: 5, output_tokens: 10 },
      stop_reason: "end_turn",
      stop_sequence: null,
    };

    const customPrompt =
      "Please summarize the information about this character";

    const result = await createAnthropicToolResult(
      mockMessage,
      [mockApiFunction],
      customPrompt,
    );

    expect(result.content[result.content.length - 1]).toEqual({
      type: "text",
      text: customPrompt,
    });
  });

  test("createAnthropicToolResult handles multiple tool calls", async () => {
    // Setup multiple tool calls
    const mockMessage: Message = {
      role: "assistant",
      content: [
        {
          type: "tool_use",
          id: "tool-use-1",
          name: "character",
          input: { id: "1" },
        },
        {
          type: "tool_use",
          id: "tool-use-2",
          name: "character",
          input: { id: "2" },
        },
      ],
      model: "claude-3-5-sonnet-latest",
      id: "msg_01234567890",
      type: "message",
      usage: { input_tokens: 10, output_tokens: 20 },
      stop_reason: "end_turn",
      stop_sequence: null,
    };

    // Mock multiple results
    (APIFunction.executeTools as jest.Mock).mockResolvedValue([
      JSON.stringify({ character: { id: "1", name: "Rick Sanchez" } }),
      JSON.stringify({ character: { id: "2", name: "Morty Smith" } }),
    ]);

    const result = await createAnthropicToolResult(mockMessage, [
      mockApiFunction,
    ]);

    // Verify right number of tool results
    expect(
      result.content.filter((block) => block.type === "tool_result"),
    ).toHaveLength(2);

    // Verify each tool result has correct tool_use_id
    expect(result.content[0]).toEqual({
      type: "tool_result",
      tool_use_id: "tool-use-1",
      content: JSON.stringify({ character: { id: "1", name: "Rick Sanchez" } }),
    });

    expect(result.content[1]).toEqual({
      type: "tool_result",
      tool_use_id: "tool-use-2",
      content: JSON.stringify({ character: { id: "2", name: "Morty Smith" } }),
    });
  });
});
