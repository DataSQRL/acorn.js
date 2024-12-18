export const enum ErrorType {
  NONE = "NONE",
  NOT_FOUND = "NOT_FOUND",
  INVALID_JSON = "INVALID_JSON",
  INVALID_ARGUMENT = "INVALID_ARGUMENT",
}

export class ValidationResult {
  static readonly VALID = new ValidationResult(ErrorType.NONE);

  constructor(
    public errorType: ErrorType,
    public errorMessage?: string,
  ) {}

  isValid() {
    return this.errorType === ErrorType.NONE;
  }
}
