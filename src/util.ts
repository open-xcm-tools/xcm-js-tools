import {
  NetworkId,
  Location,
  XcmVersion,
  Junction,
  InteriorLocation,
  LocationV3,
  InteriorV3,
  InteriorV4,
  InteriorV2,
  CURRENT_XCM_VERSION,
  JunctionV3,
  JunctionV2,
  LocationV2,
  NetworkIdV2,
  NetworkIdV3,
  BodyIdV3,
  BodyIdV2,
  VersionedLocation,
  LocationV4,
  Versioned,
  AssetV3,
  VersionedAsset,
  AssetV2,
  FungibilityV3,
  Asset,
  VersionedAssets,
  AssetId,
  RegistryLookup,
  Fungibility,
  AssetLookup,
  Interior,
  MIN_XCM_VERSION
} from './xcmtypes';
import _ from 'lodash';

function interiorToArray(interiorVersion: XcmVersion, interior: any): any[] {
  if (interior == 'Here') {
    return [];
  } else if ('X1' in interior) {
    if (interiorVersion < 4) {
      return [interior.X1];
    } else {
      return [...interior.X1];
    }
  } else if ('X2' in interior) {
    return [...interior.X2];
  } else if ('X3' in interior) {
    return [...interior.X3];
  } else if ('X4' in interior) {
    return [...interior.X4];
  } else if ('X5' in interior) {
    return [...interior.X5];
  } else if ('X6' in interior) {
    return [...interior.X6];
  } else if ('X7' in interior) {
    return [...interior.X7];
  } else if ('X8' in interior) {
    return [...interior.X8];
  } else {
    throw new Error('interiorToArray: invalid interior');
  }
}

function arrayToInterior(interiorVersion: XcmVersion, junctions: any[]): any {
  if (junctions.length == 0) {
    return 'Here';
  } else if (junctions.length == 1) {
    if (interiorVersion < 4) {
      return { X1: junctions[0] };
    } else {
      return { X1: [...junctions] };
    }
  } else if (junctions.length == 2) {
    return { X2: [...junctions] };
  } else if (junctions.length == 3) {
    return { X3: [...junctions] };
  } else if (junctions.length == 4) {
    return { X4: [...junctions] };
  } else if (junctions.length == 5) {
    return { X5: [...junctions] };
  } else if (junctions.length == 6) {
    return { X6: [...junctions] };
  } else if (junctions.length == 7) {
    return { X7: [...junctions] };
  } else if (junctions.length == 8) {
    return { X8: [...junctions] };
  } else {
    throw new Error('arrayToInterior: invalid interior array length');
  }
}

export function asset(
  id: AssetId | RegistryLookup,
  fun: Fungibility
): AssetLookup {
  return {
    id,
    fun
  };
}

export function location(
  parents: number,
  junctions: 'Here' | Junction[]
): Location {
  if (junctions == 'Here') {
    return {
      parents,
      interior: 'Here'
    };
  }

  const interior: Interior = arrayToInterior(CURRENT_XCM_VERSION, junctions);

  return {
    parents,
    interior
  };
}

export function relativeLocaionToUniversal({
  relativeLocation,
  context
}: {
  relativeLocation: Location;
  context: InteriorLocation;
}) {
  const locationJunctions = interiorToArray(
    CURRENT_XCM_VERSION,
    relativeLocation
  );
  const contextJunctions = interiorToArray(CURRENT_XCM_VERSION, context);

  if (relativeLocation.parents > contextJunctions.length) {
    throw new Error(
      'Not enough context to convert relative location to a universal one'
    );
  }

  const universalPrefix = contextJunctions.slice(relativeLocation.parents);
  return <InteriorLocation>(
    arrayToInterior(CURRENT_XCM_VERSION, [
      ...universalPrefix,
      ...locationJunctions
    ])
  );
}

export function locationRelativeToPrefix({
  location,
  prefix
}: {
  location: InteriorLocation;
  prefix: InteriorLocation;
}): Location {
  let locationJunctions: Junction[] = interiorToArray(
    CURRENT_XCM_VERSION,
    location
  );
  let prefixJunctions: Junction[] = interiorToArray(
    CURRENT_XCM_VERSION,
    prefix
  );

  while (
    locationJunctions.length > 0 &&
    prefixJunctions.length > 0 &&
    _.isEqual(locationJunctions[0], prefixJunctions[0])
  ) {
    locationJunctions = locationJunctions.slice(1);
    prefixJunctions = prefixJunctions.slice(1);
  }

  return {
    parents: prefixJunctions.length,
    interior: arrayToInterior(CURRENT_XCM_VERSION, locationJunctions)
  };
}

