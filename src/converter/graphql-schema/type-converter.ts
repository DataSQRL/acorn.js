import { Kind, ListTypeNode, NamedTypeNode, TypeNode } from "graphql/language";
import { FunctionDefinitionArgument } from "../../tool";
import {
  GraphQLEnumType,
  GraphQLInputType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLOutputType,
  GraphQLScalarType,
} from "graphql";

export interface TypeNodeProcessor {
  kind: Kind;
  toArgument: (t: TypeNode) => FunctionDefinitionArgument;
}

export interface InputToArgumentProcessor {
  type: typeof GraphQLScalarType | typeof GraphQLEnumType | typeof GraphQLList;
  toArgument: (t: GraphQLInputType) => FunctionDefinitionArgument;
}

export interface UnwrapRequiredType {
  type: GraphQLInputType;
  required: boolean;
}

const DEFAULT_TS_TYPE = "string";
const scalarToTSTypesMap: Readonly<Record<string, string>> = {
  Int: "integer",
  Float: "number",
  String: "string",
  Boolean: "boolean",
  ID: "string",
};

const typeNodeProcessors = [
  {
    kind: Kind.LIST_TYPE,
    toArgument: (type: ListTypeNode) => ({
      type: "array",
      items: typeNodeToArgumentDefinition(type.type),
    }),
  },
  {
    kind: Kind.NAMED_TYPE,
    toArgument: (type: NamedTypeNode) => ({
      type: scalarToTSTypesMap[type.name.value] || DEFAULT_TS_TYPE,
    }),
  },
] as TypeNodeProcessor[];

const unwrapNullableTypeNode = (type: TypeNode) => {
  return {
    isRequired: type.kind === Kind.NON_NULL_TYPE,
    type: type.kind === Kind.NON_NULL_TYPE ? type.type : type,
  };
};

const typeNodeToArgumentDefinition = (
  type: TypeNode,
): FunctionDefinitionArgument => {
  const processor = typeNodeProcessors.find(({ kind }) => type.kind === kind);
  if (!processor) {
    throw new Error(`Unexpected type: ${type.kind}`);
  }

  return processor.toArgument(type);
};

const unwrapType = (type: GraphQLOutputType): GraphQLOutputType => {
  if (type instanceof GraphQLList) {
    return unwrapType(type.ofType);
  } else if (type instanceof GraphQLNonNull) {
    return unwrapType(type.ofType);
  } else {
    return type;
  }
};

const unwrapRequiredType = (type: GraphQLInputType): UnwrapRequiredType => {
  if (type instanceof GraphQLNonNull) {
    return {
      type: type.ofType,
      required: true,
    };
  }
  return {
    type: type,
    required: false,
  };
};

const inputToArgumentProcessors = [
  {
    type: GraphQLScalarType,
    toArgument: (type: GraphQLScalarType) => ({
      type: scalarToTSTypesMap[type.name] || DEFAULT_TS_TYPE,
    }),
  },
  {
    type: GraphQLEnumType,
    toArgument: (type: GraphQLEnumType) => ({
      type: "string",
      enum: new Set(type.getValues().map((val) => val.name)),
    }),
  },
  {
    type: GraphQLList,
    toArgument: (type: GraphQLList<GraphQLInputType>) => ({
      type: "array",
      items: convertToArgument(unwrapRequiredType(type.ofType).type),
    }),
  },
] as InputToArgumentProcessor[];

const convertToArgument = (
  type: GraphQLInputType,
): FunctionDefinitionArgument => {
  const processor = inputToArgumentProcessors.find(
    (p) => type instanceof p.type,
  );
  if (!processor) {
    throw new Error(`Unexpected type: ${typeof type}`);
  }

  return processor.toArgument(type);
};

const typeConverter = {
  DEFAULT_TS_TYPE,
  scalarToTSTypesMap,
  unwrapNullableTypeNode,
  typeNodeToArgumentDefinition,
  unwrapType,
  unwrapRequiredType,
  convertToArgument,
};

export default typeConverter;
