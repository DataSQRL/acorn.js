import { ValidationResult } from "../../tool";
import { ApiQuery } from "../api-query";
import { APIQueryExecutor } from "./api-query-executor";

/**
 * Default executor that always says function definition is valid
 * and returns "void" as execution result
 */
export class FetchApiQueryExecutor<TApiQuery extends ApiQuery = ApiQuery>
  implements APIQueryExecutor<TApiQuery>
{
  constructor(
    protected readonly graphqlUri: string,
    protected readonly headers?: Record<string, string>,
  ) {}

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

  validate(): ValidationResult {
    return ValidationResult.VALID;
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
