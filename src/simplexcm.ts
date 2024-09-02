import {ApiPromise, WsProvider} from '@polkadot/api';
import {SubmittableExtrinsic} from '@polkadot/api/types';
import {Bytes, Result} from '@polkadot/types-codec';
import {Codec} from '@polkadot/types-codec/types';
import {
  XcmVersion,
  Location,
  Asset,
  CURRENT_XCM_VERSION,
  MIN_XCM_VERSION,
  AssetLookup,
  LocationLookup,
  AssetIdLookup,
  RegistryLookup,
  VersionedLocation,
  FungibleAsset,
  InteriorLocationLookup,
  InteriorLocation,
} from './xcmtypes';
import {ChainInfo, Registry} from './registry';
import {
  convertAssetsVersion,
  convertLocationVersion,
  findFeeAssetById,
  fungible,
  location,
  locationRelativeToPrefix,
  relativeLocaionToUniversal,
  toJunctions,
} from './util';
import {Origin} from './origin';
import {stringify} from '@polkadot/util';
import {xcm} from './interfaces/definitions';

export type PalletXcmName = 'polkadotXcm' | 'xcmPallet';

export type TransferParams = {
  origin: Origin | RegistryLookup;
  assets: AssetLookup[];
  feeAssetId: AssetIdLookup;
  destination: LocationLookup;
  beneficiary: LocationLookup;
};

type PreparedTransferParams = {
  origin: Origin;
  assets: Asset[];
  feeAssetIndex: number;
  feeAsset: FungibleAsset;
  destination: Location;
  beneficiary: Location;
};

interface TransferBackend {
  composeTransfer(
    transferParams: TransferParams,
  ): Promise<SubmittableExtrinsic<'promise'>>;
}

export class SimpleXcm {
  api: ApiPromise;
  registry: Registry;
  chainInfo: ChainInfo;
  palletXcm: PalletXcmName;
  maxXcmVersion: XcmVersion;
  xcmVersion: XcmVersion;

  composeTransfer(
    transferParams: TransferParams,
  ): Promise<SubmittableExtrinsic<'promise'>> {
    return this.#transferBackend().composeTransfer(transferParams);
  }

  enforceXcmVersion(version: XcmVersion) {
    if (version > this.maxXcmVersion) {
      throw new Error(
        `The requested XCM version ${version} is greater than the chain supports (= ${this.maxXcmVersion})`,
      );
    }

    this.xcmVersion = version;
  }

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

