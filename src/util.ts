import { decodeAddress } from '@polkadot/keyring';
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
  Fungibility,
  AssetLookup,
  Interior,
  MIN_XCM_VERSION,
  BodyPart,
  Fraction,
  AssetIdLookup,
  BodyId,
} from './xcmtypes';
import _ from 'lodash';
import { JunctionValidationError } from './errors';
import { stringify, u8aToHex } from '@polkadot/util';

const MAX_UINT8 = 2n ** 8n - 1n;
const MAX_UINT32 = 2n ** 32n - 1n;
const MAX_UINT64 = 2n ** 64n - 1n;
const MAX_UINT128 = 2n ** 128n - 1n;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function interiorToArray(interiorVersion: XcmVersion, interior: any): any[] {
  if (interior == 'here') {
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
  if (junctions.length == 0) {
    return 'here';
  } else if (junctions.length == 1) {
    if (interiorVersion < 4) {
      return { x1: junctions[0] };
    } else {
      return { x1: [...junctions] };
    }
  } else if (junctions.length == 2) {
    return { x2: [...junctions] };
  } else if (junctions.length == 3) {
    return { x3: [...junctions] };
  } else if (junctions.length == 4) {
    return { x4: [...junctions] };
  } else if (junctions.length == 5) {
    return { x5: [...junctions] };
  } else if (junctions.length == 6) {
    return { x6: [...junctions] };
  } else if (junctions.length == 7) {
    return { x7: [...junctions] };
  } else if (junctions.length == 8) {
    return { x8: [...junctions] };
  } else {
    throw new Error(
      `arrayToInterior - ${junctions.length} invalid interior array length`
    );
  }
}

export function asset(
  id: AssetIdLookup,
  fun: Fungibility
): AssetLookup {
  return {
    id,
    fun
  };
}

export function location(
  parents: bigint,
  junctions: 'here' | Junction[]
): Location {
  if (junctions == 'here') {
    return {
      parents,
      interior: 'here'
    };
  }

  const interior: Interior = toInterior(junctions);

  return {
    parents,
    interior
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
      `The concatenated interior length ${resultLength} is greater than the max length (= 8)`
    );
  }

  return toInterior([...junctionsA, ...junctionsB]);
}

export function relativeLocaionToUniversal({
  relativeLocation,
  context
}: {
  relativeLocation: Location;
  context: InteriorLocation;
}): InteriorLocation {
  const locationJunctions = toJunctions(relativeLocation.interior);
  const contextJunctions = toJunctions(context);

  if (relativeLocation.parents > contextJunctions.length) {
    throw new Error(
      'Not enough context to convert relative location to a universal one'
    );
  }

  const universalPrefix = contextJunctions.slice(Number(relativeLocation.parents));
  return toInterior([...universalPrefix, ...locationJunctions]);
}

export function locationRelativeToPrefix({
  location,
  prefix
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
    interior: toInterior(locationJunctions)
  };
}

