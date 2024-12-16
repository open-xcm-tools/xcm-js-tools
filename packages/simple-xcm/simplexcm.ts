import type {ApiPromise} from '@polkadot/api';
import {SubmittableExtrinsic} from '@polkadot/api/types';
import {Bytes, Result} from '@polkadot/types-codec';
import {Codec} from '@polkadot/types-codec/types';
import {Registry} from './registry';
import {stringify} from '@polkadot/util';
import {
  AssetIdLookup,
  AssetLookup,
  ChainInfo,
  InteriorLocation,
  LocationLookup,
  PalletXcmName,
  XcmVersion,
  Location,
  InteriorLocationLookup,
  Origin,
  AssetId,
  Asset,
  VersionedLocation,
  RegistryLookup,
  FungibleAnyAsset,
  VersionedAssets,
  CURRENT_XCM_VERSION,
} from '@open-xcm-tools/xcm-types';
import {
  convertAssetIdVersion,
  convertLocationVersion,
  findPalletXcm,
  location,
  locationRelativeToPrefix,
  palletApiTxName,
  prepareAssetsForEncoding,
  relativeLocationToUniversal,
  sanitizeInterior,
  sanitizeLookup,
  toInterior,
  toJunctions,
} from '@open-xcm-tools/xcm-util';
import {Estimator, findFeeAssetById} from '@open-xcm-tools/xcm-estimate';
import {sanitizeTransferParams} from './main-utils';
import {
  FeeEstimationErrors,
  TooExpensiveFeeError,
} from '@open-xcm-tools/xcm-estimate/errors';

/**
 * Interface representing the backend for transferring assets.
 */
interface TransferBackend {
  /**
   * Prepares the transfer parameters for the transfer with some pallet-specific logic.
   * @param transferParams
   * @returns A promise that resolves to the prepared transfer parameters.
   */
  prepareTransferParams(
    transferParams: TransferParams,
  ): Promise<PreparedTransferParams>;

  /**
   * Builds a submittable extrinsic for the transfer with some pallet-specific logic.
   * @param preparedParams
   * @returns A submittable extrinsic for the transfer.
   */
  buildSubmittableExtrinsic(
    preparedParams: PreparedTransferParams,
  ): SubmittableExtrinsic<'promise'>;
}

/**
 * Parameters for transferring tokens between chains.
 */
export type TransferParams = {
  origin: Origin | RegistryLookup; // The origin of the transfer.
  assets: AssetLookup[]; // The assets to be transferred.
  feeAssetId: AssetIdLookup; // The asset used to pay the transfer fee.
  destination: LocationLookup; // The destination location for the transfer.
  beneficiary: LocationLookup; // The beneficiary of the transferred assets.
};

type PreparedTransferParams = {
  origin: Origin;
  assets: VersionedAssets; // A collection of assets to be transferred, including their versions.
  feeAssetId: AssetId; // The identifier of the asset that will be used to pay the transfer fee.
  feeAssetIndex: number; // The index of the asset in the assets array that will be used for the fee.
  feeAnyAssetRef: FungibleAnyAsset; // Reference to the fungible asset from PreparedTransferParams.assets, which will be taken as fee asset.
  destination: Location;
  beneficiary: Location;
};

type ComposedXcmTransfer = {
  preparedParams: PreparedTransferParams;
  submittableExtrinsic: SubmittableExtrinsic<'promise'>;
  estimatedFees: bigint;
};

/**
 * Class representing a simple XCM interface for cross-chain transfers.
 */
export class SimpleXcm {
  api: ApiPromise;
  registry: Registry;
  chainInfo: ChainInfo;
  palletXcm: PalletXcmName;
  estimator: Estimator;
  xcmVersion: XcmVersion;

  /**
   * Composes a transfer extrinsic based on the provided parameters.
   * @param transferParams - The parameters for the transfer.
   * @returns A promise that resolves to a SubmittableExtrinsic for the transfer.
   */
  async composeTransfer(
    transferParams: TransferParams,
  ): Promise<ComposedXcmTransfer> {
    const preparedParams =
      await this.#transferBackend().prepareTransferParams(transferParams);

    const txForDryRun =
      this.#transferBackend().buildSubmittableExtrinsic(preparedParams);

    let estimatedFees: bigint;

    const estimatedFeesResult = await this.estimateExtrinsicXcmFees(
      preparedParams.origin,
      txForDryRun,
      preparedParams.feeAssetId,
    );

    if ('error' in estimatedFeesResult) {
      const missingAmount = estimatedFeesResult.error.missingAmount;

      preparedParams.feeAnyAssetRef.fun.fungible += missingAmount;
      estimatedFees = missingAmount;
    } else {
      estimatedFees = estimatedFeesResult.value;
    }

    const submittableExtrinsic =
      this.#transferBackend().buildSubmittableExtrinsic(preparedParams);

    return {submittableExtrinsic, preparedParams, estimatedFees};
  }

