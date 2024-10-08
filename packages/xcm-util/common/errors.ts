class ValidationError extends Error {
  public readonly method: string;
  public readonly reason: string;
  public readonly description: string | undefined;

  constructor(
    method: string,
    reason: string,
    description: string | undefined,
    cause?: Error,
  ) {
    super(reason, {cause: cause});
    this.method = method;
    this.name = 'validation error';
    this.reason = reason;
    this.description = description;
  }
}

export class SanitizationError extends ValidationError {
  constructor(reason: string, description: string, cause?: Error) {
    super('Sanitization', reason, description, cause);
    this.name = 'Sanitization error';
  }
}
