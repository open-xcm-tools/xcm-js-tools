import {ApiPromise, WsProvider} from '@polkadot/api';
import {SubmittableExtrinsic} from '@polkadot/api/types';
import {Bytes, Result} from '@polkadot/types-codec';
import {Codec} from '@polkadot/types-codec/types';
import {
  XcmVersion,
  Location,
  Asset,
  AssetLookup,
  LocationLookup,
  AssetIdLookup,
  RegistryLookup,
  VersionedLocation,
  FungibleAsset,
  InteriorLocationLookup,
  InteriorLocation,
  AssetId,
} from './xcmtypes';
import {ChainInfo, Registry} from './registry';
import {
  convertLocationVersion,
  findFeeAssetById,
  findPalletXcm,
  fungible,
  location,
  locationRelativeToPrefix,
  relativeLocationToUniversal,
  sanitizeInterior,
  sanitizeLookup,
  sanitizeTransferParams,
  palletApiTxName,
  prepareAssetsForEncoding,
  toJunctions,
} from './util';
import {Origin} from './origin';
import {stringify} from '@polkadot/util';
import {Estimator} from './estimator';

export type PalletXcmName = 'polkadotXcm' | 'xcmPallet';

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
  assets: Asset[];
  feeAssetIndex: number;
  feeAsset: FungibleAsset;
  destination: Location;
  beneficiary: Location;
};

export type XcmExecutionEffect = {
  totalFeesNeeded: bigint;
  sentPrograms: SentPrograms[];
};

export type XcmProgram = unknown;

export type SentPrograms = {
  destination: Location;
  programs: XcmProgram[];
};