export function convertAssetVersion(
  version: XcmVersion,
  asset: VersionedAsset | Asset
) {
  if ('id' in asset) {
    return convertAssetVersion(version, <VersionedAsset>{
      [`V${CURRENT_XCM_VERSION}`]: asset
    });
  }

  const assetVersion = extractVersion(asset);
  if (version < assetVersion) {
    return convertAssetVersion(version, downgradeAsset(asset));
  } else if (version == assetVersion) {
    return asset;
  } else {
    return convertAssetVersion(version, upgradeAsset(asset));
  }
}

export function convertAssetsVersion(
  version: XcmVersion,
  assets: VersionedAsset[] | Asset[]
) {
  const assetsVx = assets.map((asset) => {
    const assetVx = convertAssetVersion(version, asset) as any;
    return assetVx[`V${version}`];
  });

  return <VersionedAssets>{
    [`V${version}`]: assetsVx
  };
}

export function locationIntoCurrentVersion(
  location: VersionedLocation
): Location {
  const vCurrent = convertLocationVersion(CURRENT_XCM_VERSION, location) as any;
  return vCurrent[`V${CURRENT_XCM_VERSION}`];
}

export function convertLocationVersion(
  version: XcmVersion,
  location: VersionedLocation | Location
): VersionedLocation {
  if ('parents' in location) {
    return convertLocationVersion(version, <VersionedLocation>{
      [`V${CURRENT_XCM_VERSION}`]: location
    });
  }

  const locationVersion = extractVersion(location);
  if (version < locationVersion) {
    return convertLocationVersion(version, downgradeLocation(location));
  } else if (version == locationVersion) {
    return location;
  } else {
    return convertLocationVersion(version, upgradeLocation(location));
  }
}

export function extractVersion<V2, V3, V4>(
  versioned: Versioned<V2, V3, V4>
): XcmVersion {
  let version: XcmVersion;
  for (version = MIN_XCM_VERSION; version <= CURRENT_XCM_VERSION; ++version) {
    if (`V${version}` in versioned) {
      return version;
    }
  }

  throw new Error(`extractVersion - ${version}: unknown XCM version`);
}

export function downgradeAsset(asset: VersionedAsset): VersionedAsset {
  if ('V2' in asset) {
    throw new Error('AssetV2 cannot be downgraded');
  } else if ('V3' in asset) {
    let assetV2: AssetV2;

    if ('Concrete' in asset.V3.id) {
      assetV2 = {
        id: { Concrete: downgradeLocationV3(asset.V3.id.Concrete) },
        fun: asset.V3.fun
      };
    } else {
      assetV2 = {
        id: asset.V3.id,
        fun: asset.V3.fun
      };
    }

    return { V2: assetV2 };
  } else if ('V4' in asset) {
    return {
      V3: {
        id: { Concrete: downgradeLocationV4(asset.V4.id) },
        fun: asset.V4.fun
      }
    };
  } else {
    throw new Error('downgradeAsset: unknown XCM version');
  }
}

export function upgradeAsset(asset: VersionedAsset): VersionedAsset {
  if ('V2' in asset) {
    const funV2 = asset.V2.fun;
    let funV3: FungibilityV3;

    if ('NonFungible' in funV2) {
      if (typeof funV2.NonFungible == 'object' && 'Blob' in funV2.NonFungible) {
        throw new Error('Blob AssetInstance cannot be upgraded to V3');
      }

      funV3 = {
        NonFungible: funV2.NonFungible
      };
    } else {
      funV3 = funV2;
    }

    let assetV3: AssetV3;
    if ('Concrete' in asset.V2.id) {
      assetV3 = {
        id: { Concrete: upgradeLocationV2(asset.V2.id.Concrete) },
        fun: funV3
      };
    } else {
      assetV3 = {
        id: asset.V2.id,
        fun: funV3
      };
    }

    return { V3: assetV3 };
  } else if ('V3' in asset) {
    if ('Concrete' in asset.V3.id) {
      return {
        V4: {
          id: upgradeLocationV3(asset.V3.id.Concrete),
          fun: asset.V3.fun
        }
      };
    } else {
      throw new Error('Abstract AssetId cannot be upgraded to V4');
    }
  } else if ('V4' in asset) {
    throw new Error('AssetV4 cannot be downgraded');
  } else {
    throw new Error('upgradeAsset: unknown XCM version');
  }
}

