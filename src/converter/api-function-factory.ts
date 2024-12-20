import { ApiQuery, APIQueryExecutor } from "../api";
import { APIFunction, FunctionDefinition } from "../tool";

/**
 * Functional interface for creating an APIFunction.
 */
export interface APIFunctionFactory<TApiQuery extends ApiQuery = ApiQuery> {
  apiExecutor: APIQueryExecutor<TApiQuery>;
  /**
   * Creates an APIFunction instance using the given FunctionDefinition and APIQuery.
   * @param function The function definition.
   * @param query The API query.
   * @returns An APIFunction instance.
   */
  create(
    functionDef: FunctionDefinition,
    query: ApiQuery,
  ): APIFunction<TApiQuery>;
}
