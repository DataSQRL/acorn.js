import { ApiQuery } from "../../src/api/api-query";
import { APIQueryExecutor } from "../../src/api/query-executors/api-query-executor";
import { FunctionDefinition } from "../../src/tool/function-definition";
import { ValidationResult } from "../../src/tool/validation-result";
export class MockAPIExecutor implements APIQueryExecutor<ApiQuery> {
  private queryToResult: (query: string) => string;

  constructor(queryToResult: (query: string) => string) {
    this.queryToResult = queryToResult;
  }
  static create(uniformResult: string): MockAPIExecutor {
    return new MockAPIExecutor(() => uniformResult);
  }

  validate(
    functionDef: FunctionDefinition,
    args?: Record<string, unknown>,
  ): ValidationResult;
  validate(apiQuery: ApiQuery): ValidationResult;
  validate(
    _functionDef: FunctionDefinition | ApiQuery,
    _args?: Record<string, unknown>,
  ): ValidationResult {
    return ValidationResult.VALID;
  }

  executeQuery(
    query: ApiQuery,
    _arguments?: Record<string, unknown>,
  ): Promise<string> {
    return Promise.resolve(this.queryToResult(query.query));
  }
}