export function downgradeLocation(
  location: VersionedLocation
): VersionedLocation {
  if ('V2' in location) {
    throw new Error('LocationV2 cannot be downgraded');
  } else if ('V3' in location) {
    return { V2: downgradeLocationV3(location.V3) };
  } else if ('V4' in location) {
    return { V3: downgradeLocationV4(location.V4) };
  } else {
    throw new Error('downgradeLocation: unknown XCM version');
  }
}

export function upgradeLocation(
  location: VersionedLocation
): VersionedLocation {
  if ('V2' in location) {
    return { V3: upgradeLocationV2(location.V2) };
  } else if ('V3' in location) {
    return { V4: upgradeLocationV3(location.V3) };
  } else if ('V4' in location) {
    throw new Error('LocationV4 cannot be downgraded');
  } else {
    throw new Error('upgradeLocation: unknown XCM version');
  }
}

export function downgradeLocationV4(location: Location): LocationV3 {
  return {
    parents: location.parents,
    interior: downgradeInteriorV4(location.interior)
  };
}

export function upgradeLocationV3(location: LocationV3): LocationV4 {
  return {
    parents: location.parents,
    interior: upgradeInteriorV3(location.interior)
  };
}

export function downgradeLocationV3(location: LocationV3): LocationV2 {
  return {
    parents: location.parents,
    interior: downgradeInteriorV3(location.interior)
  };
}

export function upgradeLocationV2(location: LocationV2): LocationV3 {
  return {
    parents: location.parents,
    interior: upgradeInteriorV2(location.interior)
  };
}

export function downgradeInteriorV4(interior: InteriorV4): InteriorV3 {
  if (typeof interior == 'object' && 'X1' in interior) {
    return {
      X1: interior.X1[0]
    };
  } else {
    return interior;
  }
}

export function upgradeInteriorV3(interior: InteriorV3): InteriorV4 {
  if (typeof interior == 'object' && 'X1' in interior) {
    return {
      X1: [interior.X1]
    };
  } else {
    return interior;
  }
}

export function downgradeInteriorV3(interior: InteriorV3): InteriorV2 {
  const srcVersion = 3;
  const dstVersion = 2;

  const interiorV3Array: JunctionV3[] = interiorToArray(srcVersion, interior);
  const interiorV2Array = interiorV3Array.map(downgradeJunctionV3);

  return arrayToInterior(dstVersion, interiorV2Array);
}

export function upgradeInteriorV2(interior: InteriorV2): InteriorV3 {
  const srcVersion = 2;
  const dstVersion = 3;

  const interiorV2Array: JunctionV2[] = interiorToArray(srcVersion, interior);
  const interiorV3Array = interiorV2Array.map(upgradeJunctionV2);

  return arrayToInterior(dstVersion, interiorV3Array);
}

function downgradeJunctionV3(junction: JunctionV3): JunctionV2 {
  if (
    junction == 'OnlyChild' ||
    'Parachain' in junction ||
    'PalletInstance' in junction ||
    'GeneralIndex' in junction
  ) {
    return junction;
  } else if ('AccountId32' in junction) {
    return {
      AccountId32: {
        network: downgradeNetworkIdV3(junction.AccountId32.network),
        id: junction.AccountId32.id
      }
    };
  } else if ('AccountIndex64' in junction) {
    return {
      AccountIndex64: {
        network: downgradeNetworkIdV3(junction.AccountIndex64.network),
        index: junction.AccountIndex64.index
      }
    };
  } else if ('AccountKey20' in junction) {
    return {
      AccountKey20: {
        network: downgradeNetworkIdV3(junction.AccountKey20.network),
        key: junction.AccountKey20.key
      }
    };
  } else if ('GeneralKey' in junction) {
    return {
      GeneralKey: junction.GeneralKey.data
    };
  } else if ('Plurality' in junction) {
    return {
      Plurality: {
        id: downgradeBodyIdV3(junction.Plurality.id),
        part: junction.Plurality.part
      }
    };
  } else {
    const junctionStr = JSON.stringify(junction);
    throw new Error(`V2 junctions doesn't include '${junctionStr}'`);
  }
}

