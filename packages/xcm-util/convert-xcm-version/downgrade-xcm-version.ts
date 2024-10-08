import {stringify} from '@polkadot/util';
import {
  AssetV2,
  BodyIdV2,
  BodyIdV3,
  InteriorV2,
  InteriorV3,
  InteriorV4,
  JunctionV2,
  JunctionV3,
  LocationV2,
  LocationV3,
  NetworkIdV2,
  NetworkIdV3,
  VersionedAsset,
  VersionedAssetId,
  VersionedLocation,
  Location,
} from '@open-xcm-tools/xcm-types';
import {arrayToInterior, interiorToArray} from '../common';

export function downgradeAssetId(assetId: VersionedAssetId): VersionedAssetId {
  if ('v2' in assetId) {
    throw new Error('downgradeAssetId: assetIdV2 cannot be downgraded');
  }
  if ('v3' in assetId) {
    return 'concrete' in assetId.v3
      ? {v2: {concrete: downgradeLocationV3(assetId.v3.concrete)}}
      : {v2: assetId.v3};
  }
  if ('v4' in assetId) {
    return {
      v3: {
        concrete: downgradeLocationV4(assetId.v4),
      },
    };
  }
  throw new Error('downgradeAssetId: unknown XCM version');
}

export function downgradeAsset(asset: VersionedAsset): VersionedAsset {
  if ('v2' in asset) {
    throw new Error('downgradeAsset: assetV2 cannot be downgraded');
  }

  if ('v3' in asset) {
    let assetV2: AssetV2;

    if ('concrete' in asset.v3.id) {
      assetV2 = {
        id: {concrete: downgradeLocationV3(asset.v3.id.concrete)},
        fun: asset.v3.fun,
      };
    } else {
      assetV2 = {
        id: asset.v3.id,
        fun: asset.v3.fun,
      };
    }

    return {v2: assetV2};
  }

  if ('v4' in asset) {
    return {
      v3: {
        id: {concrete: downgradeLocationV4(asset.v4.id)},
        fun: asset.v4.fun,
      },
    };
  }

  throw new Error('downgradeAsset: unknown XCM version');
}

export function downgradeLocation(
  location: VersionedLocation,
): VersionedLocation {
  if ('v2' in location) {
    throw new Error('downgradeLocation: locationV2 cannot be downgraded');
  }

  if ('v3' in location) {
    return {v2: downgradeLocationV3(location.v3)};
  }

  if ('v4' in location) {
    return {v3: downgradeLocationV4(location.v4)};
  }

  throw new Error('downgradeLocation: unknown XCM version');
}

export function downgradeLocationV4(location: Location): LocationV3 {
  return {
    parents: location.parents,
    interior: downgradeInteriorV4(location.interior),
  };
}

export function downgradeLocationV3(location: LocationV3): LocationV2 {
  return {
    parents: location.parents,
    interior: downgradeInteriorV3(location.interior),
  };
}

export function downgradeInteriorV4(interior: InteriorV4): InteriorV3 {
  if (typeof interior === 'object' && 'x1' in interior) {
    return {
      x1: interior.x1[0],
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

function downgradeJunctionV3(junction: JunctionV3): JunctionV2 {
  if (
    junction === 'onlyChild' ||
    'parachain' in junction ||
    'palletInstance' in junction ||
    'generalIndex' in junction
  ) {
    return junction;
  }

  if ('accountId32' in junction) {
    return {
      accountId32: {
        network: downgradeNetworkIdV3(junction.accountId32.network),
        id: junction.accountId32.id,
      },
    };
  }

  if ('accountIndex64' in junction) {
    return {
      accountIndex64: {
        network: downgradeNetworkIdV3(junction.accountIndex64.network),
        index: junction.accountIndex64.index,
      },
    };
  }

  if ('accountKey20' in junction) {
    return {
      accountKey20: {
        network: downgradeNetworkIdV3(junction.accountKey20.network),
        key: junction.accountKey20.key,
      },
    };
  }

  if ('generalKey' in junction) {
    return {
      generalKey: junction.generalKey.data,
    };
  }

  if ('plurality' in junction) {
    return {
      plurality: {
        id: downgradeBodyIdV3(junction.plurality.id),
        part: junction.plurality.part,
      },
    };
  }

  throw new Error(`V2 junctions don't include '${stringify(junction)}'`);
}

function downgradeNetworkIdV3(
  networkId: NetworkIdV3 | undefined | null,
): NetworkIdV2 {
  if (!networkId) {
    return 'any';
  } else if (networkId === 'polkadot' || networkId === 'kusama') {
    return networkId;
  } else {
    const networkStr = stringify(networkId);
    throw new Error(`V2 network ID doesn't include '${networkStr}'`);
  }
}

function downgradeBodyIdV3(bodyId: BodyIdV3): BodyIdV2 {
  if (typeof bodyId === 'object' && 'moniker' in bodyId) {
    return {
      named: bodyId.moniker,
    };
  } else {
    return bodyId;
  }
}
