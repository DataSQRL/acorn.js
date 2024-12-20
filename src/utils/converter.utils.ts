import { Location } from "graphql/language";

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
