import {ChainIdentity} from './registry';

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

export class FeeEstimationError extends Error {
  public readonly originChainIdentity: ChainIdentity;
  public readonly destChainIdentity?: ChainIdentity;

  constructor(
    originChainIdentity: ChainIdentity,
    destChainIdentity?: ChainIdentity,
    cause?: unknown,
  ) {
    const destChainDescr = destChainIdentity
      ? `"${destChainIdentity.name}"`
      : 'an unknown chain';

    super(
      `failed to estimate fees on ${destChainDescr} of a program sent from "${originChainIdentity.name}"`,
      {cause},
    );
    this.originChainIdentity = originChainIdentity;
    this.destChainIdentity = destChainIdentity;
  }
}

export class FeeEstimationErrors extends Error {
  public errors: FeeEstimationError[];

  constructor(errors: FeeEstimationError[]) {
    super(`fee estimation failed: ${errors.length} error(s) encountered`, {
      cause: errors,
    });
    this.errors = errors;
  }
}