  adjustedFungible(assetId: AssetIdLookup, amount: string): AssetLookup {
    let decimals: number;

    if (typeof assetId === 'string') {
      decimals = this.registry.currencyInfoBySymbol(assetId).decimals;
    } else {
      const currencyUniversalLocation = relativeLocaionToUniversal({
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

  async disconnect() {
    await this.api.disconnect();
  }

  private constructor(
    apiPromise: ApiPromise,
    registry: Registry,
    chainInfo: ChainInfo,
    palletXcm: PalletXcmName,
    maxXcmVersion: XcmVersion,
  ) {
    this.api = apiPromise;
    this.registry = registry;
    this.chainInfo = chainInfo;
    this.palletXcm = palletXcm;
    this.maxXcmVersion = maxXcmVersion;
    this.xcmVersion = maxXcmVersion;
  }

  static async create(chainId: string, registry: Registry) {
    const chainInfo = registry.chainInfoById(chainId);

    const provider = new WsProvider(chainInfo.endpoints);
    const api = await ApiPromise.create({
      provider,
      ...xcm,
    });

    const palletXcm = SimpleXcm.#findPalletXcm(api);
    if (!palletXcm) {
      throw new Error(`${chainId}: no pallet-xcm found in the runtime`);
    }

    const maxXcmVersion = await SimpleXcm.#discoverMaxXcmVersion(
      chainId,
      api,
      palletXcm,
    );

    return new SimpleXcm(api, registry, chainInfo, palletXcm, maxXcmVersion);
  }

  static #findPalletXcm(api: ApiPromise) {
    const pallets = api.registry.metadata.pallets;
    for (const pallet of pallets) {
      const palletRuntimeName = pallet.name.toPrimitive();
      const palletName = palletApiTxName(palletRuntimeName);

      switch (palletName) {
        case 'xcmPallet':
        case 'polkadotXcm':
          return palletName;
        default:
      }
    }
  }

  static async #discoverMaxXcmVersion(
    chainId: string,
    api: ApiPromise,
    palletXcm: PalletXcmName,
  ) {
    for (
      let version = CURRENT_XCM_VERSION;
      version >= MIN_XCM_VERSION;
      --version
    ) {
      const supportedVersionEntries =
        await api.query[palletXcm].supportedVersion.entries(version);

      if (supportedVersionEntries.length > 0) {
        return version;
      }
    }

    console.warn(
      `${chainId}: ${palletXcm} doesn't know about supported XCM versions yet. Fallbacking to safeXcmVersion`,
    );

    const safeVersion = await api.query[palletXcm]
      .safeXcmVersion()
      .then(version => version.toPrimitive() as number);

    if (MIN_XCM_VERSION <= safeVersion && safeVersion <= CURRENT_XCM_VERSION) {
      return safeVersion as XcmVersion;
    } else {
      throw new Error(`${chainId}: no supported XCM versions found`);
    }
  }

  #transferBackend() {
    if ('transferAssets' in this.api.tx[this.palletXcm]) {
      return new PalletXcmBackend(this);
    }

    console.warn(`
      ${this.chainInfo.chainId}: pallet-xcm does not have the needed "transferAssets" extrinsic.
      Looking for an alternative transfer backend...
    `);

    const pallets = this.api.registry.metadata.pallets;

    let palletName: string;
    let backend: TransferBackend | undefined;
    loop: for (const pallet of pallets) {
      const palletRuntimeName = pallet.name.toPrimitive();
      palletName = palletApiTxName(palletRuntimeName);

      switch (palletName) {
        case 'xTokens':
          backend = new XTokensBackend(this);
          break loop;

        default:
      }
    }

    if (backend) {
      console.warn(
        `${this.chainInfo.chainId}: using an alternative transfer backend - ${palletName!}`,
      );
      return backend;
    } else {
      throw new Error(
        `${this.chainInfo.chainId}: No known backend pallet is found`,
      );
    }
  }

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
      return lookup;
    } else {
      return locationRelativeToPrefix({
        location: lookup,
        prefix: this.chainInfo.universalLocation,
      });
    }
  }

  resolveUniversalLocation(lookup: InteriorLocationLookup): InteriorLocation {
    if (typeof lookup === 'string') {
      const universalLocation = this.registry.universalLocation(lookup);
      if (universalLocation) {
        return universalLocation;
      }

      const relativeLocation = this.registry.relativeLocation(lookup);
      if (relativeLocation) {
        return relativeLocaionToUniversal({
          relativeLocation,
          context: this.chainInfo.universalLocation,
        });
      }

      throw new Error(`${lookup}: unknown named location`);
    } else {
      return lookup;
    }
  }

  resolveRelativeAsset(lookup: AssetLookup): Asset {
    return {
      id: this.resolveRelativeLocation(lookup.id),
      fun: lookup.fun,
    };
  }

  async locationToAccountId(lookup: LocationLookup): Promise<string> {
    // TODO throw a better error the needed Runtime API isn't available

    if (typeof lookup === 'string') {
      const accountLocation = this.resolveRelativeLocation(lookup);
      return this.locationToAccountId(accountLocation);
    }

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

export class PalletXcmBackend implements TransferBackend {
  simpleXcm: SimpleXcm;

  constructor(simpleXcm: SimpleXcm) {
    this.simpleXcm = simpleXcm;
  }

  async composeTransfer(
    transferParams: TransferParams,
  ): Promise<SubmittableExtrinsic<'promise'>> {
    const preparedParams = await prepareTransferParams(
      this.simpleXcm,
      transferParams,
    );

    const xcmVersion = this.simpleXcm.xcmVersion;

    const assets = convertAssetsVersion(xcmVersion, preparedParams.assets);
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

    // TODO XcmDryRun the extrinsic
    // 1. Check if the fee asset is OK at all the chain in between.
    //      a. [Failed check] Throw a descriptive Error object with all relevant info. TODO error object description.
    // 2. Compute the needed fee amount.

    // FIXME
    return txToDryRun;
  }
}

export class XTokensBackend implements TransferBackend {
  simpleXcm: SimpleXcm;

  constructor(simpleXcm: SimpleXcm) {
    this.simpleXcm = simpleXcm;
  }

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

    const assets = convertAssetsVersion(xcmVersion, preparedParams.assets);
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

    // FIXME
    return txToDryRun;
  }
}

async function prepareTransferParams(
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

  // TODO sanitize

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

  // TODO sort and deduplicate the `assets`

  const feeAssetResult = findFeeAssetById(
    simpleXcm.xcmVersion,
    feeAssetId,
    assets,
  );

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

function palletApiTxName(palletRuntimeName: string) {
  const palletPascalCaseName = palletRuntimeName;

  // `api.tx` fields are in the `camelCase`.
  return palletPascalCaseName[0].toLowerCase() + palletPascalCaseName.slice(1);
}
