const ARG_NAME_SEPARATOR = "_";
const OPERATION_NAME_SEPARATOR = ".";

/**
 *
 * @param strings list of strings to be combined
 * @returns strings combined with `_` symbol
 * @example
 * // returns hello_world
 * combineArgNameStrings('hello', 'world')
 *
 * // returns hello
 * combineArgNameStrings('hello')
 */
export const combineArgNameStrings = (...strings: string[]) => {
  return strings.filter(Boolean).join(ARG_NAME_SEPARATOR);
};

/**
 *
 * @param strings list of strings to be combined
 * @returns strings combined with `.` symbol
 * @example
 * // returns hello.world
 * combineOperationNameStrings('hello', 'world')
 *
 * // returns hello
 * combineOperationNameStrings('hello')
 */
export const combineOperationNameStrings = (...strings: string[]) => {
  return strings.filter(Boolean).join(OPERATION_NAME_SEPARATOR);
};
