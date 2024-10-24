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

/**
 * Class representing an Estimator for XCM operations.
 */
export class Estimator {
  chainIdentity: ChainIdentity; // The identity of the chain associated with this estimator.
  api: ApiPromise; // The API instance for interacting with the blockchain.
  xcmVersion: XcmVersion; // The version of XCM being used.

  /**
   * Creates an instance of Estimator.
   * @param api - The API instance for the blockchain.
   * @param chainIdentity - The identity of the chain.
   * @param xcmVersion - The version of XCM.
   * @throws If the dry-run or XCM payment APIs are not implemented.
   */
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

  /**
   * Connects to the specified chain and creates an Estimator instance.
   * @param chainInfo - Information about the chain to connect to.
   * @returns A promise that resolves to an Estimator instance.
   */
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

  /**
   * Disconnects from the blockchain.
   * @returns A promise that resolves when the disconnection is complete.
   */
  async disconnect() {
    await this.api.disconnect();
  }

  /**
   * Performs a dry run of an extrinsic to estimate its effects.
   * @param api - The API instance for the blockchain.
   * @param origin - The origin of the extrinsic.
   * @param xt - The extrinsic to dry run.
   * @returns A promise that resolves to the dry run effects.
   * @throws If the dry run fails or the extrinsic would fail.
   */
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

  /**
   * Estimates the maximum XCM version supported by the chain.
   * @param api - The API instance for the blockchain.
   * @param providedChainName - Optional name of the chain.
   * @param palletXcmName - Optional name of the pallet for XCM.
   * @returns A promise that resolves to the maximum XCM version.
   * @throws If no supported XCM versions are found.
   */
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

  /**
   * Estimates the asset IDs that can be used for fees.
   * @returns A promise that resolves to an array of acceptable asset IDs.
   * @throws If the estimation fails.
   */
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

  /**
   * Estimates the fees for submitting an extrinsic.
   * @param origin - The origin of the extrinsic.
   * @param xt - The extrinsic to estimate fees for.
   * @param feeAssetId - The asset ID to use for fee estimation.
   * @param options - Options for fee estimation.
   * @returns A promise that resolves to the estimated fee.
   * @throws If the estimation fails.
   */
  async tryEstimateExtrinsicFees(
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

  /**
   * Estimates the execution fees for a set of XCM programs.
   * @param feeAssetId - The asset ID to use for fee estimation.
   * @param programs - The XCM programs to estimate fees for.
   * @returns A promise that resolves to the total execution fees.
   * @throws If the estimation fails.
   */
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

  /**
   * Estimates the fees for sent XCM programs.
   * @param sent - The sent XCM programs.
   * @param feeAssetId - The asset ID to use for fee estimation.
   * @param options - Options for fee estimation.
   * @returns A promise that resolves to the total estimated fees.
   * @throws If there are errors during estimation.
   */
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

  /**
   * Estimates the execution effect of an XCM operation.
   * @param xcmOrigin - The origin location for the XCM operation.
   * @param feeAssetId - The asset ID to use for fee estimation.
   * @param programs - The XCM programs to execute.
   * @returns A promise that resolves to the execution effect.
   * @throws If the estimation fails.
   */
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

  /**
   * Estimates the delivery fees for sent XCM programs.
   * @param sentPrograms - The sent XCM programs.
   * @returns A promise that resolves to an array of assets representing the delivery fees.
   * @throws If the estimation fails.
   */
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

  /**
   * Estimates the delivery fees to a specific destination for a set of XCM programs.
   * @param destination - The destination location for the delivery fees.
   * @param programs - The XCM programs for which to estimate delivery fees.
   * @returns A promise that resolves to an array of assets representing the delivery fees.
   * @throws If the estimation fails.
   */
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

  /**
   * Estimates the total fees for a set of sent XCM programs.
   * @param originChainIdentity - The identity of the origin chain.
   * @param sent - The sent XCM programs.
   * @param feeAssetId - The asset ID to use for fee estimation.
   * @param options - Options for fee estimation.
   * @param errors - An array to collect any errors encountered during estimation.
   * @returns A promise that resolves to the total estimated fees.
   */
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

/**
 * Converts an extrinsic to a string representation for logging.
 * @param xt - The extrinsic to convert.
 * @returns A string representation of the extrinsic.
 */
function extrinsicStrId(xt: SubmittableExtrinsic<'promise'>) {
  const section = xt.method.section;
  const method = xt.method.method;
  return `${section}.${method}`;
}

/**
 * Stringifies a dispatch error for logging.
 * @param api - The API instance for the blockchain.
 * @param error - The error to stringify.
 * @returns A string representation of the error.
 */
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

/**
 * Logs the required fees for a chain.
 * @param chainIdentity - The identity of the chain.
 * @param requiredFees - The required fees to log.
 */
function logRequiredFees(chainIdentity: ChainIdentity, requiredFees: bigint) {
  console.info(
    `${chainIdentity.name} requires a fee amount of ${requiredFees}`,
  );
}

/**
 * Logs the sent XCM programs for a given origin chain.
 * @param originChainIdentity - The identity of the origin chain.
 * @param sentPrograms - The sent XCM programs to log.
 */
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
