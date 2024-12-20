import { ApiQuery, APIQueryExecutor, VoidApiQueryExecutor } from "../api";
import { APIFunction, FunctionDefinition } from "../tool";
import { APIFunctionFactory } from "./api-function-factory";

/**
 * Standard implementation of APIFunctionFactory.
 */
export class StandardAPIFunctionFactory<TApiQuery extends ApiQuery = ApiQuery>
  implements APIFunctionFactory<TApiQuery>
{
  constructor(
    private apiExecutor: APIQueryExecutor<TApiQuery> = new VoidApiQueryExecutor<TApiQuery>(),
    private contextKeys: Set<string> = new Set(),
  ) {}

  /**
   * Creates an APIFunction instance using the provided function definition and API query.
   * @param functionDef The function definition.
   * @param query The API query.
   * @returns An APIFunction instance.
   */
  create(
    functionDef: FunctionDefinition,
    query: TApiQuery,
  ): APIFunction<TApiQuery> {
    return new APIFunction<TApiQuery>(
      functionDef,
      this.contextKeys,
      query,
      this.apiExecutor,
    );
  }
}
