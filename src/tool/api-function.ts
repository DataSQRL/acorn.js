import { ApiQuery, APIQueryExecutor } from "../api";
import { FunctionDefinition } from "./function-definition";
import { ValidationResult } from "./validation-result";

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export class APIFunction<TApiQuery extends ApiQuery = ApiQuery> {
  public static readonly createInvalidCallMessage = (
    functionName: string,
    errorMessage?: string,
  ) =>
    `It looks like you tried to call function \`${functionName}\`, ` +
    `but this has failed with the following error: ${errorMessage}. ` +
    "Please retry to call the function again. Send ONLY the JSON as a response.";

  public static async executeTools(
    toolsToCall: ToolCall,
    toolDefinitions: APIFunction[],
  ): Promise<string>;
  public static async executeTools(
    toolsToCall: ToolCall[],
    toolDefinitions: APIFunction[],
  ): Promise<string[]>;
  public static async executeTools(
    toolsToCall: ToolCall[] | ToolCall,
    toolDefinitions: APIFunction[],
  ) {
    const toolsMap = new Map(toolDefinitions.map((t) => [t.getName(), t]));

    if (!Array.isArray(toolsToCall)) {
      // execute single tool
      const apiFunction = toolsMap.get(toolsToCall.name);
      const res = await apiFunction?.validateAndExecute(toolsToCall.arguments);
      return res || "";
    }

    return Promise.all(
      toolsToCall.map((toolCall) => {
        return APIFunction.executeTools(toolCall, toolDefinitions);
      }) || [],
    );
  }

  readonly function: FunctionDefinition;

  constructor(
    func: FunctionDefinition,
    public readonly apiQuery: TApiQuery,
    public readonly apiExecutor: APIQueryExecutor<TApiQuery>,
  ) {
    // function is reserved word and cannot be used inc constructor
    this.function = func;
    const validationResult = apiExecutor.validate(func);
    if (!validationResult.isValid()) {
      throw new Error(
        `Function [${func.name}] invalid for API [${apiExecutor}]: ${validationResult.errorMessage}`,
      );
    }
  }

  getName(): string {
    return this.function.name;
  }

  validate(argumentsNode: Record<string, unknown> = {}): ValidationResult {
    return this.apiExecutor.validate(this.function, argumentsNode);
  }

  async execute(variables: Record<string, unknown> = {}): Promise<string> {
    return this.apiExecutor.executeQuery(this.apiQuery, variables);
  }

  async validateAndExecute(
    argumentsNode: Record<string, unknown> = {},
  ): Promise<string> {
    const validationResult = this.validate(argumentsNode);

    if (validationResult.isValid()) {
      return this.execute(argumentsNode);
    }
    throw new Error(
      APIFunction.createInvalidCallMessage(
        this.function.name,
        validationResult.errorMessage,
      ),
    );
  }

  async validateAndExecuteFromString(argsJson: string): Promise<string> {
    try {
      const parsedArguments = JSON.parse(argsJson);
      return this.validateAndExecute(parsedArguments);
    } catch (error) {
      return APIFunction.createInvalidCallMessage(
        this.function.name,
        `Malformed JSON: ${typeof error === "object" && error && "message" in error ? error.message : error}`,
      );
    }
  }

  public toJSON() {
    return {
      function: this.function,
      apiQuery: this.apiQuery,
    };
  }
}
