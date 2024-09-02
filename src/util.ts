import {decodeAddress} from '@polkadot/keyring';
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
  AssetV3,
  VersionedAsset,
  AssetV2,
  FungibilityV3,
  Asset,
  VersionedAssets,
  Fungibility,
  AssetLookup,
  Interior,
  MIN_XCM_VERSION,
  AssetV4,
  BodyPart,
  Fraction,
  AssetIdLookup,
  BodyId,
  VersionedAssetId,
  AssetId,
  AnyAssetId,
  FungibleAsset,
  AnyAsset,
  AnyAssetInstance,
  AnyNetworkId,
  AnyBodyId,
  AnyJunction,
  AnyInterior,
  AssetIdV4,
  AssetIdV3,
  AssetIdV2,
} from './xcmtypes';
import _ from 'lodash';
import {JunctionValidationError} from './errors';
import {hexToU8a, stringify} from '@polkadot/util';

const MAX_UINT8 = 2n ** 8n - 1n;
const MAX_UINT32 = 2n ** 32n - 1n;
const MAX_UINT64 = 2n ** 64n - 1n;
const MAX_UINT128 = 2n ** 128n - 1n;

const commonAssets = new Map<string, number>([
  ['undefined', 0],
  ['index', 1],
  ['array4', 2],
  ['array8', 3],
  ['array16', 4],
  ['array32', 5],
]);

const assetInstanceOrder = new Map<XcmVersion, Map<string, number>>([
  [2, new Map<string, number>([...commonAssets, ['blob', 6]])],
  [3, commonAssets],
  [4, commonAssets],
]);

const commonNetworks = new Map<string, number>([
  ['byGenesis', 0],
  ['byFork', 1],
  ['polkadot', 4],
  ['kusama', 5],
  ['westend', 6],
  ['rococo', 7],
  ['wococo', 8],
  ['ethereum', 9],
  ['bitcoinCore', 10],
  ['bitcoinCash', 11],
  ['polkadotBulletin', 12],
]);

const networkIdOrder = new Map<XcmVersion, Map<string, number>>([
  [2, new Map<string, number>([['any', 2], ['named', 3], ...commonNetworks])],
  [3, commonNetworks],
  [4, commonNetworks],
]);

const commonBodyIds = new Map<string, number>([
  ['unit', 0],
  ['index', 3],
  ['executive', 4],
  ['technical', 5],
  ['legislative', 6],
  ['judicial', 7],
  ['defense', 8],
  ['administration', 9],
  ['treasury', 10],
]);

const bodyIdOrder = new Map<XcmVersion, Map<string, number>>([
  [2, new Map<string, number>([['named', 1], ...commonBodyIds])],
  [3, new Map<string, number>([['moniker', 2], ...commonBodyIds])],
  [4, new Map<string, number>([['moniker', 2], ...commonBodyIds])],
]);

const commonBodyParts = new Map<string, number>([
  ['voice', 0],
  ['members', 1],
  ['fraction', 2],
  ['atLeastProportion', 3],
  ['moreThanProportion', 4],
]);

const bodyPartOrder = new Map<XcmVersion, Map<string, number>>([
  [2, commonBodyParts],
  [3, commonBodyParts],
  [4, commonBodyParts],
]);

const commonJunctions = new Map<string, number>([
  ['parachain', 0],
  ['accountId32', 1],
  ['accountIndex64', 2],
  ['accountKey20', 3],
  ['palletInstance', 4],
  ['generalIndex', 5],
  ['generalKey', 6],
  ['onlyChild', 7],
  ['plurality', 8],
]);

const junctionOrder = new Map<XcmVersion, Map<string, number>>([
  [2, commonJunctions],
  [3, new Map<string, number>([['globalConsensus', 9], ...commonJunctions])],
  [4, new Map<string, number>([['globalConsensus', 9], ...commonJunctions])],
]);

const commonAssetIds = new Map<string, number>([
  ['Concrete', 0],
  ['Abstract', 1],
]);