  /**
   * Enforces the specified XCM version to be used when interacting with the connected chain.
   * @param version - The XCM version to enforce.
   * @throws Throws an error if the requested version exceeds the maximum supported version for the connected chain.
   */
  enforceXcmVersion(version: XcmVersion) {
    if (version > this.estimator.xcmVersion) {
      throw new Error(
        `${this.chainInfo.identity.name}: The requested XCM version ${version} is greater than the maximum supported one for this chain (= ${this.estimator.xcmVersion})`,
      );
    }

    this.xcmVersion = version;
  }

  /**
   * Converts the `amount` to the absolute number of tokens of the given currency.
   * For example, if the given currency has `decimals = 6` and we passed `amount = 1.3`,
   * then this function will convert the `amount` to `1300000n`.
   *
   * The currency's `decimals` value is looked up from the registry.
   * @param assetId - The asset ID of the currency.
   * @param amount - The amount of the asset as a string.
   * @returns The adjusted asset lookup object.
   */
  adjustedFungible(assetId: AssetIdLookup, amount: string): AssetLookup {
    sanitizeLookup(assetId);
    let decimals: number;

    if (typeof assetId === 'string') {
      decimals = this.registry.currencyInfoBySymbol(assetId).decimals;
    } else {
      const currencyUniversalLocation = relativeLocationToUniversal({
        relativeLocation: assetId,
        context: this.chainInfo.identity.universalLocation,
      });

      decimals = this.registry.currencyInfoByUniversalLocation(
        currencyUniversalLocation,
      ).decimals;
    }

    const value = this.#convertFungibleAmount(amount, decimals);

    return {
      id: assetId,
      fun: {fungible: value},
    };
  }

  /**
   * Disconnects ApiPromise instance.
   *
   * Note: More likely you don't want to call this method if you are using custom ApiPromiseFactory.
   */
  async disconnect() {
    await this.api.disconnect();
  }

  /**
   * Private constructor for initializing the SimpleXcm instance.
   * @param apiPromise - The API promise instance.
   * @param registry - The registry instance.
   * @param chainInfo - Information about the connected chain.
   * @param palletXcm - The name of the XCM pallet.
   * @param estimator - The estimator connected to the given chain.
   */
  private constructor(
    apiPromise: ApiPromise,
    registry: Registry,
    chainInfo: ChainInfo,
    palletXcm: PalletXcmName,
    estimator: Estimator,
  ) {
    this.api = apiPromise;
    this.registry = registry;
    this.chainInfo = chainInfo;
    this.palletXcm = palletXcm;
    this.estimator = estimator;
    this.xcmVersion = estimator.xcmVersion;
  }

  /**
   * Creates and connects a new SimpleXcm instance.
   * @param chainName - The in-registry name of the chain to connect to.
   * @param registry - The registry instance.
   * @returns A promise that resolves to a SimpleXcm instance.
   * @throws Will throw an error if no pallet-xcm is found in the runtime.
   */
  static async connect(chainName: string, registry: Registry) {
    const chainInfo = registry.chainInfoByName(chainName);
    const api = await registry.apiPromiseFactory(chainInfo.endpoints);

    const palletXcm = findPalletXcm(api);
    if (!palletXcm) {
      throw new Error(`${chainName}: no pallet-xcm found in the runtime`);
    }

    const maxXcmVersion = await Estimator.estimateMaxXcmVersion(
      api,
      chainInfo.identity.name,
      palletXcm,
    );
    const xcmVersionToUse = Math.min(
      CURRENT_XCM_VERSION,
      maxXcmVersion,
    ) as XcmVersion;
    const estimator = new Estimator(api, chainInfo.identity, xcmVersionToUse);

    return new SimpleXcm(api, registry, chainInfo, palletXcm, estimator);
  }

