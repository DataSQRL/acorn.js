import { APIQuery } from "../api/api-query";
import { APIFunction } from "../tool/api-function";
import { FunctionDefinition } from "../tool/function-definition";

/**
 * Functional interface for creating an APIFunction.
 */
export interface APIFunctionFactory {
  /**
   * Creates an APIFunction instance using the given FunctionDefinition and APIQuery.
   * @param function The function definition.
   * @param query The API query.
   * @returns An APIFunction instance.
   */
  create(functionDef: FunctionDefinition, query: APIQuery): APIFunction;
}
