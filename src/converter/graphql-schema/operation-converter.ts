import {
  Kind,
  OperationDefinitionNode,
  OperationTypeNode,
  parse,
  VariableDefinitionNode,
} from "graphql/language";
import { ApiQuery } from "../../api";
import {
  APIFunction,
  FunctionDefinition,
  FunctionDefinitionParameters,
} from "../../tool";
import {
  createFunctionDefinition,
  getNodeDescriptionByLocation,
  getNodeStringByLocation,
} from "../../utils";
import { APIFunctionFactory } from "../api-function-factory";
import { StandardAPIFunctionFactory } from "../standard-api-function-factory";
import typeConverter from "./type-converter";

export interface OperationConverter<TApiQuery extends ApiQuery = ApiQuery> {
  convertOperations(operationDefinition: string): APIFunction<TApiQuery>[];
}

export class GraphQlOperationConverter<TApiQuery extends ApiQuery = ApiQuery>
  implements OperationConverter<TApiQuery>
{
  constructor(
    public readonly functionFactory: APIFunctionFactory<TApiQuery> = new StandardAPIFunctionFactory<TApiQuery>(),
  ) {}

  /**
   * Converts provided operation definitions to API function mappings
   * @param operationDefinition string that contains a list of operation definitions (queries & mutations).
   * But not an entire schema
   * @returns list of API Functions mapped from provided definitions
   */
  convertOperations(operationDefinition: string): APIFunction<TApiQuery>[] {
    const document = parse(operationDefinition);

    if (!document.definitions || document.definitions.length === 0) {
      throw new Error("Operation definition contains no definitions");
    }

    const functions = document.definitions.map((definition, idx) => {
      if (definition.kind !== Kind.OPERATION_DEFINITION) {
        throw new Error(
          `Expected definition to be an operation, but got: ${definition.kind}`,
        );
      }

      const prevNodeEndLocation = document.definitions[idx - 1]?.loc?.end;

      const functionDefinition = this.convertToFunctionDefinition(
        definition,
        operationDefinition,
        prevNodeEndLocation,
      );
      const query = getNodeStringByLocation(
        operationDefinition,
        definition.loc,
      );
      return this.functionFactory.create(functionDefinition, { query });
    });

    return functions;
  }

  /**
   * Create Function definition from OperationDefinitionNode
   * @param node OperationDefinitionNode from GraphQL Document
   * @param operationDefinition string that contains a list of operation definitions
   * @param prevNodeLocationEnd location where the previous node ends.
   * This information is used to narrow down the comments search, so value is recommended but optional.
   * @returns created function definition
   */
  protected convertToFunctionDefinition(
    node: OperationDefinitionNode,
    operationDefinition: string,
    prevNodeLocationEnd: number = 0,
  ): FunctionDefinition {
    const op = node.operation;
    if (op !== OperationTypeNode.QUERY && op !== OperationTypeNode.MUTATION) {
      throw new Error(`Do not support subscriptions: ${node.name}`);
    }

    // Get info for the FunctionDefinition
    const functionName = node.name?.value || "";
    const functionDescription = getNodeDescriptionByLocation(
      operationDefinition,
      node.loc?.start,
      prevNodeLocationEnd,
    );
    const functionDefinition: FunctionDefinition = createFunctionDefinition(
      functionName,
      functionDescription,
    );

    if (!node.variableDefinitions) {
      return functionDefinition;
    }

    // Get info for each the FunctionDefinitionArgument
    const parameters =
      node.variableDefinitions.reduce<FunctionDefinitionParameters>(
        (acc, variableDef, idx) => {
          // start searching from the end of previous node or from start of parent node
          const prevNodeLocationEnd =
            node.variableDefinitions?.[idx - 1]?.loc?.end || node.loc?.start;

          const { name, isRequired, argumentDefinition } =
            this.convertToArgumentDefinition(
              variableDef,
              operationDefinition,
              prevNodeLocationEnd,
            );

          acc.properties[name] = argumentDefinition;

          if (isRequired) {
            acc.required.push(name);
          }
          return acc;
        },
        // default parameters are initially used
        functionDefinition.parameters,
      );

    return {
      ...functionDefinition,
      parameters,
    };
  }

  /**
   * Create Function Argument definition from VariableDefinitionNode
   * @param variableDef VariableDefinitionNode from GraphQL OperationDefinitionNode
   * @param operationDefinition string that contains a list of operation definitions
   * @param prevNodeLocationEnd location where the previous node ends.
   * This information is used to narrow down the comments search, so value is recommended but optional.
   * @returns created function argument definition
   */
  protected convertToArgumentDefinition(
    variableDef: VariableDefinitionNode,
    operationDefinition: string,
    prevNodeLocationEnd: number = 0,
  ) {
    // unwrap NON_NULL_TYPE
    const { isRequired, type } = typeConverter.unwrapNullableTypeNode(
      variableDef.type,
    );
    // unwrap LIST_TYPE and add `type` field to argumentDefinition
    const argumentDefinition = typeConverter.typeNodeToArgumentDefinition(type);

    argumentDefinition.description = getNodeDescriptionByLocation(
      operationDefinition,
      variableDef.loc?.start,
      prevNodeLocationEnd,
    );

    return {
      name: variableDef.variable.name.value,
      argumentDefinition,
      isRequired,
    };
  }
}
