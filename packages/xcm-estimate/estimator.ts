import {ApiPromise, WsProvider} from '@polkadot/api';
import {
  Asset,
  AssetId,
  ChainIdentity,
  ChainInfo,
  CURRENT_XCM_VERSION,
  InteriorLocation,
  MIN_XCM_VERSION,
  VersionedAssetId,
  VersionedAssets,
  XcmVersion,
  Origin,
  Location,
} from '@open-xcm-tools/xcm-types';
import {SubmittableExtrinsic} from '@polkadot/api/types';
import {Result, Vec} from '@polkadot/types-codec';
import {Codec} from '@polkadot/types-codec/types';
import {stringify} from '@polkadot/util';
import {
  FeeEstimationError,
  FeeEstimationErrors,
  TooExpensiveFeeError,
} from './errors';
import {
  assetIdIntoCurrentVersion,
  assetsIntoCurrentVersion,
  compareLocation,
  convertAssetIdVersion,
  convertLocationVersion,
  findAssetIdIndex,
  findPalletXcm,
  locationIntoCurrentVersion,
  locationRelativeToPrefix,
  reanchorAssetId,
  relativeLocationToUniversal,
  sortAndDeduplicateAssets,
} from '@open-xcm-tools/xcm-util';

export type EstimatorResolver = (
  universalLocation: InteriorLocation,
) => Promise<Estimator>;

export type SentXcmProgramsLogger = (
  originChainIdentity: ChainIdentity,
  sentXcmPrograms: SentXcmPrograms[],
) => void;

export type ChainXcmFeesLogger = (
  chainIdentity: ChainIdentity,
  requiredFees: bigint,
) => void;

export type XcmFeeEstimationOptions = {
  estimatorResolver: EstimatorResolver;
  sentXcmProgramsLogger?: SentXcmProgramsLogger;
  chainXcmFeesLogger?: ChainXcmFeesLogger;
};

export type XcmProgram = unknown;

export type SentXcmPrograms = {
  destination: Location;
  programs: XcmProgram[];
};

export type XcmExecutionEffect = {
  totalFeesNeeded: bigint;
  sentXcmPrograms: SentXcmPrograms[];
};

export class Estimator {
  chainIdentity: ChainIdentity;
  api: ApiPromise;
  xcmVersion: XcmVersion;

  constructor(
    api: ApiPromise,
    chainIdentity: ChainIdentity,
    xcmVersion: XcmVersion,
  ) {
    this.chainIdentity = chainIdentity;
    this.api = api;
    this.xcmVersion = xcmVersion;

    if (this.api.call.dryRunApi === undefined) {
      throw new Error(
        `${this.chainIdentity.name} doesn't implement dry-run Runtime API`,
      );
    }

    if (this.api.call.xcmPaymentApi === undefined) {
      throw new Error(
        `${this.chainIdentity.name} doesn't implement XCM payment Runtime API`,
      );
    }
  }

  static async connect(chainInfo: ChainInfo) {
    const api = await ApiPromise.create({
      provider: new WsProvider(chainInfo.endpoints),
    });
    const xcmVersion = await Estimator.estimateMaxXcmVersion(
      api,
      chainInfo.identity.name,
    );

    return new Estimator(api, chainInfo.identity, xcmVersion);
  }

  async disconnect() {
    await this.api.disconnect();
  }

  static async dryRunExtrinsic(
    api: ApiPromise,
    origin: Origin,
    xt: SubmittableExtrinsic<'promise'>,
  ) {
    const result: Result<any, Codec> = await api.call.dryRunApi.dryRunCall(
      origin,
      xt,
    );

    if (result.isErr) {
      const xtStr = extrinsicStrId(xt);
      throw new Error(
        `failed to dry-run the XCM transfer extrinsic '${xtStr}': ${stringify(result.asErr.toHuman())}`,
      );
    }

    const dryRunEffects = result.asOk;
    if (dryRunEffects.executionResult.isErr) {
      const xtStr = extrinsicStrId(xt);

      const dispatchError = dryRunEffects.executionResult.asErr.error;
      const errorStr = stringifyDispatchError(api, dispatchError);
      throw new Error(
        `the XCM transfer extrinsic '${xtStr}' would fail with error: ${errorStr}`,
      );
    }

    return dryRunEffects;
  }

