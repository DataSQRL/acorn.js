import { APIQuery } from "../api/api-query";
import { APIQueryExecutor } from "../api/api-query-executor";
import { APIFunction } from "../tool/api-function";
import { FunctionDefinition } from "../tool/function-definition";
import { APIFunctionFactory } from "./api-function-factory";

/**
 * Standard implementation of APIFunctionFactory.
 */
export class StandardAPIFunctionFactory implements APIFunctionFactory {
  constructor(
    private apiExecutor: APIQueryExecutor,
    private contextKeys: Set<string>,
  ) {}

  /**
   * Creates an APIFunction instance using the provided function definition and API query.
   * @param functionDef The function definition.
   * @param query The API query.
   * @returns An APIFunction instance.
   */
  create(functionDef: FunctionDefinition, query: APIQuery): APIFunction {
    return new APIFunction(
      functionDef,
      this.contextKeys,
      query,
      this.apiExecutor,
    );
  }
}
