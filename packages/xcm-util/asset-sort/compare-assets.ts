import {
  AnyAssetId,
  AnyAssetInstance,
  AnyBodyId,
  AnyFungibility,
  AnyInterior,
  AnyJunction,
  AnyNetworkId,
  AssetId,
  AssetIdV2,
  AssetIdV3,
  BodyPart,
  CURRENT_XCM_VERSION,
  Fraction,
  InteriorLocation,
  Junction,
  Location,
  LocationV4,
  XcmVersion,
  AnyAsset,
  AnyLocation,
  Asset,
  Fungibility,
  AssetInstance,
} from '@open-xcm-tools/xcm-types';
import {
  assetIdOrder,
  assetInstanceOrder,
  bodyIdOrder,
  bodyPartOrder,
  junctionOrder,
  networkIdOrder,
} from './compare-constants';
import {
  checkBigIntDiff,
  compareEnumObjects,
  compareUInt8Array,
  validateHexStringType,
} from './compare-utils';
import {interiorToArray} from '../common';

/**
 * Compares two assets of any version based on their asset IDs and fungibility.
 *
 * @param xcmVersion - The version of the XCM protocol being used.
 * @param asset1 - The first asset to compare.
 * @param asset2 - The second asset to compare.
 * @returns A negative number if `asset1` is less than `asset2`, a positive number if `asset1` is greater than `asset2`, or zero if they are equal.
 */
export function compareAnyAsset(
  xcmVersion: XcmVersion,
  asset1: AnyAsset,
  asset2: AnyAsset,
) {
  const assetIdCompareResult = compareAnyAssetId(
    xcmVersion,
    asset1.id,
    asset2.id,
  );
  return assetIdCompareResult === 0
    ? compareAnyFungibility(xcmVersion, asset1.fun, asset2.fun)
    : assetIdCompareResult;
}

/**
 * Compares two assets using the current XCM version.
 *
 * @param asset1 - The first asset to compare.
 * @param asset2 - The second asset to compare.
 * @returns A comparison result as described in `compareAnyAsset`.
 */
export function compareAsset(asset1: Asset, asset2: Asset) {
  return compareAnyAsset(CURRENT_XCM_VERSION, asset1, asset2);
}

/**
 * Compares two fungibility types, which can be either fungible or non-fungible.
 *
 * @param xcmVersion - The version of the XCM protocol being used.
 * @param fungibility1 - The first fungibility type to compare.
 * @param fungibility2 - The second fungibility type to compare.
 * @returns A negative number if `fungibility1` is less than `fungibility2`, a positive number if `fungibility1` is greater than `fungibility2`, or zero if they are equal.
 * @throws Error if the fungibility types are unknown or cannot be compared.
 */
export function compareAnyFungibility(
  xcmVersion: XcmVersion,
  fungibility1: AnyFungibility,
  fungibility2: AnyFungibility,
) {
  if ('fungible' in fungibility1 && 'fungible' in fungibility2) {
    return checkBigIntDiff(fungibility1.fungible - fungibility2.fungible);
  }

  if ('nonFungible' in fungibility1 && 'nonFungible' in fungibility2) {
    return compareAnyNonFungibleInstance(
      xcmVersion,
      fungibility1.nonFungible,
      fungibility2.nonFungible,
    );
  }
  if ('fungible' in fungibility1 && 'nonFungible' in fungibility2) {
    return -1;
  }
  if ('nonFungible' in fungibility1 && 'fungible' in fungibility2) {
    return 1;
  }

  throw new Error(
    'compareFungibility: cannot compare fungibility, unknown content',
  );
}

/**
 * Compares two fungibility types using the current XCM version.
 *
 * @param fun1 - The first fungibility type to compare.
 * @param fun2 - The second fungibility type to compare.
 * @returns A comparison result as described in `compareAnyFungibility`.
 */
export function compareFungibility(fun1: Fungibility, fun2: Fungibility) {
  return compareAnyFungibility(CURRENT_XCM_VERSION, fun1, fun2);
}

/**
 * Compares two non-fungible asset instances based on their properties.
 *
 * @param xcmVersion - The version of the XCM protocol being used.
 * @param nft1 - The first non-fungible asset instance to compare.
 * @param nft2 - The second non-fungible asset instance to compare.
 * @returns A comparison result as described in `compareEnumObjects`.
 * @throws Error if the non-fungible instances are unknown or cannot be compared.
 */
export function compareAnyNonFungibleInstance(
  xcmVersion: XcmVersion,
  nft1: AnyAssetInstance,
  nft2: AnyAssetInstance,
) {
  const typeComparison = compareEnumObjects(
    xcmVersion,
    nft1,
    nft2,
    assetInstanceOrder,
    'assetInstance',
  );

  if (
    typeComparison === 0 &&
    typeof nft1 === 'object' &&
    typeof nft2 === 'object'
  ) {
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

    throw new Error(
      'compareNonFungibleInstance: cannot compare nonFungible instance, unknown content',
    );
  } else {
    return typeComparison;
  }
}

