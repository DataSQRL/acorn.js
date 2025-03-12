import {
  ApiQuery,
  APIQueryExecutor,
  ErrorType,
  FunctionDefinition,
  ValidationResult,
} from "@datasqrl/acorn-node";
import Ajv from "ajv";
import axios from "axios";

/**
 * Custom API query executor that uses axios instead of fetch
 * and adds custom authentication headers
 */
export class CustomApiQueryExecutor implements APIQueryExecutor {
  private ajv: Ajv;
  public enableValidation: boolean;

  constructor(
    private graphqlEndpoint: string,
    private apiKey: string,
    options: { enableValidation?: boolean } = {},
  ) {
    this.enableValidation = options.enableValidation || false;
    this.ajv = new Ajv();
  }

  /**
   * Validates the arguments against the function definition
   */
  validate(
    functionDef: FunctionDefinition,
    args?: Record<string, unknown>,
  ): ValidationResult {
    if (!this.enableValidation) {
      return ValidationResult.VALID;
    }

    try {
      const isValidArgs = this.ajv.compile(functionDef.parameters);

      if (args && !isValidArgs(args)) {
        return new ValidationResult(
          ErrorType.INVALID_ARGUMENT,
          isValidArgs.errors
            ?.map(
              (e) =>
                e.instancePath.split("/").filter(Boolean).join(".") +
                " " +
                e.message,
            )
            .join("\n"),
        );
      }
      return ValidationResult.VALID;
    } catch (e) {
      return new ValidationResult(
        ErrorType.INVALID_JSON,
        e instanceof Error ? e.message : undefined,
      );
    }
  }

  /**
   * Executes the GraphQL query with custom handling
   */
  async executeQuery(
    query: ApiQuery,
    args?: Record<string, unknown>,
  ): Promise<string> {
    try {
      // Using axios instead of fetch
      const response = await axios.post(
        this.graphqlEndpoint,
        {
          query: query.query,
          variables: args,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            // Add any other custom headers here
            "X-Custom-Header": "CustomValue",
          },
        },
      );

      // Check for GraphQL errors
      if (response.data.errors) {
        throw new Error(
          `GraphQL errors: ${JSON.stringify(response.data.errors)}`,
        );
      }

      return JSON.stringify(response.data.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `API request failed: ${error.message}, Status: ${error.response?.status}`,
        );
      }
      throw error;
    }
  }

  /**
   * Optional: Add custom methods for your specific needs
   */
  async executeRawQuery(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<any> {
    const response = await axios.post(
      this.graphqlEndpoint,
      {
        query,
        variables,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    return response.data;
  }
}