  /**
   * Resolves a relative location (it's relative to the connected chain's universal location) to a corresponding universal location.
   * @param lookup - The relative location or location lookup.
   * @returns The resolved universal location.
   * @throws Will throw an error if the location is unknown.
   */
  resolveRelativeLocation(lookup: InteriorLocation | LocationLookup): Location {
    if (typeof lookup === 'string') {
      const universalLocation = this.registry.universalLocation(lookup);
      if (universalLocation) {
        return locationRelativeToPrefix({
          location: universalLocation,
          prefix: this.chainInfo.identity.universalLocation,
        });
      }

      const relativeLocation = this.registry.relativeLocation(lookup);
      if (relativeLocation) {
        return relativeLocation;
      }

      throw new Error(`${lookup}: unknown named location`);
    } else if ('parents' in lookup) {
      sanitizeLookup(lookup);
      return lookup;
    } else {
      sanitizeInterior(lookup);
      return locationRelativeToPrefix({
        location: lookup,
        prefix: this.chainInfo.identity.universalLocation,
      });
    }
  }

  /**
   * Resolves an interior location lookup to a universal location.
   * @param lookup - The location lookup.
   * @returns The resolved universal location.
   * @throws Will throw an error if the location is unknown.
   */
  resolveUniversalLocation(lookup: InteriorLocationLookup): InteriorLocation {
    if (typeof lookup === 'string') {
      const universalLocation = this.registry.universalLocation(lookup);
      if (universalLocation) {
        return universalLocation;
      }

      const relativeLocation = this.registry.relativeLocation(lookup);
      if (relativeLocation) {
        return relativeLocationToUniversal({
          relativeLocation,
          context: this.chainInfo.identity.universalLocation,
        });
      }

      throw new Error(`${lookup}: unknown named location`);
    } else {
      sanitizeInterior(lookup);
      return lookup;
    }
  }

  /**
   * Estimates the XCM fees for an extrinsic that encodes a transfer.
   *
   * @param origin - The origin of the transfer.
   * @param tx - The extrinsic to estimate fees for.
   * @param feeAssetId - The ID of the asset that is used to cover the transfer fee.
   * @returns A promise that resolves to an object containing the estimated fees or an error.
   */
  async estimateExtrinsicXcmFees(
    origin: Origin,
    tx: SubmittableExtrinsic<'promise'>,
    feeAssetId: AssetId,
  ): Promise<{value: bigint} | {error: TooExpensiveFeeError}> {
    try {
      const estimatedFees = await this.estimator.tryEstimateExtrinsicFees(
        origin,
        tx,
        feeAssetId,
        {
          estimatorResolver: (universalLocation: InteriorLocation) =>
            Estimator.connect(
              this.registry.chainInfoByUniversalLocation(universalLocation),
              this.registry.apiPromiseFactory,
            ),
        },
      );
      return {value: estimatedFees};
    } catch (errors) {
      if (errors instanceof FeeEstimationErrors) {
        const totalMissingValue = errors.errors.reduce((sum, error) => {
          if (error.cause instanceof TooExpensiveFeeError) {
            sum += error.cause.missingAmount;
          }

          return sum;
        }, BigInt(0));

        if (totalMissingValue > 0) {
          return {error: new TooExpensiveFeeError(totalMissingValue)};
        }
      }

      throw errors;
    }
  }

  /**
   * Resolves a relative asset lookup to a plain XCM asset object.
   * @param lookup - The asset lookup.
   * @returns The resolved asset.
   */
  resolveRelativeAsset(lookup: AssetLookup): Asset {
    return {
      id: this.resolveRelativeLocation(lookup.id),
      fun: lookup.fun,
    };
  }

  /**
   * Converts a location lookup to an account ID.
   * @param lookup - The location lookup.
   * @returns A promise that resolves to the account ID.
   * @throws Will throw an error if the conversion fails.
   */
  async locationToAccountId(lookup: LocationLookup): Promise<string> {
    if (this.api.call.locationToAccountApi === undefined) {
      throw new Error(
        `${this.chainInfo.identity.name} doesn't implement locationToAccount Runtime API`,
      );
    }

    if (typeof lookup === 'string') {
      const accountLocation = this.resolveRelativeLocation(lookup);
      return this.locationToAccountId(accountLocation);
    }
    sanitizeLookup(lookup);

    const versionedLocation: VersionedLocation = {v4: lookup};
    const result: Result<Bytes, Codec> =
      await this.api.call.locationToAccountApi.convertLocation(
        versionedLocation,
      );

    if (result.isErr) {
      throw new Error(
        `${this.chainInfo.identity.name}: can't convert location to an account ID - ${stringify(result.asErr.toHuman())}`,
      );
    }

    return result.asOk.toHex();
  }

