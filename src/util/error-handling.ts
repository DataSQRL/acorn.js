export class ErrorHandling {
  /**
   * Checks if the given condition is true. If not, throws an error with the message.
   *
   * @param condition The condition to check
   * @param message The error message (supports formatting)
   * @param args The arguments for message formatting
   * @throws {Error} Throws an error if the condition is false
   */
  static checkArgument(
    condition: boolean,
    message: string = "Unexpected arguments in method invocation"
  ): void {
    if (!condition) {
      throw new Error(message);
    }
  }
}
