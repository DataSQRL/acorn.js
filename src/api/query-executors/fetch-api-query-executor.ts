import Ajv from "ajv";
import { ErrorType, FunctionDefinition, ValidationResult } from "../../tool";
import { ApiQuery } from "../api-query";
import { APIQueryExecutor } from "./api-query-executor";

export interface FetchApiQueryExecutorConfig {
  graphqlUri: string;
  enableValidation?: boolean;
  headers?: Record<string, string>;
}

/**
 * Default executor that always says function definition is valid
 * and returns "void" as execution result
 */
export class FetchApiQueryExecutor<TApiQuery extends ApiQuery = ApiQuery>
  implements APIQueryExecutor<TApiQuery>
{
  protected ajv: Ajv;
  protected readonly graphqlUri: string;
  public enableValidation: boolean;
  protected readonly headers?: Record<string, string>;

  constructor(config: FetchApiQueryExecutorConfig) {
    this.graphqlUri = config.graphqlUri;
    this.enableValidation = config.enableValidation || false;
    this.headers = config.headers;

    this.ajv = new Ajv();
  }

  protected async fetcher(
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(this.graphqlUri, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
    });
    if (!res.ok) {
      throw new Error("Failed to execute GraphQL call");
    }
    const { data } = await res.json();
    return data;
  }

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

  async executeQuery(
    query: TApiQuery,
    args?: Record<string, unknown>,
  ): Promise<string> {
    const data = await this.fetcher({
      query: query.query,
      variables: args,
    });
    return JSON.stringify(data);
  }
}
