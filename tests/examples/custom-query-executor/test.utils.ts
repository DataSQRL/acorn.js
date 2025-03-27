import { FunctionDefinition, ApiQuery } from "../../../src";

/**
 * Creates a sample function definition for testing
 */
export function getSampleFunctionDefinition(): FunctionDefinition {
  return {
    name: "getProduct",
    description: "Get product by ID",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The product ID",
        },
      },
      required: ["id"],
    },
  };
}

/**
 * Creates a sample query for testing
 */
export function getSampleQuery(): ApiQuery {
  return {
    query: `
        query getProduct($id: ID!) {
          getProduct(id: $id) {
            id
            name
            price
            description
            inStock
          }
        }
      `,
  };
}