const assetIdOrder = new Map<XcmVersion, Map<string, number>>([
  [2, commonAssetIds],
  [3, commonAssetIds],
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function interiorToArray(interiorVersion: XcmVersion, interior: any): any[] {
  if (interior === 'here') {
    return [];
  } else if ('x1' in interior) {
    if (interiorVersion < 4) {
      return [interior.x1];
    } else {
      return [...interior.x1];
    }
  } else if ('x2' in interior) {
    return [...interior.x2];
  } else if ('x3' in interior) {
    return [...interior.x3];
  } else if ('x4' in interior) {
    return [...interior.x4];
  } else if ('x5' in interior) {
    return [...interior.x5];
  } else if ('x6' in interior) {
    return [...interior.x6];
  } else if ('x7' in interior) {
    return [...interior.x7];
  } else if ('x8' in interior) {
    return [...interior.x8];
  } else {
    throw new Error('interiorToArray: invalid interior');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function arrayToInterior(interiorVersion: XcmVersion, junctions: any[]): any {
  if (junctions.length === 0) {
    return 'here';
  } else if (junctions.length === 1) {
    if (interiorVersion < 4) {
      return {x1: junctions[0]};
    } else {
      return {x1: [...junctions]};
    }
  } else if (junctions.length === 2) {
    return {x2: [...junctions]};
  } else if (junctions.length === 3) {
    return {x3: [...junctions]};
  } else if (junctions.length === 4) {
    return {x4: [...junctions]};
  } else if (junctions.length === 5) {
    return {x5: [...junctions]};
  } else if (junctions.length === 6) {
    return {x6: [...junctions]};
  } else if (junctions.length === 7) {
    return {x7: [...junctions]};
  } else if (junctions.length === 8) {
    return {x8: [...junctions]};
  } else {
    throw new Error(
      `arrayToInterior: ${junctions.length} invalid interior array length`,
    );
  }
}

function unwrapVersionedAssetsArray(assets: VersionedAssets): VersionedAsset[] {
  if ('v2' in assets) {
    return assets.v2.map(assetV2 => ({v2: assetV2}));
  } else if ('v3' in assets) {
    return assets.v3.map(assetV3 => ({v3: assetV3}));
  } else if ('v4' in assets) {
    return assets.v4.map(assetV4 => ({v4: assetV4}));
  } else {
    throw new Error('unwrapVersionedAssetsArray: unknown XCM version');
  }
}

export function asset(id: AssetIdLookup, fun: Fungibility): AssetLookup {
  return {
    id,
    fun,
  };
}

export function location(
  parents: bigint,
  junctions: 'here' | Junction[],
): Location {
  if (junctions === 'here') {
    return {
      parents,
      interior: 'here',
    };
  }

  const interior: Interior = toInterior(junctions);

  return {
    parents,
    interior,
  };
}

export function toInterior(junctions: Junction[]): Interior {
  return arrayToInterior(CURRENT_XCM_VERSION, junctions);
}

export function toJunctions(interior: Interior): Junction[] {
  return interiorToArray(CURRENT_XCM_VERSION, interior);
}

export function concatInterior(a: Interior, b: Interior): Interior {
  const junctionsA = toJunctions(a);
  const junctionsB = toJunctions(b);

  const resultLength = junctionsA.length + junctionsB.length;
  if (resultLength > 8) {
    throw Error(
      `The concatenated interior length ${resultLength} is greater than the max length (= 8)`,
    );
  }

  return toInterior([...junctionsA, ...junctionsB]);
}

export function relativeLocaionToUniversal({
  relativeLocation,
  context,
}: {
  relativeLocation: Location;
  context: InteriorLocation;
}): InteriorLocation {
  const locationJunctions = toJunctions(relativeLocation.interior);
  const contextJunctions = toJunctions(context);

  if (relativeLocation.parents > contextJunctions.length) {
    throw new Error(
      'relativeLocaionToUniversal: not enough context to convert relative location to a universal one',
    );
  }

  const universalPrefix = contextJunctions.slice(
    Number(relativeLocation.parents),
  );
  return toInterior([...universalPrefix, ...locationJunctions]);
}

export function locationRelativeToPrefix({
  location,
  prefix,
}: {
  location: InteriorLocation;
  prefix: InteriorLocation;
}): Location {
  let locationJunctions: Junction[] = toJunctions(location);
  let prefixJunctions: Junction[] = toJunctions(prefix);

  while (
    locationJunctions.length > 0 &&
    prefixJunctions.length > 0 &&
    _.isEqual(locationJunctions[0], prefixJunctions[0])
  ) {
    locationJunctions = locationJunctions.slice(1);
    prefixJunctions = prefixJunctions.slice(1);
  }

  return {
    parents: BigInt(prefixJunctions.length),
    interior: toInterior(locationJunctions),
  };
}

function convertXcmEntityVersion<T extends Record<string, unknown>>(
  version: XcmVersion,
  entity: T,
  downgrade: (e: T) => T,
  upgrade: (e: T) => T,
) {
  const assetVersion = extractVersion(entity);
  if (version < assetVersion) {
    return convertXcmEntityVersion(
      version,
      downgrade(entity),
      downgrade,
      upgrade,
    );
  } else if (version === assetVersion) {
    return entity;
  } else {
    return convertXcmEntityVersion(
      version,
      upgrade(entity),
      downgrade,
      upgrade,
    );
  }
}

export function convertLocationVersion(
  version: XcmVersion,
  location: VersionedLocation | Location,
): VersionedLocation {
  if ('parents' in location) {
    return convertLocationVersion(version, {
      v4: location,
    });
  }

  return convertXcmEntityVersion(
    version,
    location,
    downgradeLocation,
    upgradeLocation,
  );
}

export function convertAssetIdVersion(
  version: XcmVersion,
  assetId: VersionedAssetId | AssetId,
) {
  if ('parents' in assetId) {
    return convertAssetIdVersion(version, {
      v4: assetId,
    });
  }

  return convertXcmEntityVersion(
    version,
    assetId,
    downgradeAssetId,
    upgradeAssetId,
  );
}

export function convertAssetVersion(
  version: XcmVersion,
  asset: VersionedAsset | Asset,
) {
  if ('id' in asset) {
    return convertAssetVersion(version, {
      v4: asset,
    });
  }

  return convertXcmEntityVersion(version, asset, downgradeAsset, upgradeAsset);
}

export function convertAssetsVersion(
  version: XcmVersion,
  assets: VersionedAssets | VersionedAsset[] | Asset[],
): VersionedAssets {
  if ('length' in assets) {
    const assetsVx = assets.map(asset => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assetVx = convertAssetVersion(version, asset) as any;
      return assetVx[`v${version}`];
    });

    return <VersionedAssets>{
      [`v${version}`]: assetsVx,
    };
  }

  return convertAssetsVersion(version, unwrapVersionedAssetsArray(assets));
}

export function locationIntoCurrentVersion(
  location: VersionedLocation,
): Location {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vCurrent = convertLocationVersion(CURRENT_XCM_VERSION, location) as any;
  return vCurrent[`v${CURRENT_XCM_VERSION}`];
}

export function assetIdIntoCurrentVersion(assetId: VersionedAssetId): AssetId {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vCurrent = convertAssetIdVersion(CURRENT_XCM_VERSION, assetId) as any;
  return vCurrent[`v${CURRENT_XCM_VERSION}`];
}

export function assetsIntoCurrentVersion(assets: VersionedAssets): Asset[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vCurrent = convertAssetsVersion(CURRENT_XCM_VERSION, assets) as any;
  return vCurrent[`v${CURRENT_XCM_VERSION}`];
}

export function extractVersion<T extends Record<string, unknown>>(
  versioned: T,
): XcmVersion {
  let version: XcmVersion;
  for (version = MIN_XCM_VERSION; version <= CURRENT_XCM_VERSION; ++version) {
    if (`v${version}` in versioned) {
      return version;
    }
  }

  throw new Error('extractVersion: failed to extract XCM version');
}

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

export function downgradeLocationV4(location: Location): LocationV3 {
  return {
    parents: location.parents,
    interior: downgradeInteriorV4(location.interior),
  };
}

export function upgradeLocationV3(location: LocationV3): LocationV4 {
  return {
    parents: location.parents,
    interior: upgradeInteriorV3(location.interior),
  };
}

export function downgradeLocationV3(location: LocationV3): LocationV2 {
  return {
    parents: location.parents,
    interior: downgradeInteriorV3(location.interior),
  };
}

export function upgradeLocationV2(location: LocationV2): LocationV3 {
  return {
    parents: location.parents,
    interior: upgradeInteriorV2(location.interior),
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

export function upgradeInteriorV3(interior: InteriorV3): InteriorV4 {
  if (typeof interior === 'object' && 'x1' in interior) {
    return {
      x1: [interior.x1],
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

function checkByteDataLength(
  junctionName: string,
  expectedLength: number,
  actualLength: number | null,
) {
  if (actualLength === null) {
    throw new JunctionValidationError(
      junctionName,
      `${junctionName} must be hex string`,
    );
  }

  if (expectedLength !== actualLength) {
    throw new JunctionValidationError(
      junctionName,
      `${junctionName} has incorrect length: expected ${expectedLength} bytes, got ${actualLength} bytes`,
    );
  }
}

function hexToUint8Array(junctionName: string, hex: string): Uint8Array {
  try {
    return hexToU8a(hex);
  } catch (error) {
    throw new JunctionValidationError(
      junctionName,
      `failed to decode ${junctionName} hex string to Uint8Array.`,
      error as Error,
    );
  }
}

function checkNumberBitSize(
  junctionName: string,
  expectedBitSize: 8 | 32 | 64 | 128,
  actualNumber: bigint,
) {
  if (actualNumber < 0) {
    throw new JunctionValidationError(
      junctionName,
      `${junctionName} is less than 0, expected positive integer.`,
    );
  }
  let expectedMaxNumber: bigint;
  switch (expectedBitSize) {
    case 8:
      expectedMaxNumber = MAX_UINT8;
      break;
    case 32:
      expectedMaxNumber = MAX_UINT32;
      break;
    case 64:
      expectedMaxNumber = MAX_UINT64;
      break;
    case 128:
      expectedMaxNumber = MAX_UINT128;
      break;
    default:
      throw new Error(`Unknown bit size for ${junctionName}`);
  }
  if (actualNumber > expectedMaxNumber) {
    throw new JunctionValidationError(
      junctionName,
      `${junctionName} is greater than u${expectedBitSize}`,
    );
  }
}

function invalidJunctionObj(objName: string, obj: unknown) {
  throw new JunctionValidationError(
    `not a V${CURRENT_XCM_VERSION} ${objName}`,
    `invalid object: ${stringify(obj)}`,
  );
}

function checkUnitJunctionObj<T>(
  objName: string,
  obj: T,
  validUnitVariants: string[],
) {
  const isValid = validUnitVariants.find(variant => variant === obj);
  if (isValid === undefined) {
    invalidJunctionObj(objName, obj);
  }
}

function sanitizeNetworkId(
  network: NetworkId | null | undefined,
  junctionName: string,
) {
  if (typeof network === 'object' && network !== null) {
    if ('byGenesis' in network) {
      if (typeof network.byGenesis === 'string') {
        network.byGenesis = hexToUint8Array(
          `${junctionName}.networkId.byGenesis`,
          network.byGenesis,
        );
      }
      checkByteDataLength(
        `${junctionName}.network.byGenesis`,
        32,
        network.byGenesis.length,
      );
    } else if ('byFork' in network) {
      checkNumberBitSize(
        `${junctionName}.network.byFork.blockNumber`,
        64,
        network.byFork.blockNumber,
      );
      if (typeof network.byFork.blockHash === 'string') {
        network.byFork.blockHash = hexToUint8Array(
          `${junctionName}.byFork.blockHash`,
          network.byFork.blockHash,
        );
      }
      checkByteDataLength(
        `${junctionName}.network.byFork.blockHash`,
        32,
        network.byFork.blockHash.length,
      );
    } else if ('ethereum' in network) {
      checkNumberBitSize(
        `${junctionName}.network.ethereum.chainId`,
        64,
        network.ethereum.chainId,
      );
    } else {
      invalidJunctionObj(`${junctionName}.network`, network);
    }
  } else {
    if (network != null) {
      checkUnitJunctionObj(`${junctionName}.network`, network, [
        ...networkIdOrder.get(CURRENT_XCM_VERSION)!.keys(),
      ]);
    }
  }
}

function sanitizeFraction(fraction: Fraction, junctionName: string) {
  checkNumberBitSize(`${junctionName}.nom`, 32, fraction.nom);
  checkNumberBitSize(`${junctionName}.denom`, 32, fraction.denom);
}

function sanitizeBodyId(bodyId: BodyId) {
  if (typeof bodyId === 'object') {
    if ('moniker' in bodyId) {
      if (typeof bodyId.moniker === 'string') {
        bodyId.moniker = hexToUint8Array('bodyId.moniker', bodyId.moniker);
      }
      checkByteDataLength('plurality.id.moniker', 4, bodyId.moniker.length);
    } else if ('index' in bodyId) {
      checkNumberBitSize('junction.plurality.id.index', 32, bodyId.index);
    } else {
      invalidJunctionObj('plurality.id', bodyId);
    }
  } else {
    checkUnitJunctionObj('plurality.id', bodyId, [
      ...bodyIdOrder.get(CURRENT_XCM_VERSION)!.keys(),
    ]);
  }
}

function sanitizeBodyPart(bodyPart: BodyPart) {
  if (typeof bodyPart === 'object') {
    if ('members' in bodyPart) {
      checkNumberBitSize(
        'plurality.bodyPart.members',
        32,
        bodyPart.members.count,
      );
    } else if ('fraction' in bodyPart) {
      sanitizeFraction(bodyPart.fraction, 'plurality.bodyPart.fraction');
    } else if ('atLeastProportion' in bodyPart) {
      sanitizeFraction(
        bodyPart.atLeastProportion,
        'plurality.bodyPart.atLeastProportion',
      );
    } else if ('moreThanProportion' in bodyPart) {
      sanitizeFraction(
        bodyPart.moreThanProportion,
        'plurality.bodyPart.moreThanProportion',
      );
    } else {
      invalidJunctionObj('plurality.bodyPart', bodyPart);
    }
  } else if (bodyPart !== 'voice') {
    invalidJunctionObj('plurality.bodyPart', bodyPart);
  }
}

export function sanitizeJunction(junction: Junction) {
  if (typeof junction === 'object') {
    if ('parachain' in junction) {
      checkNumberBitSize('parachain', 32, junction.parachain);
    } else if ('accountId32' in junction) {
      try {
        junction.accountId32.id = decodeAddress(junction.accountId32.id);
      } catch (error) {
        throw new JunctionValidationError(
          'accountId32',
          `failed to decode AccountId32: ${junction.accountId32.id}.`,
          error as Error,
        );
      }
      // A necessary check, because the decodeAddress function
      // accepts a hex-string of any length without raising an error.
      checkByteDataLength('accountId32.id', 32, junction.accountId32.id.length);

      sanitizeNetworkId(junction.accountId32.network, 'accountId32');
    } else if ('accountIndex64' in junction) {
      checkNumberBitSize(
        'accountIndex64.index',
        64,
        junction.accountIndex64.index,
      );
      sanitizeNetworkId(junction.accountIndex64.network, 'accountIndex64');
    } else if ('accountKey20' in junction) {
      if (typeof junction.accountKey20.key === 'string') {
        junction.accountKey20.key = hexToUint8Array(
          'accountKey20.key',
          junction.accountKey20.key,
        );
      }
      checkByteDataLength(
        'accountKey20.id',
        20,
        junction.accountKey20.key.length,
      );
      sanitizeNetworkId(junction.accountKey20.network, 'accountKey20');
    } else if ('palletInstance' in junction) {
      checkNumberBitSize('palletInstance', 8, junction.palletInstance);
    } else if ('generalIndex' in junction) {
      checkNumberBitSize('generalIndex', 128, junction.generalIndex);
    } else if ('generalKey' in junction) {
      if (typeof junction.generalKey.data === 'string') {
        junction.generalKey.data = hexToUint8Array(
          'generalKey',
          junction.generalKey.data,
        );
      }
      checkNumberBitSize('generalKey.length', 8, junction.generalKey.length);
      checkByteDataLength(
        'generalKey.data',
        32,
        junction.generalKey.data.length,
      );
    } else if ('plurality' in junction) {
      sanitizeBodyId(junction.plurality.id);
      sanitizeBodyPart(junction.plurality.part);
    } else if ('globalConsensus' in junction) {
      sanitizeNetworkId(junction.globalConsensus, 'globalConsensus');
    } else {
      invalidJunctionObj('junction', junction);
    }
  } else {
    checkUnitJunctionObj('junction', junction, ['onlyChild']);
  }
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

function downgradeBodyIdV3(bodyId: BodyIdV3): BodyIdV2 {
  if (typeof bodyId === 'object' && 'moniker' in bodyId) {
    return {
      named: bodyId.moniker,
    };
  } else {
    return bodyId;
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

function validateHexStringType(
  fieldName: string,
  ...fields: (string | Uint8Array)[]
): Uint8Array[] {
  fields.map(el => {
    if (typeof el === 'string') {
      throw new Error(`Invalid ${fieldName} type, please use sanitizeAssets.`);
    }
  });
  return fields as Uint8Array[];
}

function saturatingAdd(left: bigint, right: bigint, max: bigint): bigint {
  const res = left + right;
  return res > max ? max : res;
}

function checkBigIntDiff(diff: bigint) {
  if (diff === 0n) {
    return 0;
  } else {
    return diff > 0n ? 1 : -1;
  }
}

function getObjectType<T extends Record<string, unknown>>(
  obj: T | string,
): string {
  return typeof obj === 'string' ? obj : Object.keys(obj)[0];
}

function compareObjectTypes<T extends Record<string, unknown>>(
  xcmVersion: XcmVersion,
  obj1: T | string,
  obj2: T | string,
  order: Map<XcmVersion, Map<string, number>>,
  objectName: string,
) {
  const [typeA, typeB] = [getObjectType(obj1), getObjectType(obj2)];
  if (typeA !== typeB) {
    const typeAName = order.get(xcmVersion)!.get(typeA),
      typeBName = order.get(xcmVersion)!.get(typeB);
    if (typeAName === undefined || typeBName === undefined) {
      throw new Error(`compareObjectTypes: unknown ${objectName} type`);
    }
    return typeAName - typeBName;
  }
  return 0;
}

function compareNonFungibleInstance(
  nft1: AnyAssetInstance,
  nft2: AnyAssetInstance,
  xcmVersion: XcmVersion,
) {
  const typeComparison = compareObjectTypes(
    xcmVersion,
    nft1,
    nft2,
    assetInstanceOrder,
    'assetInstance',
  );
  if (typeComparison !== 0) {
    return typeComparison;
  }

  if (typeof nft1 === 'object' && typeof nft2 === 'object') {
    if ('index' in nft1 && 'index' in nft2) {
      return checkBigIntDiff(nft1.index - nft2.index);
    }

    if ('array4' in nft1 && 'array4' in nft2) {
      [nft1.array4, nft2.array4] = validateHexStringType(
        'nonFungible.array4',
        nft1.array4,
        nft2.array4,
      );
      return compareUInt8Array(nft1.array4, nft2.array4);
    }

    if ('array8' in nft1 && 'array8' in nft2) {
      [nft1.array8, nft2.array8] = validateHexStringType(
        'nonFungible.array8',
        nft1.array8,
        nft2.array8,
      );
      return compareUInt8Array(nft1.array8, nft2.array8);
    }

    if ('array16' in nft1 && 'array16' in nft2) {
      [nft1.array16, nft2.array16] = validateHexStringType(
        'nonFungible.array16',
        nft1.array16,
        nft2.array16,
      );
      return compareUInt8Array(nft1.array16, nft2.array16);
    }

    if ('array32' in nft1 && 'array32' in nft2) {
      [nft1.array32, nft2.array32] = validateHexStringType(
        'nonFungible.array32',
        nft1.array32,
        nft2.array32,
      );
      return compareUInt8Array(nft1.array32, nft2.array32);
    }

    if ('blob' in nft1 && 'blob' in nft2) {
      [nft1.blob, nft2.blob] = validateHexStringType(
        'nonFungible.blob',
        nft1.blob,
        nft2.blob,
      );
      return compareUInt8Array(nft1.blob, nft2.blob);
    }
  }

  throw new Error(
    'compareNonFungibleInstance: cannot compare nonFungible instance, unknown content',
  );
}

function compareNetwork(
  network1: AnyNetworkId | undefined | null,
  network2: AnyNetworkId | undefined | null,
  xcmVersion: XcmVersion,
) {
  if (!network1) return network2 ? -1 : 0;
  if (!network2) return 1;

  return compareNetworkId(network1, network2, xcmVersion);
}

function compareNetworkId(
  networkId1: AnyNetworkId,
  networkId2: AnyNetworkId,
  xcmVersion: XcmVersion,
): number {
  const typeComparison = compareObjectTypes(
    xcmVersion,
    networkId1,
    networkId2,
    networkIdOrder,
    'networkId',
  );
  if (typeComparison !== 0) {
    return typeComparison;
  }

  if (typeof networkId1 === 'object' && typeof networkId2 === 'object') {
    if ('byGenesis' in networkId1 && 'byGenesis' in networkId2) {
      [networkId1.byGenesis, networkId2.byGenesis] = validateHexStringType(
        'networkId.byGenesis',
        networkId1.byGenesis,
        networkId2.byGenesis,
      );
      return compareUInt8Array(networkId1.byGenesis, networkId2.byGenesis);
    }
    if ('byFork' in networkId1 && 'byFork' in networkId2) {
      [networkId1.byFork.blockHash, networkId2.byFork.blockHash] =
        validateHexStringType(
          'networkId.byFork.blockHash',
          networkId1.byFork.blockHash,
          networkId2.byFork.blockHash,
        );
      const blockNumberDiff = checkBigIntDiff(
        networkId1.byFork.blockNumber - networkId2.byFork.blockNumber,
      );
      return blockNumberDiff !== 0
        ? blockNumberDiff
        : compareUInt8Array(
            networkId1.byFork.blockHash,
            networkId2.byFork.blockHash,
          );
    }
    if ('ethereum' in networkId1 && 'ethereum' in networkId2) {
      return checkBigIntDiff(
        networkId1.ethereum.chainId - networkId2.ethereum.chainId,
      );
    }
    if ('named' in networkId1 && 'named' in networkId2) {
      [networkId1.named, networkId2.named] = validateHexStringType(
        'networkId.named',
        networkId1.named,
        networkId2.named,
      );
      return compareUInt8Array(networkId1.named, networkId2.named);
    }
  }

  throw new Error(
    'compareNetworkId: cannot compare networkId object, unknown content',
  );
}

function compareBodyId(
  bodyId1: AnyBodyId,
  bodyId2: AnyBodyId,
  xcmVersion: XcmVersion,
): number {
  const typeComparison = compareObjectTypes(
    xcmVersion,
    bodyId1,
    bodyId2,
    bodyIdOrder,
    'bodyId',
  );
  if (typeComparison !== 0) {
    return typeComparison;
  }

  if (typeof bodyId1 === 'object' && typeof bodyId2 === 'object') {
    if ('named' in bodyId1 && 'named' in bodyId2) {
      [bodyId1.named, bodyId2.named] = validateHexStringType(
        'bodyId1.named',
        bodyId1.named,
        bodyId2.named,
      );
      return compareUInt8Array(bodyId1.named, bodyId2.named);
    }
    if ('moniker' in bodyId1 && 'moniker' in bodyId2) {
      [bodyId1.moniker, bodyId2.moniker] = validateHexStringType(
        'bodyId1.moniker',
        bodyId1.moniker,
        bodyId2.moniker,
      );
      return compareUInt8Array(bodyId1.moniker, bodyId2.moniker);
    }
    if ('index' in bodyId1 && 'index' in bodyId2) {
      return checkBigIntDiff(bodyId1.index - bodyId2.index);
    }
  }

  throw new Error(
    'compareBodyId: cannot compare bodyId object, unknown content',
  );
}

function compareFraction(fraction1: Fraction, fraction2: Fraction) {
  if (fraction1.nom !== fraction2.nom) {
    return checkBigIntDiff(fraction1.nom - fraction2.nom);
  }
  return checkBigIntDiff(fraction1.denom - fraction2.denom);
}

function compareBodyPart(
  bodyPart1: BodyPart,
  bodyPart2: BodyPart,
  xcmVersion: XcmVersion,
): number {
  const typeComparison = compareObjectTypes(
    xcmVersion,
    bodyPart1,
    bodyPart2,
    bodyPartOrder,
    'bodyPart',
  );
  if (typeComparison !== 0) {
    return typeComparison;
  }

  if (typeof bodyPart1 === 'object' && typeof bodyPart2 === 'object') {
    if ('members' in bodyPart1 && 'members' in bodyPart2) {
      return checkBigIntDiff(bodyPart1.members.count - bodyPart2.members.count);
    }

    if ('fraction' in bodyPart1 && 'fraction' in bodyPart2) {
      return compareFraction(bodyPart1.fraction, bodyPart2.fraction);
    }

    if ('atLeastProportion' in bodyPart1 && 'atLeastProportion' in bodyPart2) {
      return compareFraction(
        bodyPart1.atLeastProportion,
        bodyPart2.atLeastProportion,
      );
    }

    if (
      'moreThanProportion' in bodyPart1 &&
      'moreThanProportion' in bodyPart2
    ) {
      return compareFraction(
        bodyPart1.moreThanProportion,
        bodyPart2.moreThanProportion,
      );
    }
  }

  throw new Error(
    'compareBodyPart: cannot compare fraction object, unknown content',
  );
}

function compareJunction(
  xcmVersion: XcmVersion,
  junction1: AnyJunction,
  junction2: AnyJunction,
): number {
  const typeComparison = compareObjectTypes(
    xcmVersion,
    junction1,
    junction2,
    junctionOrder,
    'junction',
  );
  if (typeComparison !== 0) {
    return typeComparison;
  }

  if (typeof junction1 === 'object' && typeof junction2 === 'object') {
    if ('parachain' in junction1 && 'parachain' in junction2) {
      return checkBigIntDiff(junction1.parachain - junction2.parachain);
    }
    if ('accountId32' in junction1 && 'accountId32' in junction2) {
      [junction1.accountId32.id, junction2.accountId32.id] =
        validateHexStringType(
          'accountId32.id',
          junction1.accountId32.id,
          junction2.accountId32.id,
        );
      const networkComparison = compareNetwork(
        junction1.accountId32.network,
        junction2.accountId32.network,
        xcmVersion,
      );

      return networkComparison !== 0
        ? networkComparison
        : compareUInt8Array(junction1.accountId32.id, junction2.accountId32.id);
    }

    if ('accountIndex64' in junction1 && 'accountIndex64' in junction2) {
      const networkComparison = compareNetwork(
        junction1.accountIndex64.network,
        junction2.accountIndex64.network,
        xcmVersion,
      );

      return networkComparison !== 0
        ? networkComparison
        : checkBigIntDiff(
            junction1.accountIndex64.index - junction2.accountIndex64.index,
          );
    }

    if ('accountKey20' in junction1 && 'accountKey20' in junction2) {
      [junction1.accountKey20.key, junction2.accountKey20.key] =
        validateHexStringType(
          'accountKey20.key',
          junction1.accountKey20.key,
          junction2.accountKey20.key,
        );
      const networkComparison = compareNetwork(
        junction1.accountKey20.network,
        junction2.accountKey20.network,
        xcmVersion,
      );

      return networkComparison !== 0
        ? networkComparison
        : compareUInt8Array(
            junction1.accountKey20.key,
            junction2.accountKey20.key,
          );
    }

    if ('palletInstance' in junction1 && 'palletInstance' in junction2) {
      return checkBigIntDiff(
        junction1.palletInstance - junction2.palletInstance,
      );
    }

    if ('generalIndex' in junction1 && 'generalIndex' in junction2) {
      return checkBigIntDiff(junction1.generalIndex - junction2.generalIndex);
    }

    if ('generalKey' in junction1 && 'generalKey' in junction2) {
      let key1 = new Uint8Array(),
        key2 = new Uint8Array();

      if (
        typeof junction1.generalKey === 'string' &&
        typeof junction2.generalKey === 'string'
      ) {
        [junction1.generalKey, junction2.generalKey] = validateHexStringType(
          'generalKey',
          junction1.generalKey,
          junction2.generalKey,
        );
        key1 = junction1.generalKey;
        key2 = junction2.generalKey;
      } else if (
        typeof junction1.generalKey === 'object' &&
        typeof junction2.generalKey === 'object'
      ) {
        if ('data' in junction1.generalKey && 'data' in junction2.generalKey) {
          [junction1.generalKey.data, junction2.generalKey.data] =
            validateHexStringType(
              'generalKey',
              junction1.generalKey.data,
              junction2.generalKey.data,
            );
          key1 = junction1.generalKey.data;
          key2 = junction2.generalKey.data;
        }
      }
      return compareUInt8Array(key1, key2);
    }

    if ('plurality' in junction1 && 'plurality' in junction2) {
      const bodyIdComparisonResult = compareBodyId(
        junction1.plurality.id,
        junction2.plurality.id,
        xcmVersion,
      );
      return bodyIdComparisonResult !== 0
        ? bodyIdComparisonResult
        : compareBodyPart(
            junction1.plurality.part,
            junction2.plurality.part,
            xcmVersion,
          );
    }

    if ('globalConsensus' in junction1 && 'globalConsensus' in junction2) {
      return compareNetwork(
        junction1.globalConsensus,
        junction2.globalConsensus,
        xcmVersion,
      );
    }
  }
  throw new Error(
    'compareJunction: cannot compare junction object, unknown content',
  );
}

function compareInteriors(
  xcmVersion: XcmVersion,
  interior1: AnyInterior,
  interior2: AnyInterior,
): number {
  if (typeof interior1 === 'object' && typeof interior2 === 'object') {
    const junctions1 = interiorToArray(xcmVersion, interior1);
    const junctions2 = interiorToArray(xcmVersion, interior2);

    if (junctions1.length !== junctions2.length) {
      return junctions1.length - junctions2.length;
    }

    for (let i = 0; i < junctions1.length; i++) {
      const comparisonResult = compareJunction(
        xcmVersion,
        junctions1[i],
        junctions2[i],
      );
      if (comparisonResult !== 0) {
        return comparisonResult;
      }
    }
  }

  if (interior1 === 'here' && interior2 === 'here') {
    return 0;
  }

  if (interior1 === 'here') {
    return -1;
  }

  if (interior2 === 'here') {
    return 1;
  }
  throw new Error(
    'compareInteriors: cannot compare interior object, unknown content',
  );
}

function compareAssetId(
  assetId1: AnyAssetId,
  assetId2: AnyAssetId,
  xcmVersion: XcmVersion,
) {
  if (xcmVersion === 4) {
    return compareAssetIdV4(
      xcmVersion,
      assetId1 as AssetIdV4,
      assetId2 as AssetIdV4,
    );
  }
  if (xcmVersion < 4) {
    return compareAssetIdV3V2(
      xcmVersion,
      assetId1 as AssetIdV3 | AssetIdV2,
      assetId2 as AssetIdV3 | AssetIdV2,
    );
  }

  throw new Error('compareAssetId: unknown XCM version');
}

function compareAssetIdV4(
  xcmVersion: XcmVersion,
  assetId1: AssetIdV4,
  assetId2: AssetIdV4,
): number {
  const parentsCompareResult = checkBigIntDiff(
    assetId1.parents - assetId2.parents,
  );
  return parentsCompareResult !== 0
    ? parentsCompareResult
    : compareInteriors(xcmVersion, assetId1.interior, assetId2.interior);
}

function compareAssetIdV3V2(
  xcmVersion: XcmVersion,
  assetId1: AssetIdV3 | AssetIdV2,
  assetId2: AssetIdV3 | AssetIdV2,
): number {
  const typeComparison = compareObjectTypes(
    xcmVersion,
    assetId1,
    assetId2,
    assetIdOrder,
    'assetId',
  );
  if (typeComparison !== 0) {
    return typeComparison;
  }

  if ('abstract' in assetId1 && 'abstract' in assetId2) {
    return compareUInt8Array(assetId1.abstract, assetId2.abstract);
  }

  if ('concrete' in assetId1 && 'concrete' in assetId2) {
    const parentsCompareResult = checkBigIntDiff(
      assetId1.concrete.parents - assetId2.concrete.parents,
    );
    return parentsCompareResult !== 0
      ? parentsCompareResult
      : compareInteriors(
          xcmVersion,
          assetId1.concrete.interior,
          assetId2.concrete.interior,
        );
  }

  throw new Error(
    'compareAssetIdV3V2: cannot compare assetId object, unknown content',
  );
}

function sortAssets(xcmVersion: XcmVersion, assets: VersionedAssets) {
  const sortFunction = (a: AnyAsset, b: AnyAsset) => {
    const assetIdCompareResult = compareAssetId(a.id, b.id, xcmVersion);
    return assetIdCompareResult === 0
      ? compareFungibility(a, b, xcmVersion)
      : assetIdCompareResult;
  };

  if ('v4' in assets) {
    assets.v4.sort(sortFunction);
  } else if ('v3' in assets) {
    assets.v3.sort(sortFunction);
  } else if ('v2' in assets) {
    assets.v2.sort(sortFunction);
  } else {
    throw new Error('sortAssets: unknown XCM version');
  }
}

function compareFungibility(
  asset1: AnyAsset,
  asset2: AnyAsset,
  xcmVersion: XcmVersion,
) {
  if ('fungible' in asset1.fun && 'fungible' in asset2.fun) {
    return checkBigIntDiff(asset1.fun.fungible - asset2.fun.fungible);
  }

  if ('nonFungible' in asset1.fun && 'nonFungible' in asset2.fun) {
    return compareNonFungibleInstance(
      asset1.fun.nonFungible,
      asset2.fun.nonFungible,
      xcmVersion,
    );
  }
  if ('fungible' in asset1.fun && 'nonFungible' in asset2.fun) {
    return -1;
  }
  if ('nonFungible' in asset1.fun && 'fungible' in asset2.fun) {
    return 1;
  }

  throw new Error(
    'compareFungibility: cannot compare fungibility, unknown content',
  );
}

function deduplicateSortedAssets(
  versionedAssets: Array<AnyAsset>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compareFn: (a: any, b: any, version: XcmVersion) => number,
  xcmVersion: XcmVersion,
): Array<AnyAsset> {
  const res: Array<AnyAsset> = [];

  if (versionedAssets.length === 0) {
    return res;
  }

  const iter = versionedAssets.values();
  let last: AnyAsset = iter.next().value!;

  for (const current of iter) {
    if (compareFn(last, current, xcmVersion) === 0) {
      if ('fungible' in last.fun && 'fungible' in current.fun) {
        last.fun = fungible(
          saturatingAdd(last.fun.fungible, current.fun.fungible, MAX_UINT64),
        );
        continue;
      }
      if ('nonFungible' in last.fun && 'nonFungible' in current.fun) {
        if (
          compareNonFungibleInstance(
            last.fun.nonFungible,
            current.fun.nonFungible,
            xcmVersion,
          ) === 0
        ) {
          continue;
        }
      }
    }
    res.push(last);
    last = current;
  }

  res.push(last);
  return res;
}

export function sortAndDeduplicateAssets(assets: VersionedAssets) {
  const xcmVersion = extractVersion(assets);
  sortAssets(xcmVersion, assets);

  if ('v4' in assets) {
    assets.v4 = deduplicateSortedAssets(
      assets.v4,
      compareAssetId,
      xcmVersion,
    ) as AssetV4[];
  } else if ('v3' in assets) {
    assets.v3 = deduplicateSortedAssets(
      assets.v3,
      compareAssetId,
      xcmVersion,
    ) as AssetV3[];
  } else if ('v2' in assets) {
    assets.v2 = deduplicateSortedAssets(
      assets.v2,
      compareAssetId,
      xcmVersion,
    ) as AssetV2[];
  } else {
    throw new Error('sortAndDeduplicateAssets: unknown XCM version');
  }
}

export function isChainUniversalLocation(location: InteriorLocation): boolean {
  const locationArray: Junction[] = interiorToArray(
    CURRENT_XCM_VERSION,
    location,
  );

  if (locationArray.length === 0) {
    return false;
  }

  const firstJunction = locationArray[0];
  const startsWithGlobalConsensus =
    typeof firstJunction === 'object' && 'globalConsensus' in firstJunction;

  if (!startsWithGlobalConsensus) {
    return false;
  }

  switch (locationArray.length) {
    case 1:
      return true;

    case 2: {
      const secondJunction = locationArray[1];
      const parachainJunctionIsSecond =
        typeof secondJunction === 'object' && 'parachain' in secondJunction;

      return parachainJunctionIsSecond;
    }

    default:
      return false;
  }
}

export function relaychainUniversalLocation(
  networkId: NetworkId,
): InteriorLocation {
  return {
    x1: [{globalConsensus: networkId}],
  };
}

export function parachainUniveralLocation(
  networkId: NetworkId,
  paraId: bigint,
): InteriorLocation {
  return {
    x2: [{globalConsensus: networkId}, {parachain: paraId}],
  };
}

export function fungible(amount: bigint) {
  return {
    fungible: amount,
  };
}

function hexByteLength(text: string): bigint | null {
  const hexMatch = text.match(/^0x(?<numberPart>[0-9a-fA-F]*)$/i);
  return hexMatch
    ? BigInt(Math.ceil(hexMatch.groups!.numberPart.length / 2))
    : null;
}

function textByteLength(text: string): bigint {
  const byteLength = hexByteLength(text);
  return byteLength !== null ? byteLength : BigInt(text.length);
}

export function nonfungible(id: bigint | string) {
  let assetInstance;
  if (typeof id === 'bigint') {
    assetInstance = {
      index: id,
    };
  } else {
    const byteLength = textByteLength(id);

    switch (byteLength) {
      case 4n:
        assetInstance = {
          array4: id,
        };
        break;

      case 8n:
        assetInstance = {
          array8: id,
        };
        break;

      case 16n:
        assetInstance = {
          array16: id,
        };
        break;

      case 32n:
        assetInstance = {
          array32: id,
        };
        break;

      default:
        throw new Error(
          `nonfungible: invalid nonfungible id byte length: ${byteLength} (the id: ${id})`,
        );
    }
  }

  return {
    nonFungible: assetInstance,
  };
}

export function findAssetById<Id extends AnyAssetId, Asset extends AnyAsset>(
  xcmVersion: XcmVersion,
  assetId: Id,
  assets: Asset[],
): [Asset, number] | undefined {
  const assetIndex = findAssetIdIndex(
    xcmVersion,
    assetId,
    assets.map(asset => asset.id),
  );
  if (assetIndex !== undefined) {
    return [assets[assetIndex], assetIndex];
  }
}

export function findFeeAssetById(
  xcmVersion: XcmVersion,
  feeAssetId: AssetId,
  assets: Asset[],
): [FungibleAsset, number] | undefined {
  const result = findAssetById(xcmVersion, feeAssetId, assets);
  if (result) {
    const [asset, assetIndex] = result;

    if ('nonFungible' in asset.fun) {
      throw new Error(
        'findFeeAssetById: the fee asset is mentioned in the list of assets as a non-fungible. The fee asset can not be an NFT',
      );
    }

    const feeAsset = {
      id: asset.id,
      fun: asset.fun,
    };

    return [feeAsset, assetIndex];
  }
}

export function findAssetIdIndex<Id extends AnyAssetId>(
  xcmVersion: XcmVersion,
  feeAssetId: Id,
  assetIds: Id[],
) {
  const index = assetIds.findIndex(
    assetId => compareAssetId(assetId, feeAssetId, xcmVersion) === 0,
  );
  if (index !== -1) {
    return index;
  }
}

function compareUInt8Array(array1: Uint8Array, array2: Uint8Array): number {
  if (array1.length !== array2.length) return array1.length - array2.length;
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return array1[i] > array2[i] ? 1 : -1;
    }
  }
  return 0;
}