function upgradeJunctionV2(junction: JunctionV2): JunctionV3 {
  if (
    junction == 'OnlyChild' ||
    'Parachain' in junction ||
    'PalletInstance' in junction ||
    'GeneralIndex' in junction
  ) {
    return junction;
  } else if ('AccountId32' in junction) {
    return {
      AccountId32: {
        network: upgradeNetworkIdV2(junction.AccountId32.network),
        id: junction.AccountId32.id
      }
    };
  } else if ('AccountIndex64' in junction) {
    return {
      AccountIndex64: {
        network: upgradeNetworkIdV2(junction.AccountIndex64.network),
        index: junction.AccountIndex64.index
      }
    };
  } else if ('AccountKey20' in junction) {
    return {
      AccountKey20: {
        network: upgradeNetworkIdV2(junction.AccountKey20.network),
        key: junction.AccountKey20.key
      }
    };
  } else if ('GeneralKey' in junction) {
    return {
      GeneralKey: {
        length: textByteLength(junction.GeneralKey),
        data: junction.GeneralKey
      }
    };
  } else if ('Plurality' in junction) {
    return {
      Plurality: {
        id: upgradeBodyIdV2(junction.Plurality.id),
        part: junction.Plurality.part
      }
    };
  } else {
    const junctionStr = JSON.stringify(junction);
    throw new Error(`${junctionStr}: unknown V2 junction`);
  }
}

function downgradeNetworkIdV3(
  networkId: NetworkIdV3 | undefined | null
): NetworkIdV2 {
  if (!networkId) {
    return 'Any';
  } else if (networkId == 'Polkadot' || networkId == 'Kusama') {
    return networkId;
  } else {
    const networkStr = JSON.stringify(networkId);
    throw new Error(`V2 network ID doesn't include '${networkStr}'`);
  }
}

function upgradeNetworkIdV2(networkId: NetworkIdV2): NetworkIdV3 | null {
  switch (networkId) {
    case 'Any':
      return null;

    case 'Polkadot':
    case 'Kusama':
      return networkId;

    default:
      throw new Error(`'Named' NetworkIdV2 can't be upgraded to V3`);
  }
}

function downgradeBodyIdV3(bodyId: BodyIdV3): BodyIdV2 {
  if (typeof bodyId == 'object' && 'Moniker' in bodyId) {
    return {
      Named: bodyId.Moniker
    };
  } else {
    return bodyId;
  }
}

function upgradeBodyIdV2(bodyId: BodyIdV2): BodyIdV3 {
  if (typeof bodyId == 'object' && 'Named' in bodyId) {
    return {
      Moniker: bodyId.Named
    };
  } else {
    return bodyId;
  }
}

export function isChainUniversalLocation(location: InteriorLocation): boolean {
  const locationArray: Junction[] = interiorToArray(
    CURRENT_XCM_VERSION,
    location
  );

  if (locationArray.length == 0) {
    return false;
  }

  const firstJunction = locationArray[0];
  const startsWithGlobalConsensus =
    typeof firstJunction == 'object' && 'GlobalConsensus' in firstJunction;

  if (!startsWithGlobalConsensus) {
    return false;
  }

  switch (locationArray.length) {
    case 1:
      return true;

    case 2:
      const secondJunction = locationArray[1];
      const parachainJunctionIsSecond =
        typeof secondJunction == 'object' && 'Parachain' in secondJunction;

      return parachainJunctionIsSecond;

    default:
      return false;
  }
}

export function relaychainUniversalLocation(
  networkId: NetworkId
): InteriorLocation {
  return {
    X1: [{ GlobalConsensus: networkId }]
  };
}

export function parachainUniveralLocation(
  networkId: NetworkId,
  paraId: number
): InteriorLocation {
  return {
    X2: [{ GlobalConsensus: networkId }, { Parachain: paraId }]
  };
}

export function fungible(amount: number | bigint) {
  return {
    Fungible: amount
  };
}

function textByteLength(text: string) {
  const hexMatch = text.match(/^0x(?<numberPart>[0-9a-f]*)$/i);
  if (hexMatch) {
    const numberPart = hexMatch.groups!.numberPart;
    return Math.ceil(numberPart.length / 2);
  } else {
    // In this case, SCALE interprets the `text` as plain ASCII text
    return text.length;
  }
}

export function nonfungible(id: number | bigint | string) {
  let assetInstance;
  if (typeof id == 'number' || typeof id == 'bigint') {
    assetInstance = {
      Index: id
    };
  } else {
    const byteLength = textByteLength(id);

    switch (byteLength) {
      case 4:
        assetInstance = {
          Array4: id
        };
        break;

      case 8:
        assetInstance = {
          Array8: id
        };
        break;

      case 16:
        assetInstance = {
          Array16: id
        };
        break;

      case 32:
        assetInstance = {
          Array32: id
        };
        break;

      default:
        throw new Error(
          `invalid nonfungible id byte length: ${byteLength} (the id: ${id})`
        );
    }
  }

  return {
    NonFungible: assetInstance
  };
}
