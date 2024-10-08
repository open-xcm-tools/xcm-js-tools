import {
  AssetV3,
  BodyIdV2,
  BodyIdV3,
  FungibilityV3,
  InteriorV2,
  InteriorV3,
  InteriorV4,
  JunctionV2,
  JunctionV3,
  LocationV2,
  LocationV3,
  LocationV4,
  NetworkIdV2,
  NetworkIdV3,
  VersionedAsset,
  VersionedAssetId,
  VersionedLocation,
} from '@open-xcm-tools/xcm-types';
import {arrayToInterior, interiorToArray} from '../common';
import {stringify} from '@polkadot/util';

export function upgradeAssetId(assetId: VersionedAssetId): VersionedAssetId {
  if ('v2' in assetId) {
    return 'concrete' in assetId.v2
      ? {v3: {concrete: upgradeLocationV2(assetId.v2.concrete)}}
      : {v3: assetId.v2};
  }

  if ('v3' in assetId) {
    if ('concrete' in assetId.v3) {
      return {v4: upgradeLocationV3(assetId.v3.concrete)};
    } else {
      throw new Error(
        'upgradeAssetId: abstract assetId cannot be upgraded to v4',
      );
    }
  }

  if ('v4' in assetId) {
    throw new Error('upgradeAssetId: assetV4 cannot be downgraded');
  }

  throw new Error('upgradeAsset: unknown XCM version');
}

export function upgradeAsset(asset: VersionedAsset): VersionedAsset {
  if ('v2' in asset) {
    const funV2 = asset.v2.fun;
    let funV3: FungibilityV3;

    if ('nonFungible' in funV2) {
      if (
        typeof funV2.nonFungible === 'object' &&
        'blob' in funV2.nonFungible
      ) {
        throw new Error(
          'upgradeAsset: blob assetInstance cannot be upgraded to v3',
        );
      }

      funV3 = {
        nonFungible: funV2.nonFungible,
      };
    } else {
      funV3 = funV2;
    }

    let assetV3: AssetV3;
    if ('concrete' in asset.v2.id) {
      assetV3 = {
        id: {concrete: upgradeLocationV2(asset.v2.id.concrete)},
        fun: funV3,
      };
    } else {
      assetV3 = {
        id: asset.v2.id,
        fun: funV3,
      };
    }

    return {v3: assetV3};
  }

  if ('v3' in asset) {
    if ('concrete' in asset.v3.id) {
      return {
        v4: {
          id: upgradeLocationV3(asset.v3.id.concrete),
          fun: asset.v3.fun,
        },
      };
    } else {
      throw new Error(
        'upgradeAsset: abstract assetId cannot be upgraded to v4',
      );
    }
  }

  if ('v4' in asset) {
    throw new Error('upgradeAsset: assetV4 cannot be upgraded');
  }

  throw new Error('upgradeAsset: unknown XCM version');
}

export function upgradeLocation(
  location: VersionedLocation,
): VersionedLocation {
  if ('v2' in location) {
    return {v3: upgradeLocationV2(location.v2)};
  }

  if ('v3' in location) {
    return {v4: upgradeLocationV3(location.v3)};
  }

  if ('v4' in location) {
    throw new Error('downgradeLocation: locationV4 cannot be upgraded');
  }

  throw new Error('upgradeLocation: unknown XCM version');
}

export function upgradeLocationV3(location: LocationV3): LocationV4 {
  return {
    parents: location.parents,
    interior: upgradeInteriorV3(location.interior),
  };
}

export function upgradeLocationV2(location: LocationV2): LocationV3 {
  return {
    parents: location.parents,
    interior: upgradeInteriorV2(location.interior),
  };
}

export function upgradeInteriorV3(interior: InteriorV3): InteriorV4 {
  if (typeof interior === 'object' && 'x1' in interior) {
    return {
      x1: [interior.x1],
    };
  } else {
    return interior;
  }
}

export function upgradeInteriorV2(interior: InteriorV2): InteriorV3 {
  const srcVersion = 2;
  const dstVersion = 3;

  const interiorV2Array: JunctionV2[] = interiorToArray(srcVersion, interior);
  const interiorV3Array = interiorV2Array.map(upgradeJunctionV2);

  return arrayToInterior(dstVersion, interiorV3Array);
}

function upgradeJunctionV2(junction: JunctionV2): JunctionV3 {
  if (
    junction === 'onlyChild' ||
    'parachain' in junction ||
    'palletInstance' in junction ||
    'generalIndex' in junction
  ) {
    return junction;
  } else if ('accountId32' in junction) {
    return {
      accountId32: {
        network: upgradeNetworkIdV2(junction.accountId32.network),
        id: junction.accountId32.id,
      },
    };
  } else if ('accountIndex64' in junction) {
    return {
      accountIndex64: {
        network: upgradeNetworkIdV2(junction.accountIndex64.network),
        index: junction.accountIndex64.index,
      },
    };
  } else if ('accountKey20' in junction) {
    return {
      accountKey20: {
        network: upgradeNetworkIdV2(junction.accountKey20.network),
        key: junction.accountKey20.key,
      },
    };
  } else if ('generalKey' in junction) {
    return {
      generalKey: {
        length: BigInt(junction.generalKey.length),
        data: junction.generalKey,
      },
    };
  } else if ('plurality' in junction) {
    return {
      plurality: {
        id: upgradeBodyIdV2(junction.plurality.id),
        part: junction.plurality.part,
      },
    };
  } else {
    const junctionStr = stringify(junction);
    throw new Error(`${junctionStr}: unknown V2 junction`);
  }
}

function upgradeNetworkIdV2(networkId: NetworkIdV2): NetworkIdV3 | null {
  switch (networkId) {
    case 'any':
      return null;

    case 'polkadot':
    case 'kusama':
      return networkId;

    default:
      throw new Error(
        "upgradeNetworkIdV2: 'named' NetworkIdV2 can't be upgraded to V3",
      );
  }
}

function upgradeBodyIdV2(bodyId: BodyIdV2): BodyIdV3 {
  if (typeof bodyId === 'object' && 'named' in bodyId) {
    return {
      moniker: bodyId.named,
    };
  } else {
    return bodyId;
  }
}
