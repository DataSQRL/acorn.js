export interface FunctionDefinitionArgument {
  type: string;
  description?: string;
  items?: FunctionDefinitionArgument;
  enum?: Set<unknown>;
}

export interface FunctionDefinitionParameters {
  type: string;
  properties: Record<string, FunctionDefinitionArgument>;
  required: string[];
  [property: string]: unknown;
}
/**
 * Definition of a chat function that can be invoked by the language model.
 *
 * This is essentially a TS definition of the json structure OpenAI and most LLMs use to
 * represent functions/tools.
 *
 * This should be updated whenever the model representation of a function changes. It should not
 * contain any extra functionality - those should be added to the respective wrapper classes.
 */
export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters: FunctionDefinitionParameters;
}
