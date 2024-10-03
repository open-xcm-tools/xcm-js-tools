import {ChainInfo} from './registry';

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
  public readonly originChainInfo: ChainInfo;
  public readonly destChainInfo?: ChainInfo;

  constructor(
    originChainInfo: ChainInfo,
    destChainInfo?: ChainInfo,
    cause?: unknown,
  ) {
    const destChainDescr = destChainInfo
      ? `"${destChainInfo.chainId}"`
      : 'an unknown chain';

    super(
      `failed to estimate fees on ${destChainDescr} of a program sent from "${originChainInfo.chainId}"`,
      {cause},
    );
    this.originChainInfo = originChainInfo;
    this.destChainInfo = destChainInfo;
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