interface TransferBackend {
  composeTransfer(
    transferParams: TransferParams,
  ): Promise<SubmittableExtrinsic<'promise'>>;
}

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
  composeTransfer(
    transferParams: TransferParams,
  ): Promise<SubmittableExtrinsic<'promise'>> {
    return this.#transferBackend().composeTransfer(transferParams);
  }

  /**
   * Enforces the specified XCM version for the transfer.
   * @param version - The XCM version to enforce.
   * @throws Will throw an error if the requested version exceeds the maximum supported version.
   */
  enforceXcmVersion(version: XcmVersion) {
    if (version > this.estimator.xcmVersion) {
      throw new Error(
        `The requested XCM version ${version} is greater than the chain supports (= ${this.estimator.xcmVersion})`,
      );
    }

    this.xcmVersion = version;
  }

  /**
   * Converts a fungible amount from a string representation to a bigint.
   * @param amount - The amount as a string.
   * @param decimals - The number of decimals for the asset.
   * @returns The converted amount as a bigint.
   * @throws Will throw an error if the amount format is invalid or if the decimals value is incorrect.
   */
  private convertFungibleAmount(amount: string, decimals: number): bigint {
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
   * Adjusts the fungible asset amount based on the asset ID and amount.
   * @param assetId - The ID of the asset.
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
        context: this.chainInfo.universalLocation,
      });

      decimals = this.registry.currencyInfoByLocation(
        currencyUniversalLocation,
      ).decimals;
    }

    const value = this.convertFungibleAmount(amount, decimals);

    return {
      id: assetId,
      fun: {fungible: value},
    };
  }

  /**
   * Disconnects from the API.
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
   * @param maxXcmVersion - The maximum supported XCM version.
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
   * Creates a new SimpleXcm instance.
   * @param chainId - The ID of the chain to connect to.
   * @param registry - The registry instance.
   * @returns A promise that resolves to a SimpleXcm instance.
   * @throws Will throw an error if no pallet-xcm is found in the runtime.
   */
  static async create(chainId: string, registry: Registry) {
    const chainInfo = registry.chainInfoById(chainId);

    const provider = new WsProvider(chainInfo.endpoints);
    const api = await ApiPromise.create({provider});

    const palletXcm = findPalletXcm(api);
    if (!palletXcm) {
      throw new Error(`${chainId}: no pallet-xcm found in the runtime`);
    }

    const xcmVersion = await Estimator.estimateMaxXcmVersion(
      api,
      chainInfo,
      palletXcm,
    );
    const estimator = new Estimator(api, chainInfo, xcmVersion);

    return new SimpleXcm(api, registry, chainInfo, palletXcm, estimator);
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
      ${this.chainInfo.chainId}: pallet-xcm does not have the needed "transferAssets" extrinsic.
      Looking for an alternative XCM transfer backend...
    `);

    const pallets = this.api.registry.metadata.pallets;

    let palletName: string;
    let backend: TransferBackend | undefined;
    for (const pallet of pallets) {
      const palletRuntimeName = pallet.name.toPrimitive();
      palletName = palletApiTxName(palletRuntimeName);

      switch (palletName) {
        // TODO test XTokensBackend
        // case 'xTokens':
        //   backend = new XTokensBackend(this);
        //   break loop;

        default:
      }
    }

    if (backend) {
      console.warn(
        `${this.chainInfo.chainId}: using an alternative XCM transfer backend - ${palletName!}`,
      );
      return backend;
    } else {
      throw new Error(
        `${this.chainInfo.chainId}: No known XCM transfer backend pallet is found`,
      );
    }
  }

  /**
   * Resolves a relative location to an absolute location.
   * @param lookup - The relative location or location lookup.
   * @returns The resolved absolute location.
   * @throws Will throw an error if the location is unknown.
   */
  resolveRelativeLocation(lookup: InteriorLocation | LocationLookup): Location {
    if (typeof lookup === 'string') {
      const universalLocation = this.registry.universalLocation(lookup);
      if (universalLocation) {
        return locationRelativeToPrefix({
          location: universalLocation,
          prefix: this.chainInfo.universalLocation,
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
        prefix: this.chainInfo.universalLocation,
      });
    }
  }

  /**
   * Resolves a location lookup to an absolute universal location.
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
          context: this.chainInfo.universalLocation,
        });
      }

      throw new Error(`${lookup}: unknown named location`);
    } else {
      sanitizeInterior(lookup);
      return lookup;
    }
  }

  async estimateExtrinsicXcmFees(
    origin: Origin,
    xt: SubmittableExtrinsic<'promise'>,
    feeAssetId: AssetId,
  ) {
    const estimatedFees = await this.estimator.estimateExtrinsicFees(
      origin,
      xt,
      feeAssetId,
      {
        estimatorResolver: (universalLocation: InteriorLocation) => {
          const chainInfo =
            this.registry.chainInfoByLocation(universalLocation);
          return Estimator.connect(chainInfo);
        },
      },
    );

    return estimatedFees;
  }

  /**
   * Resolves a relative asset lookup to an absolute asset.
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
    // TODO throw a better error the needed Runtime API isn't available

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
        `${this.chainInfo.chainId}: can't convert location to an account ID - ${stringify(result.asErr.toHuman())}`,
      );
    }

    return result.asOk.toHex();
  }
}

/**
 * Class representing the backend for the XCM pallet.
 */
export class PalletXcmBackend implements TransferBackend {
  simpleXcm: SimpleXcm;

  /**
   * Constructor for the PalletXcmBackend.
   * @param simpleXcm - The SimpleXcm instance.
   */
  constructor(simpleXcm: SimpleXcm) {
    this.simpleXcm = simpleXcm;
  }

  /**
   * Composes a transfer extrinsic based on the provided parameters.
   * @param transferParams - The parameters for the transfer.
   * @returns A promise that resolves to a SubmittableExtrinsic for the transfer.
   */
  async composeTransfer(
    transferParams: TransferParams,
  ): Promise<SubmittableExtrinsic<'promise'>> {
    const preparedParams = await prepareTransferParams(
      this.simpleXcm,
      transferParams,
    );

    const xcmVersion = this.simpleXcm.xcmVersion;

    let assets = prepareAssetsForEncoding(xcmVersion, preparedParams.assets);
    const destination = convertLocationVersion(
      xcmVersion,
      preparedParams.destination,
    );
    const beneficiary = convertLocationVersion(
      xcmVersion,
      preparedParams.beneficiary,
    );

    const palletXcm = this.simpleXcm.api.tx[this.simpleXcm.palletXcm];
    const noXcmWeightLimit = 'Unlimited';

    const txToDryRun = palletXcm.transferAssets(
      destination,
      beneficiary,
      assets,
      preparedParams.feeAssetIndex,
      noXcmWeightLimit,
    );

    const estimatedFees = await this.simpleXcm.estimateExtrinsicXcmFees(
      preparedParams.origin,
      txToDryRun,
      preparedParams.feeAsset.id,
    );

    preparedParams.feeAsset.fun.fungible += estimatedFees;
    assets = prepareAssetsForEncoding(xcmVersion, preparedParams.assets);

    const tx = palletXcm.transferAssets(
      destination,
      beneficiary,
      assets,
      preparedParams.feeAssetIndex,
      noXcmWeightLimit,
    );
    return tx;
  }
}

