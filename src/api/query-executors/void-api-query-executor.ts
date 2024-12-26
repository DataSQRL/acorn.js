import { ValidationResult } from "../../tool";
import { ApiQuery } from "../api-query";
import { APIQueryExecutor } from "./api-query-executor";

/**
 * Default executor that always says function definition is valid
 * and returns "void" as execution result
 */
export class VoidApiQueryExecutor<TApiQuery extends ApiQuery = ApiQuery>
  implements APIQueryExecutor<TApiQuery>
{
  protected static readonly EXECUTION_RESULT = "void";

  enableValidation: boolean = false;

  validate(): ValidationResult {
    return ValidationResult.VALID;
  }

  executeQuery(): Promise<string> {
    return Promise.resolve(VoidApiQueryExecutor.EXECUTION_RESULT);
  }
}
