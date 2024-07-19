import { ApiPromise, WsProvider } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import {
  XcmVersion,
  Location,
  Asset,
  AssetId,
  RegistryLookup,
  CURRENT_XCM_VERSION,
  MIN_XCM_VERSION,
  AssetLookup
} from './xcmtypes';
import { ChainInfo, Registry } from './registry';
import {
  convertAssetsVersion,
  convertLocationVersion,
  fungible,
  locationRelativeToPrefix
} from './util';

export type PalletXcmName = 'polkadotXcm' | 'xcmPallet';

export type TransferParams = {
  assets: AssetLookup[];
  feeAssetId: AssetId | RegistryLookup;
  destination: Location | RegistryLookup;
  beneficiary: Location | RegistryLookup;
};

interface TransferBackend {
  composeTransfer(
    transferParams: TransferParams
  ): Promise<SubmittableExtrinsic<'promise'>>;
}

export class SimpleXcm {
  api: ApiPromise;
  registry: Registry;
  chainInfo: ChainInfo;
  palletXcm: PalletXcmName;
  xcmVersion: XcmVersion;

  async composeTransfer(
    transferParams: TransferParams
  ): Promise<SubmittableExtrinsic<'promise'>> {
    return this.#transferBackend().then((backend) =>
      backend.composeTransfer(transferParams)
    );
  }

  enforceXcmVersion(version: XcmVersion) {
    this.xcmVersion = version;
  }

  disconnect() {
    this.api.disconnect();
  }

  private constructor(
    apiPromise: ApiPromise,
    registry: Registry,
    chainInfo: ChainInfo,
    palletXcm: PalletXcmName,
    xcmVersion: XcmVersion
  ) {
    this.api = apiPromise;
    this.registry = registry;
    this.chainInfo = chainInfo;
    this.palletXcm = palletXcm;
    this.xcmVersion = xcmVersion;
  }

  static async create(chainId: string, registry: Registry) {
    const chainInfo = registry.chainInfoById(chainId);

    const provider = new WsProvider([...chainInfo.endpoints]);
    const api = await ApiPromise.create({ provider });

    const palletXcm = await SimpleXcm.#findPalletXcm(api);
    if (!palletXcm) {
      throw new Error(`${chainId}: no pallet-xcm found in the runtime`);
    }

    const maxXcmVersion = await SimpleXcm.#discoverMaxXcmVersion(
      api,
      palletXcm
    );
    if (!maxXcmVersion) {
      throw new Error(`${chainId}: no supported XCM versions found`);
    }

    return new SimpleXcm(api, registry, chainInfo, palletXcm, maxXcmVersion);
  }

  static async #findPalletXcm(api: ApiPromise) {
    const pallets = api.registry.metadata.pallets;
    for (let pallet of pallets) {
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
    api: ApiPromise,
    palletXcm: PalletXcmName
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
  }

  async #transferBackend() {
    if ('transferAssets' in this.api.tx[this.palletXcm]) {
      return new PalletXcmBackend(this);
    }

    const pallets = this.api.registry.metadata.pallets;
    for (let pallet of pallets) {
      const palletRuntimeName = pallet.name.toPrimitive();
      const palletName = palletApiTxName(palletRuntimeName);

      switch (palletName) {
        case 'xTokens':
          return new XTokensBackend(this);

        default:
      }
    }

    throw new Error('No known backend pallet is found');
  }

  resolveRelativeLocation(lookup: Location | RegistryLookup) {
    if (typeof lookup == 'string') {
      const universalLocation = this.registry.universalLocation(lookup);
      if (universalLocation) {
        return locationRelativeToPrefix({
          location: universalLocation,
          prefix: this.chainInfo.universalLocation
        });
      }

      const relativeLocation = this.registry.relativeLocation(lookup);
      if (relativeLocation) {
        return relativeLocation;
      }

      throw new Error(`${lookup}: unknown named location`);
    } else {
      return lookup;
    }
  }

  resolveRelativeAsset(lookup: AssetLookup): Asset {
    return {
      id: this.resolveRelativeLocation(lookup.id),
      fun: lookup.fun
    };
  }
}

export class PalletXcmBackend implements TransferBackend {
  simpleXcm: SimpleXcm;

  constructor(simpleXcm: SimpleXcm) {
    this.simpleXcm = simpleXcm;
  }

  async composeTransfer(
    transferParams: TransferParams
  ): Promise<SubmittableExtrinsic<'promise'>> {
    const destination = this.simpleXcm.resolveRelativeLocation(
      transferParams.destination
    );
    const beneficiary = this.simpleXcm.resolveRelativeLocation(
      transferParams.beneficiary
    );
    const feeAssetId = this.simpleXcm.resolveRelativeLocation(
      transferParams.feeAssetId
    );
    const assets = transferParams.assets.map((asset) =>
      this.simpleXcm.resolveRelativeAsset(asset)
    );

    const dummyFeeAsset: Asset = {
      id: feeAssetId,
      fun: fungible(1)
    };
    const feeAssetIndex = assets.length;
    assets.push(dummyFeeAsset);

    const xcmVersion = this.simpleXcm.xcmVersion;

    const destinationVx = convertLocationVersion(xcmVersion, destination);
    const beneficiaryVx = convertLocationVersion(xcmVersion, beneficiary);
    const assetsVx = convertAssetsVersion(xcmVersion, assets);

    const palletXcm = this.simpleXcm.api.tx[this.simpleXcm.palletXcm];
    const noXcmWeightLimit = 'Unlimited';

    const txToDryRun = palletXcm.transferAssets(
      destinationVx,
      beneficiaryVx,
      assetsVx,
      feeAssetIndex,
      noXcmWeightLimit
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
    transferParams: TransferParams
  ): Promise<SubmittableExtrinsic<'promise'>> {
    throw new Error('Method not implemented.');
  }
}

function palletApiTxName(palletRuntimeName: string) {
  const palletPascalCaseName = palletRuntimeName;

  // `api.tx` fields are in the `camelCase`.
  return palletPascalCaseName[0].toLowerCase() + palletPascalCaseName.slice(1);
}