  static async estimateMaxXcmVersion(
    api: ApiPromise,
    providedChainName?: string,
    palletXcmName?: string,
  ) {
    const chainName: string =
      providedChainName ??
      (await api.rpc.system.chain().then(c => c.toPrimitive()));

    palletXcmName = palletXcmName ?? findPalletXcm(api);

    if (!palletXcmName) {
      throw new Error(`${chainName}: no pallet-xcm found in the runtime`);
    }

    for (
      let version = CURRENT_XCM_VERSION;
      version >= MIN_XCM_VERSION;
      --version
    ) {
      const supportedVersionEntries =
        await api.query[palletXcmName].supportedVersion.entries(version);

      if (supportedVersionEntries.length > 0) {
        return version;
      }
    }

    console.warn(
      `${chainName}: ${palletXcmName} doesn't know about supported XCM versions yet. Fallbacking to safeXcmVersion`,
    );

    const safeVersion = await api.query[palletXcmName]
      .safeXcmVersion()
      .then(version => version.toPrimitive() as number);

    if (MIN_XCM_VERSION <= safeVersion && safeVersion <= CURRENT_XCM_VERSION) {
      return safeVersion as XcmVersion;
    } else {
      throw new Error(`${chainName}: no supported XCM versions found`);
    }
  }

  async estimateFeeAssetIds(): Promise<AssetId[]> {
    const result: Result<
      Vec<Codec>,
      Codec
    > = await this.api.call.xcmPaymentApi.queryAcceptablePaymentAssets(
      this.xcmVersion,
    );
    if (result.isErr) {
      throw new Error(
        `${this.chainIdentity.name}: failed to get the XCM fee asset IDs - ${stringify(result.asErr.toHuman())}`,
      );
    }

    const assetIds = result.asOk;

    return assetIds.toArray().map(assetId => {
      const versionedAssetId = normalizedJsonUnitVariants(
        assetId.toJSON(),
      ) as VersionedAssetId;
      return assetIdIntoCurrentVersion(versionedAssetId);
    });
  }

  async estimateExtrinsicFees(
    origin: Origin,
    xt: SubmittableExtrinsic<'promise'>,
    feeAssetId: AssetId,
    options: XcmFeeEstimationOptions,
  ): Promise<bigint> {
    const dryRunEffects = await Estimator.dryRunExtrinsic(this.api, origin, xt);
    const sent = extractSentPrograms(dryRunEffects);

    const sentLogger = options.sentXcmProgramsLogger ?? logSentPrograms;
    sentLogger(this.chainIdentity, sent);
    return this.estimateSentXcmProgramsFees(sent, feeAssetId, options);
  }

  async estimateXcmProgramsExecutionFees(
    feeAssetId: AssetId,
    programs: XcmProgram[],
  ) {
    if (programs.length === 0) {
      throw new Error(
        `${this.chainIdentity.name}: can't compute the execution fees, no programs given`,
      );
    }

    const acceptableFeeAssets = await this.estimateFeeAssetIds();
    if (findAssetIdIndex(feeAssetId, acceptableFeeAssets) === undefined) {
      throw new Error(
        `${this.chainIdentity.name} doesn't accept the selected fee asset as payment`,
      );
    }

    let executionFees = 0n;

    for (const [i, program] of programs.entries()) {
      console.info(
        `${this.chainIdentity.name}: estimating execution fees (${i + 1}/${programs.length})`,
      );

      const queryWeightResult: Result<Codec, Codec> =
        await this.api.call.xcmPaymentApi.queryXcmWeight(program);
      if (queryWeightResult.isErr) {
        // TODO describe the program
        throw new Error(
          `${this.chainIdentity.name}: failed to get the XCM program's weight - ${stringify(queryWeightResult.asErr.toHuman())}`,
        );
      }

      const weight = queryWeightResult.asOk;
      const versionedAsset = convertAssetIdVersion(this.xcmVersion, feeAssetId);

      const queryFeeResult: Result<Codec, Codec> =
        await this.api.call.xcmPaymentApi.queryWeightToAssetFee(
          weight,
          versionedAsset,
        );
      if (queryFeeResult.isErr) {
        // TODO describe the program
        throw new Error(
          `${this.chainIdentity.name}: failed to convert the XCM program's weight to the asset fee`,
        );
      }

      executionFees += BigInt(queryFeeResult.asOk.toPrimitive() as string);
    }

    return executionFees;
  }

  async estimateSentXcmProgramsFees(
    sent: SentXcmPrograms[],
    feeAssetId: AssetId,
    options: XcmFeeEstimationOptions,
  ) {
    const errors: FeeEstimationError[] = [];

    const fees = await Estimator.#estimateProgramsFees(
      this.chainIdentity,
      sent,
      feeAssetId,
      options,
      errors,
    );

    if (errors.length > 0) {
      throw new FeeEstimationErrors(errors);
    }

