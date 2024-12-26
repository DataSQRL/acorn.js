import { describe, expect, test } from "@jest/globals";
import { convertOperations } from "../../../src";
import { GraphQLError } from "graphql/error";

describe("GraphQlOperationConverter", () => {
  test("convertOperations should throw GraphQLError: SyntaxError on invalid operation", () => {
    expect(() =>
      convertOperations(`
      query HighTemps($temperature: Float!) { ReadingsAboveTemp(temp: $temperature
      `),
    ).toThrowError(GraphQLError);
  });

  test("convertOperations should convert valid query", () => {
    const expectedFunction = {
      function: {
        name: "HighTemps",
        description:
          "Returns all readings with a temperature higher than the provided value",
        parameters: {
          type: "object",
          properties: {
            temperature: {
              type: "number",
              description: "The temperature",
            },
          },
          required: ["temperature"],
        },
      },
      contextKeys: [],
      apiQuery: {
        query:
          "query HighTemps(\n    $temperature: Float!\n) {\n    ReadingsAboveTemp(temp: $temperature) {\n        sensorid\n        temperature\n    }\n}",
      },
    };
    const functions = convertOperations(`
# Returns all readings with a temperature higher than the provided value
query HighTemps(
    # The temperature
    $temperature: Float!
) {
    ReadingsAboveTemp(temp: $temperature) {
        sensorid
        temperature
    }
}`);

    expect(functions).toHaveLength(1);
    expect(functions[0].toJSON()).toEqual(expectedFunction);
  });

  test("convertOperations should convert valid mutation", () => {
    const expectedFunction = {
      function: {
        name: "SaveChatMessage",
        parameters: {
          type: "object",
          properties: {
            role: {
              type: "string",
            },
            content: {
              type: "string",
            },
            name: {
              type: "string",
            },
            functionCall: {
              type: "string",
            },
            customerid: {
              type: "integer",
            },
          },
          required: ["role", "content"],
        },
      },
      contextKeys: [],
      apiQuery: {
        query:
          "mutation SaveChatMessage(\n  $role: String!,\n\t$content: String!,\n\t$name: String,\n  $functionCall: String,\n  $customerid: Int)\n{\n  InternalSaveChatMessage(message: {\n    role: $role,\n    content: $content,\n    name: $name,\n    functionCall: $functionCall,\n    customerId: $customerId\n  }) {\n    event_time\n  }\n}",
      },
    };
    const functions = convertOperations(`
mutation SaveChatMessage(
  $role: String!,
	$content: String!,
	$name: String,
  $functionCall: String,
  $customerid: Int)
{
  InternalSaveChatMessage(message: {
    role: $role,
    content: $content,
    name: $name,
    functionCall: $functionCall,
    customerId: $customerId
  }) {
    event_time
  }
}`);

    expect(functions).toHaveLength(1);
    expect(functions[0].toJSON()).toEqual(expectedFunction);
  });
});
