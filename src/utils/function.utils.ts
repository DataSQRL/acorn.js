import { FunctionDefinition, FunctionDefinitionParameters } from "../tool";
import type { Context } from "../tool"; // Placeholder for the Context class/module

/**
 * Adds or overrides data with values from the context.
 *
 * @param argumentsNode - Original JSON node
 * @param contextKeys - Set of keys to add/override
 * @param context - Context object containing the values
 * @param mapper - ObjectMapper instance
 * @returns - New JSON node with the added/overridden context
 * @throws - Error if any context key is missing in the context
 */
export const addOrOverrideFromContext = <T extends {}>(
  argumentsNode: Record<string, unknown> | null,
  contextKeys: Set<string>,
  context: Context<T>,
): Record<string, unknown> => {
  const copyJsonNode = argumentsNode ? { ...argumentsNode } : {};

  contextKeys.forEach((contextKey) => {
    const value = context.get(contextKey);
    if (value === undefined || value === null) {
      throw new Error(`Missing context field: ${contextKey}`);
    }
    copyJsonNode[contextKey] = value;
  });

  return copyJsonNode;
};

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
