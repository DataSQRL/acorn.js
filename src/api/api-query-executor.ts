import { FunctionDefinition } from "../tool/function-definition";
import { ValidationResult } from "../tool/validation-result";
import { APIQuery } from "./api-query";

export interface APIQueryExecutor {
  /**
   * Validates that the provided arguments are valid for the given FunctionDefinition.
   *
   * @param functionDef
   * @param args
   * @returns ValidationResult
   */
  validate(
    functionDef: FunctionDefinition,
    args?: Record<string, unknown>
  ): ValidationResult;
  validate(apiQuery: APIQuery): ValidationResult;

  /**
   * Executes the given query with the provided arguments against the API and returns the result as
   * a string.
   *
   * @param query the query to execute
   * @param args the arguments for the query
   * @returns The result of the query as a string
   * @throws Error if the connection to the API failed or the query could not be executed
   */
  executeQuery(
    query: APIQuery,
    args?: Record<string, unknown>
  ): Promise<string>;
}
