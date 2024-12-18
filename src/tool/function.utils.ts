import type { Context } from "./context"; // Placeholder for the Context class/module
import type { APIFunction } from "./api-function"; // Placeholder for the APIFunction class/module

export class FunctionUtil {
  /**
   * Converts a list of APIFunction objects to a JSON string.
   *
   * @param tools - List of APIFunction objects
   * @returns - Pretty-printed JSON string
   * @throws - Error if serialization fails
   */
  static async toJsonString(tools: APIFunction[]): Promise<string> {
    return JSON.stringify(tools, null, 2);
  }

  /**
   * Adds or overrides context in a JSON node.
   *
   * @param argumentsNode - Original JSON node
   * @param contextKeys - Set of keys to add/override
   * @param context - Context object containing the values
   * @param mapper - ObjectMapper instance
   * @returns - New JSON node with the added/overridden context
   * @throws - Error if any context key is missing in the context
   */
  static addOrOverrideContext<T extends {}>(
    argumentsNode: Record<string, unknown> | null,
    contextKeys: Set<string>,
    context: Context<T>
  ): Record<string, unknown> {
    const copyJsonNode = argumentsNode ? { ...argumentsNode } : {};

    contextKeys.forEach((contextKey) => {
      const value = context.get(contextKey);
      if (value === undefined || value === null) {
        throw new Error(`Missing context field: ${contextKey}`);
      }
      copyJsonNode[contextKey] = value;
    });

    return copyJsonNode;
  }
}
