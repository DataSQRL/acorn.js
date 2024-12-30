import { FunctionDefinition, FunctionDefinitionParameters } from "../tool";

export const createDefaultFunctionDefinitionParameters =
  (): FunctionDefinitionParameters => ({
    type: "object",
    properties: {},
    required: [],
  });

export const createFunctionDefinition = (
  name: string,
  description?: string,
): FunctionDefinition => ({
  name,
  description,
  parameters: createDefaultFunctionDefinitionParameters(),
});
