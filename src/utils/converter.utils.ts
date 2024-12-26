import { Location } from "graphql/language";
import { FunctionDefinitionParameters } from "../tool";
import { UnwrapRequiredType, VisitContext } from "../converter";
import typeConverter from "../converter/graphql-schema/type-converter";
import { printType } from "graphql/utilities";
import {
  GraphQLArgument,
  GraphQLInputField,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLString,
} from "graphql/type";

const matchers = [
  {
    // Regex to find singleline GraphQL comments in text. eg # Comment
    regex: /#(.*)$/g,
    // remove # symbol from the start
    clean: (match: string) => match.substring(1).trim(),
  },
  {
    // Regex to find multiline GraphQL comments in text. eg """ Comment """
    regex: /"""((?!""")[\s\S])*"""$/g,
    // remove """ symbols around the text
    clean: (match: string) => match.substring(3, match.length - 3).trim(),
  },
];

/**
 * Parse and return comment content from an operation definition string
 * @param definitionString a string with all operation definitions you are currently processing
 * @param nodeLocationStart the starting index of the node for which you are looking for a comment
 * @param parentLocationStart the starting index of the parent node.
 * This information is used to narrow down the search, so it is recommended but optional.
 * @returns string with a comment or `undefined` if there were no comment or comment was empty
 */
export const getNodeDescriptionByLocation = (
  definitionString: string,
  nodeLocationStart?: number,
  parentLocationStart: number = 0,
) => {
  if (nodeLocationStart == null || parentLocationStart == null) {
    return undefined;
  }
  const contentToSearchForComments = definitionString
    .substring(parentLocationStart, nodeLocationStart)
    .trim();

  for (const matcher of matchers) {
    const res = contentToSearchForComments.match(matcher.regex);
    const match = res?.[0];
    if (match) {
      // Comment found. Cleanup regex result
      return matcher.clean(match) || undefined;
    }
  }

  // There was no comment
  return undefined;
};

/**
 * Parse and return text content of a node in selected location
 * @param definitionString a string with all operation definitions you are currently processing
 * @param location the location of the node for which you want to get the text content
 * @param stripComments remove inline comments from output string. `true` by default
 * @returns a string with the content of the node
 */
export const getNodeStringByLocation = (
  definitionString: string,
  location?: Location,
  stripComments = true,
) => {
  // Get substring with GraphQL operation
  const nodeString = definitionString.substring(
    location?.start || 0,
    location?.end || definitionString.length,
  );

  if (!stripComments) {
    return nodeString;
  }

  // Remove singleline comments
  // Multiline comments will fail to parse in `convertOperation` call
  // so no need to process them here
  const lines = nodeString
    .split("\n")
    .map((line) => {
      const commentPosition = line.indexOf("#");
      return commentPosition === -1
        ? line
        : line.substring(0, commentPosition).trim();
    })
    .filter(Boolean);

  return lines.join("\n");
};

export const processField = (
  params: FunctionDefinitionParameters,
  ctx: VisitContext,
  numArgs: number,
  unwrappedType: UnwrapRequiredType,
  argName: string,
  originalName: string,
  description?: string,
) => {
  let queryBody = "";
  let queryHeader = "";
  const argDef = typeConverter.convertToArgument(unwrappedType.type);
  argDef.description = description;

  if (numArgs > 0) {
    queryBody += ", ";
  }
  if (ctx.numArgs + numArgs > 0) {
    queryHeader += ", ";
  }

  if (unwrappedType.required) {
    params.required.push(argName);
  }
  params.properties[argName] = argDef;

  argName = "$" + argName;
  queryBody += originalName + ": " + argName;

  return {
    argName,
    queryHeader,
    queryBody,
  };
};

export const extractTypeFromDummy = (output: string, fieldName: string) => {
  // Remove comments
  output = output
    .split("\n")
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n");

  const pattern = new RegExp(`${fieldName}\\s*:\\s*([^)}]+)`);
  const match = output.match(pattern);

  if (!match) {
    throw new Error(`Could not find type in: ${output}`);
  }

  return match[1].trim();
};
export const printFieldType = (field: GraphQLInputField) => {
  const type = new GraphQLInputObjectType({
    name: "DummyType",
    fields: {
      [field.name]: field,
    },
  });
  const output = printType(type);
  return extractTypeFromDummy(output, field.name);
};

export const printArgumentType = (argument: GraphQLArgument) => {
  const { description, ...argumentWithoutDescription } = argument;

  const type = new GraphQLObjectType({
    name: "DummyType",
    fields: {
      dummyField: {
        type: GraphQLString,
        args: {
          [argumentWithoutDescription.name]: argumentWithoutDescription,
        },
      },
    },
  });
  const output = printType(type);
  return extractTypeFromDummy(output, argument.name);
};
