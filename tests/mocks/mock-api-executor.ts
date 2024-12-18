import { APIQuery } from "../../src/api/api-query";
import { APIQueryExecutor } from "../../src/api/api-query-executor";
import { FunctionDefinition } from "../../src/tool/function-definition";
import { ValidationResult } from "../../src/tool/validation-result";
export class MockAPIExecutor implements APIQueryExecutor {
  private queryToResult: (query: string) => string;

  constructor(queryToResult: (query: string) => string) {
    this.queryToResult = queryToResult;
  }
  static create(uniformResult: string): MockAPIExecutor {
    return new MockAPIExecutor(() => uniformResult);
  }

  validate(
    functionDef: FunctionDefinition,
    args?: Record<string, unknown>
  ): ValidationResult;
  validate(apiQuery: APIQuery): ValidationResult;
  validate(
    _functionDef: FunctionDefinition | APIQuery,
    _args?: Record<string, unknown>
  ): ValidationResult {
    return ValidationResult.VALID;
  }

  executeQuery(
    query: APIQuery,
    _arguments?: Record<string, unknown>
  ): Promise<string> {
    return Promise.resolve(this.queryToResult(query.queryString));
  }
}
