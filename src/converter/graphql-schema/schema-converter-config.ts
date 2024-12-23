export type GraphQLSchemaConverterConfigOperationFilter = (
  operation: string,
  name: string,
) => boolean;
export interface GraphQLSchemaConverterConfig {
  operationFilter: GraphQLSchemaConverterConfigOperationFilter;
  maxDepth: number;
  verbose: boolean;
}

export const alwaysTrulyOperationFilter: GraphQLSchemaConverterConfigOperationFilter =
  () => true;
export const createIgnorePrefixOperationFilter = (
  ...prefixes: string[]
): GraphQLSchemaConverterConfigOperationFilter => {
  const prefixesLower = prefixes.map((prefix) => prefix.trim().toLowerCase());
  return (_operation: string, name: string) =>
    !prefixesLower.some((prefixLower) =>
      name.trim().toLowerCase().startsWith(prefixLower),
    );
};

const graphQlSchemaConverterConfig = {
  alwaysTrulyOperationFilter,
  createIgnorePrefixOperationFilter,
  create: (
    operationFilter = alwaysTrulyOperationFilter,
    maxDepth = 3,
    verbose = false,
  ): GraphQLSchemaConverterConfig => ({
    operationFilter,
    maxDepth,
    verbose,
  }),
};
export default graphQlSchemaConverterConfig;