/**
 * Compares two non-fungible asset instances using the current XCM version.
 *
 * @param nft1 - The first non-fungible asset instance to compare.
 * @param nft2 - The second non-fungible asset instance to compare.
 * @returns A comparison result as described in `compareAnyNonFungibleInstance`.
 */
export function compareNonFungibleInstance(
  nft1: AssetInstance,
  nft2: AssetInstance,
) {
  return compareAnyNonFungibleInstance(CURRENT_XCM_VERSION, nft1, nft2);
}

/**
 * Compares two junctions based on their properties.
 *
 * @param junction1 - The first junction to compare.
 * @param junction2 - The second junction to compare.
 * @returns A comparison result as described in `compareAnyJunction`.
 */
export function compareJunction(junction1: Junction, junction2: Junction) {
  return compareAnyJunction(CURRENT_XCM_VERSION, junction1, junction2);
}

/**
 * Compares two junctions of any type based on their properties.
 *
 * @param xcmVersion - The version of the XCM protocol being used.
 * @param junction1 - The first junction to compare.
 * @param junction2 - The second junction to compare.
 * @returns A comparison result as described in `compareEnumObjects`.
 * @throws Error if the junctions are unknown or cannot be compared.
 */
export function compareAnyJunction(
  xcmVersion: XcmVersion,
  junction1: AnyJunction,
  junction2: AnyJunction,
): number {
  const typeComparison = compareEnumObjects(
    xcmVersion,
    junction1,
    junction2,
    junctionOrder,
    'junction',
  );

  if (
    typeComparison === 0 &&
    typeof junction1 === 'object' &&
    typeof junction2 === 'object'
  ) {
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
      const networkComparison = compareAnyNetwork(
        xcmVersion,
        junction1.accountId32.network,
        junction2.accountId32.network,
      );

      return networkComparison !== 0
        ? networkComparison
        : compareUInt8Array(junction1.accountId32.id, junction2.accountId32.id);
    }

    if ('accountIndex64' in junction1 && 'accountIndex64' in junction2) {
      const networkComparison = compareAnyNetwork(
        xcmVersion,
        junction1.accountIndex64.network,
        junction2.accountIndex64.network,
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
      const networkComparison = compareAnyNetwork(
        xcmVersion,
        junction1.accountKey20.network,
        junction2.accountKey20.network,
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
      const bodyIdComparisonResult = compareAnyBodyId(
        xcmVersion,
        junction1.plurality.id,
        junction2.plurality.id,
      );
      return bodyIdComparisonResult !== 0
        ? bodyIdComparisonResult
        : compareAnyBodyPart(
            xcmVersion,
            junction1.plurality.part,
            junction2.plurality.part,
          );
    }

    if ('globalConsensus' in junction1 && 'globalConsensus' in junction2) {
      return compareAnyNetwork(
        xcmVersion,
        junction1.globalConsensus,
        junction2.globalConsensus,
      );
    }

    throw new Error(
      'compareAnyJunction: cannot compare junction object, unknown content',
    );
  } else {
    return typeComparison;
  }
}

/**
 * Compares two asset IDs.
 *
 * @param assetId1 - The first asset ID to compare.
 * @param assetId2 - The second asset ID to compare.
 * @returns A comparison result as described in `compareAnyAssetId`.
 */
export function compareAssetId(assetId1: AssetId, assetId2: AssetId) {
  return compareAnyAssetId(CURRENT_XCM_VERSION, assetId1, assetId2);
}

/**
 * Compares two locations based on their properties.
 *
 * @param location1 - The first location to compare.
 * @param location2 - The second location to compare.
 * @returns A comparison result as described in `compareAnyLocation`.
 */
export function compareLocation(location1: Location, location2: Location) {
  return compareAnyLocation(CURRENT_XCM_VERSION, location1, location2);
}

/**
 * Compares two interior locations.
 *
 * @param location1 - The first interior location to compare.
 * @param location2 - The second interior location to compare.
 * @returns A comparison result as described in `compareAnyInteriors`.
 */
export function compareInteriorLocation(
  location1: InteriorLocation,
  location2: InteriorLocation,
) {
  return compareAnyInteriors(CURRENT_XCM_VERSION, location1, location2);
}

/**
 * Compares two asset IDs of any type based on the XCM version.
 *
 * @param xcmVersion - The version of the XCM protocol being used.
 * @param assetId1 - The first asset ID to compare.
 * @param assetId2 - The second asset ID to compare.
 * @returns A comparison result based on the asset IDs.
 * @throws Error if the XCM version is unknown.
 */
export function compareAnyAssetId(
  xcmVersion: XcmVersion,
  assetId1: AnyAssetId,
  assetId2: AnyAssetId,
) {
  if (xcmVersion === 4) {
    return compareAnyLocation(
      xcmVersion,
      assetId1 as LocationV4,
      assetId2 as LocationV4,
    );
  }
  if (xcmVersion < 4) {
    return compareAssetIdV3V2(
      xcmVersion,
      assetId1 as AssetIdV3 | AssetIdV2,
      assetId2 as AssetIdV3 | AssetIdV2,
    );
  }

  throw new Error('compareAnyAssetId: unknown XCM version');
}

/**
 * Compares two locations based on their properties and the XCM version.
 *
 * @param xcmVersion - The version of the XCM protocol being used.
 * @param location1 - The first location to compare.
 * @param location2 - The second location to compare.
 * @returns A negative number if `location1` is less than `location2`, a positive number if `location1` is greater than `location2`, or zero if they are equal.
 */
export function compareAnyLocation(
  xcmVersion: XcmVersion,
  location1: AnyLocation,
  location2: AnyLocation,
): number {
  const parentsCompareResult = checkBigIntDiff(
    location1.parents - location2.parents,
  );
  return parentsCompareResult !== 0
    ? parentsCompareResult
    : compareAnyInteriors(xcmVersion, location1.interior, location2.interior);
}

/**
 * Compares two network IDs based on the XCM version.
 *
 * @param xcmVersion - The version of the XCM protocol being used.
 * @param network1 - The first network ID to compare.
 * @param network2 - The second network ID to compare.
 * @returns A comparison result as described in `compareAnyNetworkId`.
 */
function compareAnyNetwork(
  xcmVersion: XcmVersion,
  network1: AnyNetworkId | undefined | null,
  network2: AnyNetworkId | undefined | null,
) {
  if (!network1) return network2 ? -1 : 0;
  if (!network2) return 1;

  return compareAnyNetworkId(xcmVersion, network1, network2);
}

/**
 * Compares two network IDs of any type based on the XCM version.
 *
 * @param xcmVersion - The version of the XCM protocol being used.
 * @param networkId1 - The first network ID to compare.
 * @param networkId2 - The second network ID to compare.
 * @returns A comparison result as described in `compareEnumObjects`.
 * @throws Error if the network IDs are unknown or cannot be compared.
 */
function compareAnyNetworkId(
  xcmVersion: XcmVersion,
  networkId1: AnyNetworkId,
  networkId2: AnyNetworkId,
): number {
  const typeComparison = compareEnumObjects(
    xcmVersion,
    networkId1,
    networkId2,
    networkIdOrder,
    'networkId',
  );

  if (
    typeComparison === 0 &&
    typeof networkId1 === 'object' &&
    typeof networkId2 === 'object'
  ) {
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

    throw new Error(
      'compareNetworkId: cannot compare networkId object, unknown content',
    );
  } else {
    return typeComparison;
  }
}

function compareAnyBodyId(
  xcmVersion: XcmVersion,
  bodyId1: AnyBodyId,
  bodyId2: AnyBodyId,
): number {
  const typeComparison = compareEnumObjects(
    xcmVersion,
    bodyId1,
    bodyId2,
    bodyIdOrder,
    'bodyId',
  );

  if (
    typeComparison === 0 &&
    typeof bodyId1 === 'object' &&
    typeof bodyId2 === 'object'
  ) {
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

    throw new Error(
      'compareBodyId: cannot compare bodyId object, unknown content',
    );
  } else {
    return typeComparison;
  }
}

function compareFraction(fraction1: Fraction, fraction2: Fraction) {
  if (fraction1.nom !== fraction2.nom) {
    return checkBigIntDiff(fraction1.nom - fraction2.nom);
  }
  return checkBigIntDiff(fraction1.denom - fraction2.denom);
}

function compareAnyBodyPart(
  xcmVersion: XcmVersion,
  bodyPart1: BodyPart,
  bodyPart2: BodyPart,
): number {
  const typeComparison = compareEnumObjects(
    xcmVersion,
    bodyPart1,
    bodyPart2,
    bodyPartOrder,
    'bodyPart',
  );

  if (
    typeComparison === 0 &&
    typeof bodyPart1 === 'object' &&
    typeof bodyPart2 === 'object'
  ) {
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

    throw new Error(
      'compareBodyPart: cannot compare fraction object, unknown content',
    );
  } else {
    return typeComparison;
  }
}

function compareAnyInteriors(
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
      const comparisonResult = compareAnyJunction(
        xcmVersion,
        junctions1[i],
        junctions2[i],
      );
      if (comparisonResult !== 0) {
        return comparisonResult;
      }
    }
    return 0;
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

function compareAssetIdV3V2(
  xcmVersion: XcmVersion,
  assetId1: AssetIdV3 | AssetIdV2,
  assetId2: AssetIdV3 | AssetIdV2,
): number {
  const typeComparison = compareEnumObjects(
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
    return compareAnyLocation(xcmVersion, assetId1.concrete, assetId2.concrete);
  }

  throw new Error(
    'compareAssetIdV3V2: cannot compare assetId object, unknown content',
  );
}