    return fees;
  }

  async estimateXcmExecutionEffect(
    xcmOrigin: Location,
    feeAssetId: AssetId,
    programs: XcmProgram[],
  ): Promise<XcmExecutionEffect> {
    const executionFee = await this.estimateXcmProgramsExecutionFees(
      feeAssetId,
      programs,
    );

    const xcmVersionedOrigin = convertLocationVersion(
      this.xcmVersion,
      xcmOrigin,
    );

    let sentXcmPrograms: SentXcmPrograms[] = [];
    for (const [i, program] of programs.entries()) {
      console.info(
        `${this.chainIdentity.name}: dry-running XCM program (${i + 1}/${programs.length})`,
      );

      const result: Result<any, Codec> =
        await this.api.call.dryRunApi.dryRunXcm(xcmVersionedOrigin, program);
      if (result.isErr) {
        throw new Error(
          `failed to dry-run an XCM program on ${this.chainIdentity.name}: ${stringify(result.asErr.toHuman())}`,
        );
      }

      const dryRunEffect = result.asOk;
      if (dryRunEffect.executionResult.isIncomplete) {
        if (
          JSON.stringify(dryRunEffect.executionResult.asIncomplete).includes(
            'tooExpensive',
          )
        ) {
          throw new TooExpensiveFeeError(executionFee);
        }
        throw new Error(
          `an XCM program isn't completed successfully on ${this.chainIdentity.name}: ${dryRunEffect.executionResult.asIncomplete}`,
        );
      } else if (dryRunEffect.executionResult.isError) {
        throw new Error(
          `an XCM program failed on ${this.chainIdentity.name}: ${dryRunEffect.executionResult.asError}`,
        );
      }

      sentXcmPrograms.push(...extractSentPrograms(dryRunEffect));
    }

    sentXcmPrograms = mergeSameDestPrograms(sentXcmPrograms);

    const deliveryFeeAssets =
      await this.estimateXcmDeliveryFees(sentXcmPrograms);

    if (deliveryFeeAssets.length > 1) {
      throw new Error(
        `${this.chainIdentity.name}: combined delivery fees include different assets - an unsupported chain's behavior`,
      );
    }

    let deliveryFees = 0n;
    if (deliveryFeeAssets.length === 1) {
      const deliveryFeeAsset = deliveryFeeAssets[0];
      if ('nonFungible' in deliveryFeeAsset.fun) {
        throw new Error(
          `${this.chainIdentity.name}: a non-fungible asset represents the delivery fees - an unsupported chain's behavior`,
        );
      }

      deliveryFees = BigInt(deliveryFeeAsset.fun.fungible);

      if (
        deliveryFees !== 0n &&
        compareLocation(feeAssetId, deliveryFeeAsset.id)
      ) {
        throw new Error(
          `${this.chainIdentity.name}: the selected fee asset isn't accepted by this chain to pay delivery fees`,
        );
      }
    }

    return {
      totalFeesNeeded: executionFee + deliveryFees,
      sentXcmPrograms,
    };
  }

  async estimateXcmDeliveryFees(
    sentPrograms: SentXcmPrograms[],
  ): Promise<Asset[]> {
    const combinedDeliveryFees: Asset[] = [];
    for (const sent of sentPrograms) {
      const destDeliveryFee = await this.#estimateXcmDeliveryFeesToDest(
        sent.destination,
        sent.programs,
      );
      combinedDeliveryFees.push(...destDeliveryFee);
    }

    sortAndDeduplicateAssets(combinedDeliveryFees);
    return combinedDeliveryFees;
  }

  async #estimateXcmDeliveryFeesToDest(
    destination: Location,
    programs: XcmProgram[],
  ): Promise<Asset[]> {
    if (programs.length === 0) {
      throw new Error(
        `${this.chainIdentity.name}: can't compute the delivery fees, no programs sent to the given destination ${stringify(destination)}`,
      );
    }

    const deliveryFeeAssets: Asset[] = [];
    for (const program of programs) {
      const versionedDestination = convertLocationVersion(
        this.xcmVersion,
        destination,
      );

      const result: Result<Codec, Codec> =
        await this.api.call.xcmPaymentApi.queryDeliveryFees(
          versionedDestination,
          program,
        );
      if (result.isErr) {
        throw new Error(
          `${this.chainIdentity.name}: failed to get the delivery fees`,
        );
      }

      const versionedAssets = normalizedJsonUnitVariants(
        result.asOk.toJSON(),
      ) as VersionedAssets;
      const programDeliveryFee = assetsIntoCurrentVersion(versionedAssets);

      deliveryFeeAssets.push(...programDeliveryFee);
    }

    sortAndDeduplicateAssets(deliveryFeeAssets);
    return deliveryFeeAssets;
  }

  static async #estimateProgramsFees(
    originChainIdentity: ChainIdentity,
    sent: SentXcmPrograms[],
    feeAssetId: AssetId,
    options: XcmFeeEstimationOptions,
    errors: FeeEstimationError[],
  ) {
    let totalFeesNeeded = 0n;

    const resolver = options.estimatorResolver;
    const sentLogger = options.sentXcmProgramsLogger ?? logSentPrograms;
    const feesLogger = options.chainXcmFeesLogger ?? logRequiredFees;

    if (sent.length > 0) {
      const settled = await Promise.allSettled(
        sent.map(async sent => {
          let destEstimator: Estimator | null = null;
          try {
            const originUniversalLocation =
              originChainIdentity.universalLocation;

            const destUniversalLocation = relativeLocationToUniversal({
              relativeLocation: sent.destination,
              context: originUniversalLocation,
            });

            destEstimator = await resolver(destUniversalLocation);

            const xcmOrigin = locationRelativeToPrefix({
              location: originUniversalLocation,
              prefix: destEstimator.chainIdentity.universalLocation,
            });
            const destFeeAssetId: AssetId = reanchorAssetId({
              assetId: feeAssetId,
              oldContext: originUniversalLocation,
              newContext: destEstimator.chainIdentity.universalLocation,
            });

            const executionEffect =
              await destEstimator.estimateXcmExecutionEffect(
                xcmOrigin,
                destFeeAssetId,
                sent.programs,
              );

            feesLogger(
              destEstimator.chainIdentity,
              executionEffect.totalFeesNeeded,
            );
            sentLogger(
              destEstimator.chainIdentity,
              executionEffect.sentXcmPrograms,
            );

            totalFeesNeeded += executionEffect.totalFeesNeeded;
            totalFeesNeeded += await Estimator.#estimateProgramsFees(
              destEstimator.chainIdentity,
              executionEffect.sentXcmPrograms,
              destFeeAssetId,
              options,
              errors,
            );
          } catch (err) {
            throw new FeeEstimationError(
              originChainIdentity,
              destEstimator?.chainIdentity,
              err,
            );
          } finally {
            if (destEstimator) {
              await destEstimator.disconnect();
            }
          }
        }),
      );

      const rejectedReasons = settled
        .filter(promise => promise.status === 'rejected')
        .map(promise => {
          const rejected = promise as PromiseRejectedResult;
          return rejected.reason;
        });
      errors.push(...rejectedReasons);
    }

    return totalFeesNeeded;
  }
}

