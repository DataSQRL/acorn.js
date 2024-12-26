import { DynamicStructuredTool, tool, ToolParams } from "@langchain/core/tools";
import type {
  APIFunction,
  FunctionDefinitionArgument,
  FunctionDefinitionParameters,
} from "../../tool";
import type { ApiQuery } from "../../api";
import { z, ZodSchema } from "zod";

const zodSchemaProcessors = [
  {
    // Array schema
    match: (arg: FunctionDefinitionArgument) => arg.type === "array",
    toSchema: (arg: FunctionDefinitionArgument) =>
      z.array(
        arg.items ? jsonArgumentToZodSchema(arg.items, true) : z.undefined(),
      ),
  },
  {
    // Enum schema
    match: (arg: FunctionDefinitionArgument) =>
      arg.type === "string" && arg.enum && arg.enum.size > 0,
    toSchema: (arg: FunctionDefinitionArgument) => {
      const enumValues = Object.values(arg.enum || {}).map(String);
      return z.enum(enumValues as Parameters<typeof z.enum>[0]);
    },
  },
  {
    // Int schema
    match: (arg: FunctionDefinitionArgument) => arg.type === "integer",
    toSchema: () => z.number().int(),
  },
  {
    // Float schema
    match: (arg: FunctionDefinitionArgument) => arg.type === "number",
    toSchema: () => z.number(),
  },
  {
    // Boolean schema
    match: (arg: FunctionDefinitionArgument) => arg.type === "boolean",
    toSchema: () => z.boolean(),
  },
  {
    // string schema
    match: (arg: FunctionDefinitionArgument) => arg.type === "string",
    toSchema: () => z.string(),
  },
];

const jsonArgumentToZodSchema = (
  arg: FunctionDefinitionArgument,
  isRequired: boolean,
): ZodSchema => {
  const processor = zodSchemaProcessors.find((p) => p.match(arg));
  // use string schema as a fallback
  const toSchema = processor?.toSchema || (() => z.string());
  let schema: ZodSchema = toSchema(arg);

  if (!isRequired) {
    schema = schema.optional();
  }
  if (arg.description) {
    schema = schema.describe(arg.description);
  }
  return schema;
};

export const jsonParamsToZodSchema = (params: FunctionDefinitionParameters) => {
  const fields: Record<string, ZodSchema> = {};
  for (let key in params.properties) {
    fields[key] = jsonArgumentToZodSchema(
      params.properties[key],
      params.required.includes(key),
    );
  }
  return z.object(fields);
};

/**
 * Convert `APIFunction[]` to array of tools supported by `@langchain/langgraph`
 */
export function toLangChainTools(
  toolsInfo: APIFunction<ApiQuery>[],
  toolParams?: ToolParams,
): DynamicStructuredTool[];
export function toLangChainTools(
  toolsInfo: APIFunction<ApiQuery>,
  toolParams?: ToolParams,
): DynamicStructuredTool;
export function toLangChainTools(
  toolsInfo: APIFunction<ApiQuery>[] | APIFunction<ApiQuery>,
  toolParams?: ToolParams,
): DynamicStructuredTool[] | DynamicStructuredTool {
  if (Array.isArray(toolsInfo)) {
    return toolsInfo.map((t) => toLangChainTools(t, toolParams));
  }
  return tool((input) => toolsInfo.validateAndExecute(input), {
    ...toolParams,
    name: toolsInfo.function.name,
    description: toolsInfo.function.description,
    schema: jsonParamsToZodSchema(toolsInfo.function.parameters),
  });
}
