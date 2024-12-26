import {
  ApiQuery,
  APIQueryExecutor,
  FetchApiQueryExecutor,
  FetchApiQueryExecutorConfig,
} from "../../api";
import { APIFunction, FunctionDefinitionParameters } from "../../tool";
import { APIFunctionFactory } from "../api-function-factory";
import graphQlSchemaConverterConfig, {
  GraphQLSchemaConverterConfig,
} from "./schema-converter-config";
import {
  combineArgNameStrings,
  combineOperationNameStrings,
  createFunctionDefinition,
  getNodeDescriptionByLocation,
  printArgumentType,
  printFieldType,
  processField,
} from "../../utils";
import { VisitContext } from "./visit-context";
import typeConverter from "./type-converter";
import { StandardAPIFunctionFactory } from "../standard-api-function-factory";
import {
  buildClientSchema,
  buildSchema,
  getIntrospectionQuery,
  printSchema,
} from "graphql/utilities";
import {
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLObjectType,
} from "graphql/type";

export interface SchemaConverter<TApiQuery extends ApiQuery = ApiQuery> {
  convertSchema(schemaDefinition: string): APIFunction<TApiQuery>[];
  convertSchemaFromApiExecutor(): Promise<APIFunction<TApiQuery>[]>;
}

export class GraphQLSchemaConverter<TApiQuery extends ApiQuery = ApiQuery>
  implements SchemaConverter<TApiQuery>
{
  constructor(
    private functionFactory: APIFunctionFactory<TApiQuery> = new StandardAPIFunctionFactory<TApiQuery>(),
    private config: GraphQLSchemaConverterConfig = graphQlSchemaConverterConfig.create(),
  ) {}

  static createToolsFromApiUri(config: FetchApiQueryExecutorConfig) {
    const apiExecutor = new FetchApiQueryExecutor(config);
    const converter = new GraphQLSchemaConverter(
      new StandardAPIFunctionFactory(apiExecutor),
    );
    return converter.convertSchemaFromApiExecutor();
  }

  static convertSchema(
    schemaDefinition: string,
    apiExecutor?: APIQueryExecutor,
  ): APIFunction<ApiQuery>[] {
    const converter = new GraphQLSchemaConverter(
      new StandardAPIFunctionFactory(apiExecutor),
    );
    return converter.convertSchema(schemaDefinition);
  }

  async convertSchemaFromApiExecutor() {
    const introspectionQuery = {
      query: getIntrospectionQuery(),
    } as TApiQuery;
    const res =
      await this.functionFactory.apiExecutor.executeQuery(introspectionQuery);
    const schemaDefinition = buildClientSchema(JSON.parse(res));
    return this.convertSchema(printSchema(schemaDefinition));
  }

  convertSchema(schemaDefinition: string): APIFunction<TApiQuery>[] {
    const schema = buildSchema(schemaDefinition);

    const queryType = schema.getQueryType();
    const mutationType = schema.getMutationType();

    const queries = queryType?.getFields() || {};
    const mutations = mutationType?.getFields() || {};

    const functionsFromQueries = Object.values(queries)
      .map(
        this.createApiFunctionFromGraphQLOperation("query", schemaDefinition),
      )
      .filter(Boolean);
    const functionsFromMutations = Object.values(mutations)
      .map(
        this.createApiFunctionFromGraphQLOperation(
          "mutation",
          schemaDefinition,
        ),
      )
      .filter(Boolean);

    return [
      ...functionsFromQueries,
      ...functionsFromMutations,
    ] as APIFunction<TApiQuery>[];
  }

  private createApiFunctionFromGraphQLOperation =
    (operationName: "query" | "mutation", schemaDefinition: string) =>
    (field: GraphQLField<any, any>) => {
      try {
        if (this.config.operationFilter(operationName, field.name)) {
          return this.convertToApiFunction(
            operationName,
            field,
            schemaDefinition,
          );
        }
      } catch (e) {
        console.error(`Error converting query: ${field.name}`, e);
      }
      return null;
    };

  private convertToApiFunction(
    operationType: "query" | "mutation",
    field: GraphQLField<any, any>,
    schemaDefinition: string,
  ): APIFunction<TApiQuery> {
    const functionDef = createFunctionDefinition(
      field.name,
      field.description?.trim(),
    );
    const operationName = combineOperationNameStrings(
      operationType.toLowerCase(),
      field.name,
    );
    const queryHeader = `${operationType.toLowerCase()} ${field.name}(`;

    const { queryParams, queryBody } = this.visit(
      field,
      functionDef.parameters,
      new VisitContext(schemaDefinition, operationName, "", 0, []),
    );

    const query = `${queryHeader}${queryParams}) {\n${queryBody}\n}`;
    return this.functionFactory.create(functionDef, { query });
  }

  public visit(
    field: GraphQLField<any, any>,
    params: FunctionDefinitionParameters,
    context: VisitContext,
  ) {
    let queryParams = "";
    let queryBody = "";
    const type = typeConverter.unwrapType(field.type);

    if (type instanceof GraphQLObjectType) {
      // Don't recurse in a cycle or if depth limit is exceeded
      if (context.path.includes(type)) {
        if (this.config.verbose) {
          console.info(
            `Detected cycle on operation '${context.operationName}'. Aborting traversal.`,
          );
        }
        return { success: false, queryParams, queryBody };
      } else if (context.path.length + 1 > this.config.maxDepth) {
        if (this.config.verbose) {
          console.info(
            `Aborting traversal because depth limit exceeded on operation '${context.operationName}'`,
          );
        }
        return { success: false, queryParams, queryBody };
      }
    }

    queryBody += field.name;
    let numArgs = 0;

    if (field.args.length > 0) {
      queryBody += "(";

      for (let i = 0; i < field.args.length; i++) {
        const arg = field.args[i];
        let unwrappedType = typeConverter.unwrapRequiredType(arg.type);

        if (unwrappedType.type instanceof GraphQLInputObjectType) {
          const inputType = unwrappedType.type;
          const isFirstArg = i === 0;
          queryBody += `${isFirstArg ? "" : ", "}${arg.name}: { `;

          const nestedFields = Object.values(inputType.getFields());
          for (let j = 0; j < nestedFields.length; j++) {
            const isFirstNestedField = j === 0;
            const nestedField = nestedFields[j];
            unwrappedType = typeConverter.unwrapRequiredType(nestedField.type);

            const precessedData = processField(
              params,
              context,
              numArgs,
              unwrappedType,
              combineArgNameStrings(context.prefix, nestedField.name),
              nestedField.name,
              nestedField.description?.trim() ??
                getNodeDescriptionByLocation(
                  context.schemaDefinition,
                  nestedField.astNode?.loc?.start,
                  inputType.astNode?.loc?.start,
                ),
            );
            queryParams += precessedData.queryHeader;
            if (
              isFirstNestedField &&
              precessedData.queryBody.startsWith(", ")
            ) {
              precessedData.queryBody = precessedData.queryBody.substring(2);
            }
            queryBody += precessedData.queryBody;

            const typeString = printFieldType(nestedField);
            queryParams += `${precessedData.argName}: ${typeString}`;
            numArgs++;
          }

          queryBody += " }";
        } else {
          const precessedData = processField(
            params,
            context,
            numArgs,
            unwrappedType,
            combineArgNameStrings(context.prefix, arg.name),
            arg.name,
            arg.description?.trim() ??
              getNodeDescriptionByLocation(
                context.schemaDefinition,
                arg.astNode?.loc?.start,
                field.astNode?.loc?.start,
              ),
          );
          queryParams += precessedData.queryHeader;
          queryBody += precessedData.queryBody;

          const typeString = printArgumentType(arg);
          queryParams += `${precessedData.argName}: ${typeString}`;
          numArgs++;
        }
      }

      queryBody += ")";
    }

    if (type instanceof GraphQLObjectType) {
      const objectType = type;

      queryBody += " {\n";
      let atLeastOneField = false;

      for (const nestedField of Object.values(objectType.getFields())) {
        const {
          success,
          queryParams: queryParamsNested,
          queryBody: queryBodyNested,
        } = this.visit(
          nestedField,
          params,
          context.nested(
            context.schemaDefinition,
            nestedField.name,
            objectType,
            numArgs,
          ),
        );
        queryParams += queryParamsNested;
        queryBody += queryBodyNested;
        atLeastOneField ||= success;
      }

      if (!atLeastOneField) {
        throw new Error(
          `Expected at least one field on path: ${context.operationName}`,
        );
      }

      queryBody += "}";
    }

    queryBody += "\n";
    return {
      success: true,
      queryParams,
      queryBody,
    };
  }
}
// Re-export static method so it can be used in a functional style in minimal example
export const createToolsFromApiUri =
  GraphQLSchemaConverter.createToolsFromApiUri;
export const convertSchema = GraphQLSchemaConverter.convertSchema;