function extrinsicStrId(xt: SubmittableExtrinsic<'promise'>) {
  const section = xt.method.section;
  const method = xt.method.method;
  return `${section}.${method}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stringifyDispatchError(api: ApiPromise, error: any) {
  if (error.isModule) {
    const moduleError = error.asModule;
    const metaError = api.registry.findMetaError(moduleError);
    return `${metaError.section}.${metaError.method}`;
  } else {
    return stringify(error);
  }
}

function logRequiredFees(chainIdentity: ChainIdentity, requiredFees: bigint) {
  console.info(
    `${chainIdentity.name} requires a fee amount of ${requiredFees}`,
  );
}

function logSentPrograms(
  originChainIdentity: ChainIdentity,
  sentPrograms: SentXcmPrograms[],
) {
  if (sentPrograms.length === 0) {
    console.info(`${originChainIdentity.name} sent no programs`);
  }

  for (const sent of sentPrograms) {
    console.info(
      `${originChainIdentity.name} sent ${sent.programs.length} XCM programs to ${stringify(sent.destination)}`,
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSentPrograms(dryRunEffects: any): SentXcmPrograms[] {
  const forwardedXcms: [any, any][] = dryRunEffects.forwardedXcms;

  const sentPrograms = forwardedXcms
    .filter(([, programs]) => programs.length > 0)
    .map(([versionedDestination, programs]) => {
      const destination = locationIntoCurrentVersion(
        normalizedJsonUnitVariants(versionedDestination.toJSON()),
      );

      return {
        destination,
        programs: programs.toArray(),
      };
    });

  return mergeSameDestPrograms(sentPrograms);
}

function mergeSameDestPrograms(
  sentPrograms: SentXcmPrograms[],
): SentXcmPrograms[] {
  const result: SentXcmPrograms[] = [];

  for (const sent of sentPrograms) {
    const knownSent = result.find(
      known => !compareLocation(sent.destination, known.destination),
    );

    if (knownSent === undefined) {
      result.push(sent);
    } else {
      knownSent.programs.push(...sent.programs);
    }
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizedJsonUnitVariants(obj: any): any {
  const unitEnumVariant = asEnumUnitVariant(obj);
  if (unitEnumVariant !== undefined) {
    return unitEnumVariant;
  }

  if (typeof obj === 'object' && obj !== null) {
    const normalize = (value: any) => normalizedJsonUnitVariants(value);
    return Array.isArray(obj)
      ? obj.map(normalize)
      : Object.fromEntries(
          Object.entries(obj).map(([key, value]) => [key, normalize(value)]),
        );
  }

  return typeof obj === 'number' ? BigInt(obj) : obj;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asEnumUnitVariant(obj: any): string | undefined {
  if (typeof obj === 'string') {
    return obj;
  }

  if (obj && typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 1 && obj[keys[0]] === null) {
      return keys[0];
    }
  }

  return undefined;
}