/**
 * Class representing the backend for the XTokens pallet.
 */
export class XTokensBackend implements TransferBackend {
  simpleXcm: SimpleXcm;

  /**
   * Constructor for the XTokensBackend.
   * @param simpleXcm - The SimpleXcm instance.
   */
  constructor(simpleXcm: SimpleXcm) {
    this.simpleXcm = simpleXcm;
  }

  /**
   * Composes a transfer extrinsic based on the provided parameters.
   * @param transferParams - The parameters for the transfer.
   * @returns A promise that resolves to a SubmittableExtrinsic for the transfer.
   * @throws Will throw an error if the beneficiary is not an interior location.
   */
  async composeTransfer(
    transferParams: TransferParams,
  ): Promise<SubmittableExtrinsic<'promise'>> {
    const preparedParams = await prepareTransferParams(
      this.simpleXcm,
      transferParams,
    );

    if (preparedParams.beneficiary.parents !== 0n) {
      throw new Error(`
        The beneficiary must be an interior location (parents = 0) when using the XTokens backend.
        The actual parents = ${preparedParams.beneficiary.parents}
      `);
    }

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

    let assets = prepareAssetsForEncoding(xcmVersion, preparedParams.assets);
    const destination = convertLocationVersion(
      xcmVersion,
      destinationBeneficiary,
    );

    const xTokens = this.simpleXcm.api.tx['xTokens'];
    const noXcmWeightLimit = 'Unlimited';

    const txToDryRun = xTokens.transferMultiassets(
      assets,
      preparedParams.feeAssetIndex,
      destination,
      noXcmWeightLimit,
    );

    const estimatedFees = await this.simpleXcm.estimateExtrinsicXcmFees(
      preparedParams.origin,
      txToDryRun,
      preparedParams.feeAsset.id,
    );

    preparedParams.feeAsset.fun.fungible += estimatedFees;
    assets = prepareAssetsForEncoding(xcmVersion, preparedParams.assets);

    const tx = xTokens.transferMultiassets(
      assets,
      preparedParams.feeAssetIndex,
      destination,
      noXcmWeightLimit,
    );

    return tx;
  }
}

/**
 * Prepares the transfer parameters for the transfer.
 * @param simpleXcm - The SimpleXcm instance.
 * @param transferParams - The parameters for the transfer.
 * @returns A promise that resolves to the prepared transfer parameters.
 */
export async function prepareTransferParams(
  simpleXcm: SimpleXcm,
  transferParams: TransferParams,
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
  const feeAssetId = simpleXcm.resolveRelativeLocation(
    transferParams.feeAssetId,
  );
  const assets = transferParams.assets.map(asset =>
    simpleXcm.resolveRelativeAsset(asset),
  );

  const feeAssetResult = findFeeAssetById(feeAssetId, assets);

  let feeAsset: FungibleAsset;
  let feeAssetIndex: number;

  if (feeAssetResult === undefined) {
    feeAsset = {
      id: feeAssetId,
      fun: fungible(1n),
    };
    feeAssetIndex = assets.length;
    assets.push(feeAsset);
  } else {
    [feeAsset, feeAssetIndex] = feeAssetResult;
  }

  return {
    origin,
    assets,
    feeAssetIndex,
    feeAsset,
    destination,
    beneficiary,
  };
}
