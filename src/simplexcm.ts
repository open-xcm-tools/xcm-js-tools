import { ApiPromise, WsProvider } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import {
  XcmVersion,
  Location,
  Asset,
  CURRENT_XCM_VERSION,
  MIN_XCM_VERSION,
  AssetLookup,
  LocationLookup,
  AssetIdLookup
} from './xcmtypes';
import { ChainInfo, Registry } from './registry';
import {
  convertAssetsVersion,
  convertLocationVersion,
  fungible,
  location,
  locationRelativeToPrefix,
  relativeLocaionToUniversal,
  toJunctions
} from './util';

export type PalletXcmName = 'polkadotXcm' | 'xcmPallet';

export type TransferParams = {
  assets: AssetLookup[];
  feeAssetId: AssetIdLookup;
  destination: LocationLookup;
  beneficiary: LocationLookup;
};

type PreparedTransferParams = {
  assets: Asset[];
  feeAssetIndex: number;
  destination: Location;
  beneficiary: Location;
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
  maxXcmVersion: XcmVersion;
  xcmVersion: XcmVersion;

  async composeTransfer(
    transferParams: TransferParams
  ): Promise<SubmittableExtrinsic<'promise'>> {
    return this.#transferBackend().then((backend) =>
      backend.composeTransfer(transferParams)
    );
  }

  enforceXcmVersion(version: XcmVersion) {
    if (version > this.maxXcmVersion) {
      throw new Error(
        `The requested XCM version ${version} is greater than the chain supports (= ${this.maxXcmVersion})`
      );
    }

    this.xcmVersion = version;
  }

  adjustedFungible(assetId: AssetIdLookup, amount: number): AssetLookup {
    let decimals: number;

    if (typeof assetId == 'string') {
      decimals = this.registry.currencyInfoBySymbol(assetId).decimals;
    } else {
      const currencyUniversalLocation = relativeLocaionToUniversal({
        relativeLocation: assetId,
        context: this.chainInfo.universalLocation
      });

      decimals = this.registry.currencyInfoByLocation(
        currencyUniversalLocation
      ).decimals;
    }

    // FIXME
    const value = BigInt(amount) * BigInt(10) ** BigInt(decimals);

    return {
      id: assetId,
      fun: { fungible: value }
    };
  }

  disconnect() {
    this.api.disconnect();
  }

  private constructor(
    apiPromise: ApiPromise,
    registry: Registry,
    chainInfo: ChainInfo,
    palletXcm: PalletXcmName,
    maxXcmVersion: XcmVersion
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
      runtime: {
        DryRunApi: [
          {
            version: 1,

            methods: {
              dry_run_call: {
                description: 'XCM dry-run call',
                params: [
                  {
                    name: 'origin',
                    type: 'OriginCaller',
                  },
                  
                  {
                    name: 'call',
                    type: 'Call',
                  }
                ],
                type: 'Result<DryRunCallEffects, DryRunError>',
              },

              dry_run_xcm: {
                description: 'XCM dry-run xcm',
                params: [
                  {
                    name: 'origin_location',
                    type: 'XcmVersionedLocation',
                  },

                  {
                    name: 'xcm',
                    type: 'VersionedXcm',
                  }
                ],
                type: 'Result<DryRunXcmEffects, DryRunError>',
              }
            }
          }
        ]
      },
      types: {
        DryRunCallEffects: {
          execution_result: 'Result<FrameSupportDispatchPostDispatchInfo, SpRuntimeDispatchErrorWithPostInfo>',
          emitted_events: 'Vec<Event>',
          local_xcm: 'Option<XcmVersionedXcm>',
          forwarded_xcms: 'Vec<(XcmVersionedLocation, Vec<XcmVersionedXcm>)>',
        },

        DryRunXcmEffects: {
          execution_result: 'StagingXcmV4TraitsOutcome',
          emitted_events: 'Vec<Event>',
          forwarded_xcms: 'Vec<(XcmVersionedLocation, Vec<XcmVersionedXcm>)>',
        },

        DryRunError: {
          _enum: {
            Unimplemented: 'Null',
            VersionedConversionFailed: 'Null',
          },
        },
      },
    });

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

    console.warn(
      'pallet-xcm does not have the needed "transferAssets" extrinsic'
    );
    console.warn('looking for an alternative transfer backend...');

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
      console.warn(`using an alternative transfer backend: ${palletName!}`);
      return backend;
    } else {
      throw new Error('No known backend pallet is found');
    }
  }

  resolveRelativeLocation(lookup: LocationLookup) {
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
    const preparedParams = prepareTransferParams(
      this.simpleXcm,
      transferParams
    );

    const xcmVersion = this.simpleXcm.xcmVersion;

    const assets = convertAssetsVersion(xcmVersion, preparedParams.assets);
    const destination = convertLocationVersion(
      xcmVersion,
      preparedParams.destination
    );
    const beneficiary = convertLocationVersion(
      xcmVersion,
      preparedParams.beneficiary
    );

    const palletXcm = this.simpleXcm.api.tx[this.simpleXcm.palletXcm];
    const noXcmWeightLimit = 'Unlimited';

    const txToDryRun = palletXcm.transferAssets(
      destination,
      beneficiary,
      assets,
      preparedParams.feeAssetIndex,
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
    const preparedParams = prepareTransferParams(
      this.simpleXcm,
      transferParams
    );

    if (preparedParams.beneficiary.parents != 0n) {
      throw new Error(`
        The beneficiary must be an interior location (parents = 0) when using the XTokens backend.
        The actual parents = ${preparedParams.beneficiary.parents}
      `);
    }

    const beneficiaryJunctions = toJunctions(
      preparedParams.beneficiary.interior
    );
    const destinationJunctions = toJunctions(
      preparedParams.destination.interior
    );

    const destinationBeneficiary = location(
      preparedParams.destination.parents,
      [...destinationJunctions, ...beneficiaryJunctions]
    );

    const xcmVersion = this.simpleXcm.xcmVersion;

    const assets = convertAssetsVersion(xcmVersion, preparedParams.assets);
    const destination = convertLocationVersion(
      xcmVersion,
      destinationBeneficiary
    );

    const xTokens = this.simpleXcm.api.tx['xTokens'];
    const noXcmWeightLimit = 'Unlimited';

    const txToDryRun = xTokens.transferMultiassets(
      assets,
      preparedParams.feeAssetIndex,
      destination,
      noXcmWeightLimit
    );

    // FIXME
    return txToDryRun;
  }
}

function prepareTransferParams(
  simpleXcm: SimpleXcm,
  transferParams: TransferParams
): PreparedTransferParams {
  const destination = simpleXcm.resolveRelativeLocation(
    transferParams.destination
  );
  const beneficiary = simpleXcm.resolveRelativeLocation(
    transferParams.beneficiary
  );
  const feeAssetId = simpleXcm.resolveRelativeLocation(
    transferParams.feeAssetId
  );
  const assets = transferParams.assets.map((asset) =>
    simpleXcm.resolveRelativeAsset(asset)
  );

  const dummyFeeAsset: Asset = {
    id: feeAssetId,
    fun: fungible(1n)
  };
  const feeAssetIndex = assets.length;
  assets.push(dummyFeeAsset);

  return {
    assets,
    feeAssetIndex,
    destination,
    beneficiary
  };
}

function palletApiTxName(palletRuntimeName: string) {
  const palletPascalCaseName = palletRuntimeName;

  // `api.tx` fields are in the `camelCase`.
  return palletPascalCaseName[0].toLowerCase() + palletPascalCaseName.slice(1);
}
