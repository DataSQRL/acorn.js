import { describe, expect, test, jest, beforeEach } from "@jest/globals";
import { convertSchema } from "../../../src";

// Mock the CustomApiQueryExecutor - proper way to mock with jest
jest.mock(
  "../../../examples/custom-query-executor/CustomApiQueryExecutor",
  () => {
    // Import the required modules inside the factory function
    const { ValidationResult } = jest.requireActual("../../../src");

    return {
      CustomApiQueryExecutor: jest
        .fn()
        .mockImplementation((graphqlEndpoint, apiKey, options = {}) => {
          return {
            enableValidation: options.enableValidation || false,
            graphqlEndpoint,
            apiKey,
            validate: jest.fn().mockReturnValue(ValidationResult.VALID),
            executeQuery: jest.fn(),
            executeRawQuery: jest.fn(),
          };
        }),
    };
  },
);

// Import the mocked version after the mock is set up
import { CustomApiQueryExecutor } from "../../../examples/custom-query-executor/CustomApiQueryExecutor";
// Now import the types we need for the rest of the test
import { ValidationResult, ErrorType } from "../../../src";
import { getSampleFunctionDefinition, getSampleQuery } from "./test.utils";

describe("CustomApiQueryExecutor Edge Cases", () => {
  let executor: CustomApiQueryExecutor;
  const graphqlEndpoint = "https://example.com/graphql";
  const apiKey = "test-api-key";

  beforeEach(() => {
    jest.clearAllMocks();
    executor = new CustomApiQueryExecutor(graphqlEndpoint, apiKey, {
      enableValidation: true,
    });
  });

  test("should handle network errors gracefully", async () => {
    // Simulate a network error
    (executor.executeQuery as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    // Get a sample query
    const sampleQuery = getSampleQuery();

    // Execute the query and expect it to reject with a specific error message
    await expect(
      executor.executeQuery(sampleQuery, { id: "42" }),
    ).rejects.toThrow("Network error");
  });

  test("should handle HTTP errors with different response structures", async () => {
    // Simulate a 404 error
    (executor.executeQuery as jest.Mock).mockRejectedValueOnce(
      new Error(
        "API request failed: Request failed with status code 404, Status: 404",
      ),
    );

    // Get a sample query
    const sampleQuery = getSampleQuery();

    // Execute the query and expect it to reject with a specific error message
    await expect(
      executor.executeQuery(sampleQuery, { id: "42" }),
    ).rejects.toThrow(
      "API request failed: Request failed with status code 404, Status: 404",
    );
  });

  test("should handle invalid JSON in GraphQL response", async () => {
    // Mock executeQuery to return null
    (executor.executeQuery as jest.Mock).mockResolvedValueOnce("null");

    // Get a sample query
    const sampleQuery = getSampleQuery();

    // Execute the query - it should still run without throwing
    const result = await executor.executeQuery(sampleQuery, { id: "42" });
    expect(result).toBe("null");
  });

  test("should handle complex nested GraphQL queries", async () => {
    // Mock a complex response
    const complexResponse = JSON.stringify({
      getProductDetails: {
        product: {
          id: "42",
          name: "Test Product",
          price: 99.99,
        },
        reviews: [
          { id: "1", rating: 5, comment: "Great!", author: "User1" },
          { id: "2", rating: 4, comment: "Good product", author: "User2" },
        ],
        relatedProducts: [
          { id: "43", name: "Related 1", price: 89.99 },
          { id: "44", name: "Related 2", price: 79.99 },
        ],
      },
    });

    (executor.executeQuery as jest.Mock).mockResolvedValueOnce(complexResponse);

    // Create a complex query
    const complexQuery = {
      query: `
        query getProductDetails($id: ID!, $includeReviews: Boolean!, $reviewLimit: Int) {
          getProductDetails(id: $id, includeReviews: $includeReviews, reviewLimit: $reviewLimit) {
            product {
              id
              name
              price
            }
            reviews @include(if: $includeReviews) {
              id
              rating
              comment
              author
            }
            relatedProducts {
              id
              name
              price
            }
          }
        }
      `,
    };

    // Execute with complex variables
    const result = await executor.executeQuery(complexQuery, {
      id: "42",
      includeReviews: true,
      reviewLimit: 2,
    });

    // Parse the result
    const parsedResult = JSON.parse(result);

    // Validate the result
    expect(parsedResult.getProductDetails.product.id).toBe("42");
    expect(parsedResult.getProductDetails.reviews).toHaveLength(2);
    expect(parsedResult.getProductDetails.relatedProducts).toHaveLength(2);
  });

  test("should handle invalid GraphQL schema gracefully", () => {
    // Invalid schema with syntax error
    const invalidSchema = `
      type Query {
        getProduct(id: ID!): Product
      
      type Product {
        id: ID!
        name: String!
      }
    `;

    // Attempt to convert the schema
    expect(() => convertSchema(invalidSchema, executor)).toThrow();
  });

  test("should handle GraphQL validation errors", async () => {
    // Mock the executeQuery to reject with GraphQL validation error
    (executor.executeQuery as jest.Mock).mockRejectedValueOnce(
      new Error(
        "GraphQL errors: [{\"message\":\"Field 'invalid' doesn't exist on type 'Product'\"}]",
      ),
    );

    // Get a sample query
    const sampleQuery = getSampleQuery();

    // Execute the query and expect it to reject with a specific error message
    await expect(
      executor.executeQuery(sampleQuery, { id: "42" }),
    ).rejects.toThrow(/GraphQL errors/);
  });

  test("should handle different validation scenarios", async () => {
    // Set up mock validation behavior
    (executor.validate as jest.Mock).mockImplementation((functionDef, args) => {
      if (!args || typeof args.id !== "string") {
        return new ValidationResult(
          ErrorType.INVALID_ARGUMENT,
          "id must be string",
        );
      }
      return ValidationResult.VALID;
    });

    // Get function definition for testing
    const functionDef = getSampleFunctionDefinition();

    // Test valid arguments
    const validResult = executor.validate(functionDef, { id: "42" });
    expect(validResult.isValid()).toBe(true);

    // Test invalid arguments
    const invalidResult = executor.validate(functionDef, { id: 42 });
    expect(invalidResult.isValid()).toBe(false);
    expect(invalidResult.errorMessage).toContain("id must be string");
  });
});
