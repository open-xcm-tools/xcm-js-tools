class ValidationError extends Error {
  public readonly method: string;
  public readonly reason: string;
  public readonly description: string | undefined;

  constructor(
    method: string,
    reason: string,
    description: string | undefined,
    cause?: Error
  ) {
    super(reason, { cause: cause });
    this.method = method;
    this.name = 'Validation error';
    this.reason = reason;
    this.description = description;
  }
}

export class JunctionValidationError extends ValidationError {
  constructor(field: string, description: string, cause?: Error) {
    super('Junction Validation', field, description, cause);
    this.name = 'Junction validation error';
  }
}