  /**
   * Converts a fungible amount from a string representation to a bigint.
   * @param amount - The amount as a string.
   * @param decimals - The number of decimals for the asset.
   * @returns The converted amount as a bigint.
   * @throws Will throw an error if the amount format is invalid or if the decimals value is incorrect.
   */
  #convertFungibleAmount(amount: string, decimals: number): bigint {
    // RegEx for number validation
    // Example:
    // 0.23, 123, 12.232 - OK
    // 023, 023.23, text, 2.text - Invalid
    const numberRegEx = /^(0(\.\d+)?|[1-9]\d*(\.\d+)?)$/;

    const isValidNumber = numberRegEx.test(amount);
    if (!isValidNumber) {
      throw new Error(
        'convertFungibleAmount: invalid amount format. Must be an integer or decimal number.',
      );
    }
    const [integerPart, decimalPart = ''] = amount.split('.');

    if (!Number.isSafeInteger(decimals) || decimals < 0 || decimals > 38) {
      throw new Error(
        'convertFungibleAmount: decimals value is incorrect. Expected an integer between 1 and 38',
      );
    }
    const paddedDecimalPart = decimalPart.padEnd(decimals, '0');

    if (paddedDecimalPart.length > decimals) {
      throw new Error(
        `convertFungibleAmount: the fungible amount's decimal part length (${paddedDecimalPart.length}) is greater than the currency decimals (${decimals})`,
      );
    }
    return BigInt(integerPart + paddedDecimalPart);
  }

  /**
   * Retrieves the appropriate transfer backend based on the available extrinsics.
   * @returns The transfer backend instance.
   * @throws Will throw an error if no known backend pallet is found.
   */
  #transferBackend() {
    if ('transferAssets' in this.api.tx[this.palletXcm]) {
      return new PalletXcmBackend(this);
    }

    console.warn(`
      ${this.chainInfo.identity.name}: pallet-xcm does not have the needed "transferAssets" extrinsic.
      Looking for an alternative XCM transfer backend...
    `);

    const pallets = this.api.registry.metadata.pallets;

    let palletName: string;
    let backend: TransferBackend | undefined;
    for (const pallet of pallets) {
      const palletRuntimeName = pallet.name.toPrimitive();
      palletName = palletApiTxName(palletRuntimeName);

      if (palletName === 'xTokens') {
        backend = new XTokensBackend(this);
        break;
      }
    }

    if (backend) {
      console.warn(
        `${this.chainInfo.identity.name}: using an alternative XCM transfer backend - ${palletName!}`,
      );
      return backend;
    } else {
      throw new Error(
        `${this.chainInfo.identity.name}: No known XCM transfer backend pallet is found`,
      );
    }
  }
}

/**
 * Class representing the backend for the XCM pallet.
 */
class PalletXcmBackend implements TransferBackend {
  simpleXcm: SimpleXcm;

  prepareTransferParams(
    transferParams: TransferParams,
  ): Promise<PreparedTransferParams> {
    return prepareTransferParams(this.simpleXcm, transferParams);
  }

  buildSubmittableExtrinsic(
    preparedParams: PreparedTransferParams,
  ): SubmittableExtrinsic<'promise'> {
    const palletXcm = this.simpleXcm.api.tx[this.simpleXcm.palletXcm];
    const noXcmWeightLimit = 'Unlimited';
    const xcmVersion = this.simpleXcm.xcmVersion;

    const destination = convertLocationVersion(
      xcmVersion,
      preparedParams.destination,
    );
    const beneficiary = convertLocationVersion(
      xcmVersion,
      preparedParams.beneficiary,
    );

    return palletXcm.transferAssets(
      destination,
      beneficiary,
      preparedParams.assets,
      preparedParams.feeAssetIndex,
      noXcmWeightLimit,
    );
  }

  /**
   * Constructor for the PalletXcmBackend.
   * @param simpleXcm - The SimpleXcm instance.
   */
  constructor(simpleXcm: SimpleXcm) {
    this.simpleXcm = simpleXcm;
  }
}

/**
 * Class representing the backend for the XTokens pallet.
 */
class XTokensBackend implements TransferBackend {
  simpleXcm: SimpleXcm;

  /**
   * Constructor for the XTokensBackend.
   * @param simpleXcm - The SimpleXcm instance.
   */
  constructor(simpleXcm: SimpleXcm) {
    this.simpleXcm = simpleXcm;
  }