export function convertAssetVersion(
  version: XcmVersion,
  asset: VersionedAsset | Asset
) {
  if ('id' in asset) {
    return convertAssetVersion(version, <VersionedAsset>{
      [`v${CURRENT_XCM_VERSION}`]: asset
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assetVx = convertAssetVersion(version, asset) as any;
    return assetVx[`v${version}`];
  });

  return <VersionedAssets>{
    [`v${version}`]: assetsVx
  };
}

export function locationIntoCurrentVersion(
  location: VersionedLocation
): Location {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vCurrent = convertLocationVersion(CURRENT_XCM_VERSION, location) as any;
  return vCurrent[`v${CURRENT_XCM_VERSION}`];
}

export function convertLocationVersion(
  version: XcmVersion,
  location: VersionedLocation | Location
): VersionedLocation {
  if ('parents' in location) {
    return convertLocationVersion(version, <VersionedLocation>{
      [`v${CURRENT_XCM_VERSION}`]: location
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
    if (`v${version}` in versioned) {
      return version;
    }
  }

  throw new Error('extractVersion - failed to extract XCM version');
}

export function downgradeAsset(asset: VersionedAsset): VersionedAsset {
  if ('v2' in asset) {
    throw new Error('AssetV2 cannot be downgraded');
  } else if ('v3' in asset) {
    let assetV2: AssetV2;

    if ('concrete' in asset.v3.id) {
      assetV2 = {
        id: { concrete: downgradeLocationV3(asset.v3.id.concrete) },
        fun: asset.v3.fun
      };
    } else {
      assetV2 = {
        id: asset.v3.id,
        fun: asset.v3.fun
      };
    }

    return { v2: assetV2 };
  } else if ('v4' in asset) {
    return {
      v3: {
        id: { concrete: downgradeLocationV4(asset.v4.id) },
        fun: asset.v4.fun
      }
    };
  } else {
    throw new Error('downgradeAsset: unknown XCM version');
  }
}

export function upgradeAsset(asset: VersionedAsset): VersionedAsset {
  if ('v2' in asset) {
    const funV2 = asset.v2.fun;
    let funV3: FungibilityV3;

    if ('nonFungible' in funV2) {
      if (typeof funV2.nonFungible == 'object' && 'blob' in funV2.nonFungible) {
        throw new Error('Blob AssetInstance cannot be upgraded to V3');
      }

      funV3 = {
        nonFungible: funV2.nonFungible
      };
    } else {
      funV3 = funV2;
    }

    let assetV3: AssetV3;
    if ('concrete' in asset.v2.id) {
      assetV3 = {
        id: { concrete: upgradeLocationV2(asset.v2.id.concrete) },
        fun: funV3
      };
    } else {
      assetV3 = {
        id: asset.v2.id,
        fun: funV3
      };
    }

    return { v3: assetV3 };
  } else if ('v3' in asset) {
    if ('concrete' in asset.v3.id) {
      return {
        v4: {
          id: upgradeLocationV3(asset.v3.id.concrete),
          fun: asset.v3.fun
        }
      };
    } else {
      throw new Error('Abstract AssetId cannot be upgraded to V4');
    }
  } else if ('v4' in asset) {
    throw new Error('AssetV4 cannot be upgraded');
  } else {
    throw new Error('upgradeAsset: unknown XCM version');
  }
}

export function downgradeLocation(
  location: VersionedLocation
): VersionedLocation {
  if ('v2' in location) {
    throw new Error('LocationV2 cannot be downgraded');
  } else if ('v3' in location) {
    return { v2: downgradeLocationV3(location.v3) };
  } else if ('v4' in location) {
    return { v3: downgradeLocationV4(location.v4) };
  } else {
    throw new Error('downgradeLocation: unknown XCM version');
  }
}

export function upgradeLocation(
  location: VersionedLocation
): VersionedLocation {
  if ('v2' in location) {
    return { v3: upgradeLocationV2(location.v2) };
  } else if ('v3' in location) {
    return { v4: upgradeLocationV3(location.v3) };
  } else if ('v4' in location) {
    throw new Error('LocationV4 cannot be upgraded');
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
  if (typeof interior == 'object' && 'x1' in interior) {
    return {
      x1: interior.x1[0]
    };
  } else {
    return interior;
  }
}

export function upgradeInteriorV3(interior: InteriorV3): InteriorV4 {
  if (typeof interior == 'object' && 'x1' in interior) {
    return {
      x1: [interior.x1]
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
    junction == 'onlyChild' ||
    'parachain' in junction ||
    'palletInstance' in junction ||
    'generalIndex' in junction
  ) {
    return junction;
  } else if ('accountId32' in junction) {
    return {
      accountId32: {
        network: downgradeNetworkIdV3(junction.accountId32.network),
        id: junction.accountId32.id
      }
    };
  } else if ('accountIndex64' in junction) {
    return {
      accountIndex64: {
        network: downgradeNetworkIdV3(junction.accountIndex64.network),
        index: junction.accountIndex64.index
      }
    };
  } else if ('accountKey20' in junction) {
    return {
      accountKey20: {
        network: downgradeNetworkIdV3(junction.accountKey20.network),
        key: junction.accountKey20.key
      }
    };
  } else if ('generalKey' in junction) {
    return {
      generalKey: junction.generalKey.data
    };
  } else if ('plurality' in junction) {
    return {
      plurality: {
        id: downgradeBodyIdV3(junction.plurality.id),
        part: junction.plurality.part
      }
    };
  } else {
    const junctionStr = stringify(junction);
    throw new Error(`V2 junctions don't include '${junctionStr}'`);
  }
}

function checkByteDataLength(
  junctionName: string,
  expectedLength: bigint,
  actualLength: bigint | null
) {
  if (actualLength === null) {
    throw new JunctionValidationError(
      junctionName,
      `${junctionName} must be hex string`
    );
  }

  if (expectedLength !== actualLength) {
    throw new JunctionValidationError(
      junctionName,
      `${junctionName} has incorrect length: expected ${expectedLength} bytes, got ${actualLength} bytes`
    );
  }
}

function checkNumberBitSize(
  junctionName: string,
  expectedBitSize: 8 | 32 | 64 | 128,
  actualNumber: bigint
) {
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
      throw new Error('Unknown bit size for junction');
  }
  if (actualNumber > expectedMaxNumber) {
    throw new JunctionValidationError(
      junctionName,
      `${junctionName} is greater than u${expectedBitSize}`
    );
  }
}

function invalidJunctionObj(objName: string, obj: unknown) {
  throw new JunctionValidationError(
    `not a V${CURRENT_XCM_VERSION} ${objName}`,
    `invalid object: ${stringify(obj)}`
  );
}

function checkUnitJunctionObj<T>(
  objName: string,
  obj: T,
  validUnitVariants: string[]
) {
  const isValid = validUnitVariants.find(variant => variant === obj);
  if (isValid === undefined) {
    invalidJunctionObj(objName, obj);
  }
}

function validateNetworkId(
  network: NetworkId | null | undefined,
  junctionName: string
) {
  if (typeof network === 'object' && network !== null) {
    if ('byGenesis' in network) {
      const byteLength = hexByteLength(network.byGenesis);
      checkByteDataLength(`${junctionName}.network.byGenesis`, 32n, byteLength);
    } else if ('byFork' in network) {
      checkNumberBitSize(
        `${junctionName}.network.byFork.blockNumber`,
        64,
        network.byFork.blockNumber
      );
      const byteLength = hexByteLength(network.byFork.blockHash);
      checkByteDataLength(
        `${junctionName}.network.byFork.blockHash`,
        32n,
        byteLength
      );
    } else if ('ethereum' in network) {
      checkNumberBitSize(
        `${junctionName}.network.ethereum.chainId`,
        64,
        network.ethereum.chainId
      );
    } else {
      invalidJunctionObj(`${junctionName}.network`, network);
    }
  } else {
    if (network != null ) {
      checkUnitJunctionObj(`${junctionName}.network`, network, [
        'polkadot',
        'kusama',
        'westend',
        'rococo',
        'wococo',
        'bitcoinCore',
        'bitcoinCash',
        'polkadotBulletin',
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
      const byteLength = hexByteLength(bodyId.moniker);
      checkByteDataLength('plurality.id.moniker', 4n, byteLength);
    } else if ('index' in bodyId) {
      checkNumberBitSize(
        'junction.plurality.id.index',
        32,
        bodyId.index
      );
    } else {
      invalidJunctionObj('plurality.id', bodyId);
    }
  } else {
    checkUnitJunctionObj('plurality.id', bodyId, [
      'unit',
      'executive',
      'technical',
      'legislative',
      'judicial',
      'defense',
      'administration',
      'treasury',
    ]);
  }
}

function sanitizeBodyPart(bodyPart: BodyPart) {
  if (typeof bodyPart === 'object') {
    if ('members' in bodyPart) {
      checkNumberBitSize(
        'plurality.bodyPart.members',
        32,
        bodyPart.members
      );
    } else if ('fraction' in bodyPart) {
      sanitizeFraction(bodyPart.fraction, 'plurality.bodyPart.fraction');
    } else if ('atLeastProportion' in bodyPart) {
      sanitizeFraction(
        bodyPart.atLeastProportion,
        'plurality.bodyPart.atLeastProportion'
      );
    } else if ('moreThanProportion' in bodyPart) {
      sanitizeFraction(
        bodyPart.moreThanProportion,
        'plurality.bodyPart.moreThanProportion'
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
      const byteLength = hexByteLength(junction.accountId32.id);
      if (byteLength !== null) {
        checkByteDataLength('accountId32.id', 32n, byteLength);
      }

      try {
        junction.accountId32.id = u8aToHex(decodeAddress(junction.accountId32.id));
      } catch (error) {
        throw new JunctionValidationError(
          'accountId32',
          `failed to decode AccountId32: ${junction.accountId32.id}.`,
          error as Error
        );
      }

      validateNetworkId(junction.accountId32.network, 'accountId32');
    } else if ('accountIndex64' in junction) {
      checkNumberBitSize(
        'accountIndex64.index',
        64,
        junction.accountIndex64.index
      );
      validateNetworkId(junction.accountIndex64.network, 'accountIndex64');
    } else if ('accountKey20' in junction) {
      const byteLength = hexByteLength(junction.accountKey20.key);
      checkByteDataLength('accountKey20.id', 20n, byteLength);
      validateNetworkId(junction.accountKey20.network, 'accountKey20');
    } else if ('palletInstance' in junction) {
      checkNumberBitSize('palletInstance', 8, junction.palletInstance);
    } else if ('generalIndex' in junction) {
      checkNumberBitSize('generalIndex', 128, junction.generalIndex)
    } else if ('generalKey' in junction) {
      checkNumberBitSize('generalKey.length', 8, junction.generalKey.length);

      const byteLength = hexByteLength(junction.generalKey.data);
      checkByteDataLength('generalKey.data', 32n, byteLength);
    } else if ('plurality' in junction) {
      sanitizeBodyId(junction.plurality.id);
      sanitizeBodyPart(junction.plurality.part);
    } else if ('globalConsensus' in junction) {
      validateNetworkId(junction.globalConsensus, 'globalConsensus');
    } else {
      invalidJunctionObj('junction', junction);
    }
  } else {
    checkUnitJunctionObj('junction', junction, ['onlyChild']);
  }
}

function upgradeJunctionV2(junction: JunctionV2): JunctionV3 {
  if (
    junction == 'onlyChild' ||
    'parachain' in junction ||
    'palletInstance' in junction ||
    'generalIndex' in junction
  ) {
    return junction;
  } else if ('accountId32' in junction) {
    return {
      accountId32: {
        network: upgradeNetworkIdV2(junction.accountId32.network),
        id: junction.accountId32.id
      }
    };
  } else if ('accountIndex64' in junction) {
    return {
      accountIndex64: {
        network: upgradeNetworkIdV2(junction.accountIndex64.network),
        index: junction.accountIndex64.index
      }
    };
  } else if ('accountKey20' in junction) {
    return {
      accountKey20: {
        network: upgradeNetworkIdV2(junction.accountKey20.network),
        key: junction.accountKey20.key
      }
    };
  } else if ('generalKey' in junction) {
    return {
      generalKey: {
        length: textByteLength(junction.generalKey),
        data: junction.generalKey
      }
    };
  } else if ('plurality' in junction) {
    return {
      plurality: {
        id: upgradeBodyIdV2(junction.plurality.id),
        part: junction.plurality.part
      }
    };
  } else {
    const junctionStr = stringify(junction);
    throw new Error(`${junctionStr}: unknown V2 junction`);
  }
}

function downgradeNetworkIdV3(
  networkId: NetworkIdV3 | undefined | null
): NetworkIdV2 {
  if (!networkId) {
    return 'any';
  } else if (networkId == 'polkadot' || networkId == 'kusama') {
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
      throw new Error(`'Named' NetworkIdV2 can't be upgraded to V3`);
  }
}

function downgradeBodyIdV3(bodyId: BodyIdV3): BodyIdV2 {
  if (typeof bodyId == 'object' && 'moniker' in bodyId) {
    return {
      named: bodyId.moniker
    };
  } else {
    return bodyId;
  }
}

function upgradeBodyIdV2(bodyId: BodyIdV2): BodyIdV3 {
  if (typeof bodyId == 'object' && 'named' in bodyId) {
    return {
      moniker: bodyId.named
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
    typeof firstJunction == 'object' && 'globalConsensus' in firstJunction;

  if (!startsWithGlobalConsensus) {
    return false;
  }

  switch (locationArray.length) {
    case 1:
      return true;

    case 2: {
      const secondJunction = locationArray[1];
      const parachainJunctionIsSecond =
        typeof secondJunction == 'object' && 'parachain' in secondJunction;

      return parachainJunctionIsSecond;
    }

    default:
      return false;
  }
}

export function relaychainUniversalLocation(
  networkId: NetworkId
): InteriorLocation {
  return {
    x1: [{ globalConsensus: networkId }]
  };
}

export function parachainUniveralLocation(
  networkId: NetworkId,
  paraId: bigint
): InteriorLocation {
  return {
    x2: [{ globalConsensus: networkId }, { parachain: paraId }]
  };
}

export function fungible(amount: bigint) {
  return {
    fungible: amount
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
  if (typeof id == 'bigint') {
    assetInstance = {
      index: id
    };
  } else {
    const byteLength = textByteLength(id);

    switch (byteLength) {
      case 4n:
        assetInstance = {
          array4: id
        };
        break;

      case 8n:
        assetInstance = {
          array8: id
        };
        break;

      case 16n:
        assetInstance = {
          array16: id
        };
        break;

      case 32n:
        assetInstance = {
          array32: id
        };
        break;

      default:
        throw new Error(
          `invalid nonfungible id byte length: ${byteLength} (the id: ${id})`
        );
    }
  }

  return {
    nonFungible: assetInstance
  };
}
