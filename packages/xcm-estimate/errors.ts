import {ChainIdentity} from '@open-xcm-tools/xcm-types';

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

export class TooExpensiveFeeError extends Error {
  public readonly missingAmount: bigint;

  constructor(missingAmount: bigint) {
    super(
      `failed to dryRun xcm program, the amount transferred is much less than fee. Expected at least ${missingAmount}`,
    );
    this.missingAmount = missingAmount;
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