  async prepareTransferParams(
    transferParams: TransferParams,
  ): Promise<PreparedTransferParams> {
    // xTokens used only by parachains, so it is safe to query para ID.
    const paraId = await this.simpleXcm.api.query.parachainInfo
      .parachainId()
      .then(id => id.toJSON() as number);

    const preparedParams = await prepareTransferParams(
      this.simpleXcm,
      transferParams,
      assetId => {
        if (assetId.parents === 0n) {
          return {
            parents: 1n,
            interior: toInterior([
              {parachain: BigInt(paraId)},
              ...toJunctions(assetId.interior),
            ]),
          };
        } else {
          return assetId;
        }
      },
    );

    if (preparedParams.beneficiary.parents !== 0n) {
      throw new Error(`
        The beneficiary must be an interior location (parents = 0) when using the XTokens backend.
        The actual parents = ${preparedParams.beneficiary.parents}
      `);
    }

    return preparedParams;
  }

  buildSubmittableExtrinsic(
    preparedParams: PreparedTransferParams,
  ): SubmittableExtrinsic<'promise'> {
    const beneficiaryJunctions = toJunctions(
      preparedParams.beneficiary.interior,
    );
    const destinationJunctions = toJunctions(
      preparedParams.destination.interior,
    );

    const destinationBeneficiary = location(
      preparedParams.destination.parents,
      [...destinationJunctions, ...beneficiaryJunctions],
    );

    const xcmVersion = this.simpleXcm.xcmVersion;

    const destination = convertLocationVersion(
      xcmVersion,
      destinationBeneficiary,
    );

    const xTokens = this.simpleXcm.api.tx['xTokens'];
    const noXcmWeightLimit = 'Unlimited';

    return xTokens.transferMultiassets(
      preparedParams.assets,
      preparedParams.feeAssetIndex,
      destination,
      noXcmWeightLimit,
    );
  }
}

/**
 * Prepares the transfer parameters for the transfer.
 * @param simpleXcm - The SimpleXcm instance.
 * @param transferParams - The parameters for the transfer.
 * @param transformAssetId - A callback to transform each asset Id into something else. An identity transformation by default.
 * @returns A promise that resolves to the prepared transfer parameters.
 */
export async function prepareTransferParams(
  simpleXcm: SimpleXcm,
  transferParams: TransferParams,
  transformAssetId: (assetId: AssetId) => AssetId = assetId => assetId,
): Promise<PreparedTransferParams> {
  let origin: Origin;
  if (typeof transferParams.origin === 'string') {
    origin = {
      System: {
        Signed: await simpleXcm.locationToAccountId(transferParams.origin),
      },
    };
  } else {
    origin = transferParams.origin;
  }

  sanitizeTransferParams(transferParams);

  const destination = simpleXcm.resolveRelativeLocation(
    transferParams.destination,
  );
  const beneficiary = simpleXcm.resolveRelativeLocation(
    transferParams.beneficiary,
  );
  const feeAssetId = transformAssetId(
    simpleXcm.resolveRelativeLocation(transferParams.feeAssetId),
  );

  const resolvedAssets = transferParams.assets.map(asset => {
    const resolvedAsset = simpleXcm.resolveRelativeAsset(asset);

    return {
      id: transformAssetId(resolvedAsset.id),
      fun: resolvedAsset.fun,
    };
  });

  const assets = prepareAssetsForEncoding(simpleXcm.xcmVersion, resolvedAssets);

  const convertedFeeAssetId = convertAssetIdVersion(
    simpleXcm.xcmVersion,
    feeAssetId,
  );
  const feeAssetResult = findFeeAssetById(convertedFeeAssetId, assets);

  let feeAnyAsset: FungibleAnyAsset;
  let feeAssetIndex: number;

  if (feeAssetResult === undefined) {
    // FIXME refactor fee estimation so that it can estimate fees when the fee asset
    // is neither part of the transfer nor above the minimum amount to cover the fees.
    throw Error(
      `${simpleXcm.chainInfo.identity.name}: failed to compose transfer, the fee asset isn't part of the transfer (a temporary limitation, see README)`,
    );

    // const feeAsset = {
    //   id: feeAssetId,
    //   fun: fungible(2n),
    // };
    // resolvedAssets.push(feeAsset);

    // assets = prepareAssetsForEncoding(simpleXcm.xcmVersion, resolvedAssets);
    // [feeAnyAsset, feeAssetIndex] = findFeeAssetById(feeAssetId, assets)!;
  } else {
    [feeAnyAsset, feeAssetIndex] = feeAssetResult;
  }

  return {
    origin,
    assets,
    feeAssetId,
    feeAssetIndex,
    feeAnyAssetRef: feeAnyAsset,
    destination,
    beneficiary,
  };
}
