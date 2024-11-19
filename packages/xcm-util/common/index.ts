import {
  CURRENT_XCM_VERSION,
  Interior,
  Junction,
  MIN_XCM_VERSION,
  XcmVersion,
  Location,
  AssetIdLookup,
  Fungibility,
  AssetLookup,
  InteriorLocation,
  VersionedAssets,
  VersionedAsset,
  Asset,
  AssetId,
  NetworkId,
  AnyAssetId,
  AnyAsset,
  VersionedAssetId,
} from '@open-xcm-tools/xcm-types';
import {
  sanitizeFungibility,
  sanitizeJunction,
  sanitizeLookup,
} from '../sanitize';
import {stringify} from '@polkadot/util';
import {ApiPromise} from '@polkadot/api';
import {convertAssetsVersion} from '../convert-xcm-version';
import {sortAndDeduplicateVersionedAssets} from '../asset-sort';
import {compareAnyAssetId, compareJunction} from '../asset-sort/compare-assets';
import {
  convertAssetIdVersion,
  unwrapVersionedAssetId,
  unwrapVersionedAssets,
} from '../convert-xcm-version/convert-xcm-version';

/**
 * Converts an interior representation into an array of junctions.
 *
 * @param interiorVersion - The version of the XCM protocol being used.
 * @param interior - The interior representation, which can be an object with a field `x[1-8]` or the string 'here'.
 * @returns An array of junctions corresponding to the provided interior representation.
 * @throws Error if the interior representation is invalid.
 */
export function interiorToArray(
  interiorVersion: XcmVersion,
  interior: any,
): any[] {
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

/**
 * Converts an array of junctions into an interior representation.
 *
 * @param interiorVersion - The version of the XCM protocol being used.
 * @param junctions - An array of junctions.
 * @returns An interior representation based on the provided junctions.
 * @throws Error if the length of the junctions array exceeds the maximum allowed length.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function arrayToInterior(
  interiorVersion: XcmVersion,
  junctions: any[],
): any {
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

/**
 * Converts an array of junctions to an interior representation using the current XCM version.
 *
 * @param junctions - An array of junctions.
 * @returns An interior representation.
 */
export function toInterior(junctions: Junction[]): Interior {
  return arrayToInterior(CURRENT_XCM_VERSION, junctions);
}

/**
 * Converts an interior representation back into an array of junctions using the current XCM version.
 *
 * @param interior - The interior representation.
 * @returns An array of junctions.
 */
export function toJunctions(interior: Interior): Junction[] {
  return interiorToArray(CURRENT_XCM_VERSION, interior);
}

/**
 * Creates an asset lookup object.
 *
 * @param id - The identifier for the asset.
 * @param fun - The fungibility type of the asset.
 * @returns An object representing the asset lookup.
 */
export function asset(id: AssetIdLookup, fun: Fungibility): AssetLookup {
  sanitizeLookup(id);
  sanitizeFungibility(fun);
  return {
    id,
    fun,
  };
}

/**
 * Creates a universal location based on the network ID and junctions.
 *
 * @param networkId - The ID of the network.
 * @param junctions - Either the string 'here' or an array of junctions.
 * @returns An interior location object.
 */
export function universalLocation(
  networkId: NetworkId,
  junctions: 'here' | Junction[],
): InteriorLocation {
  const universalLocationJunctions: Junction[] = [{globalConsensus: networkId}];

  if (typeof junctions === 'object') {
    universalLocationJunctions.push(...junctions);
  }

  return toInterior(universalLocationJunctions);
}

/**
 * Creates a location object based on the number of parents and junctions.
 *
 * @param parents - The number of parent blocks.
 * @param junctions - Either the string 'here' or an array of junctions.
 * @returns A location object.
 */
export function location(
  parents: bigint,
  junctions: 'here' | Junction[],
): Location {
  if (junctions instanceof Array) {
    junctions.forEach(sanitizeJunction);
  }
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

/**
 * Creates a fungible asset representation.
 *
 * @param amount - The amount of the fungible asset.
 * @returns An object representing the fungible asset.
 */
export function fungible(amount: bigint) {
  return {
    fungible: amount,
  };
}

/**
 * Creates a non-fungible asset representation.
 *
 * @param id - The identifier for the non-fungible asset, which can be a bigint or a string.
 *        If the `id` is a `bigint`, it will be represented as `{ index: bigint }`.
 *        If the `id` is a `string`, it will be assigned to the corresponding array* variant
 * @returns An object representing the non-fungible asset.
 * @throws Error if the identifier's byte length is invalid.
 */
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

/**
 * Extracts the XCM version from a versioned object.
 *
 * @param versioned - An object containing versioned data.
 * @returns The extracted XCM version.
 * @throws Error if the version cannot be extracted.
 */
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

function sortObjectFields<T extends object>(obj: T): T {
  const sortedObj: Record<string, any> = {};
  const sortedEntries = Object.entries(obj).sort(([key1], [key2]) =>
    key1 > key2 ? 1 : -1,
  );

  for (const [key, value] of sortedEntries) {
    sortedObj[key] =
      typeof value === 'object' && value !== null
        ? sortObjectFields(value)
        : value;
  }

  return sortedObj as T;
}

/**
 * Converts an object to a JSON string, sorting its fields.
 *
 * @param obj - The object to convert, or a string.
 * @returns A JSON string representation of the object.
 */
export function convertObjToJsonString<T extends Record<string, any>>(
  obj: T | string,
): string {
  return typeof obj === 'string' ? obj : stringify(sortObjectFields(obj));
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

/**
 * Finds the XCM pallet in the API.
 * @param api - The API promise instance.
 * @returns The name of the XCM pallet if found, otherwise undefined.
 */
export function findPalletXcm(api: ApiPromise) {
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

/**
 * Converts a pallet runtime name to a camelCase name as in the `api.tx.<palletName>`.
 * @param palletRuntimeName - The runtime name of the pallet.
 * @returns The camelCase transaction name.
 */
export function palletApiTxName(palletRuntimeName: string) {
  const palletPascalCaseName = palletRuntimeName;

  // `api.tx` fields are in the `camelCase`.
  return palletPascalCaseName[0].toLowerCase() + palletPascalCaseName.slice(1);
}

/**
 * Concatenates two interior representations into one.
 *
 * @param a - The first interior representation.
 * @param b - The second interior representation.
 * @returns A new interior representation that combines both.
 * @throws Error if the concatenated length exceeds the maximum allowed.
 */
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

/**
 * Converts a relative location to a universal location based on a given context.
 *
 * @param relativeLocation - The relative location to be converted.
 * @param context - The context that provides the necessary information for the conversion.
 * @returns A universal interior location that represents the relative location in the context of the provided interior location.
 * @throws Error if the relative location does not have enough context to perform the conversion.
 */
export function relativeLocationToUniversal({
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
      'relativeLocationToUniversal: not enough context to convert relative location to a universal one',
    );
  }

  const prefixBeg = 0;
  const prefixEnd = contextJunctions.length - Number(relativeLocation.parents);

  const universalPrefix = contextJunctions.slice(prefixBeg, prefixEnd);
  return toInterior([...universalPrefix, ...locationJunctions]);
}

/**
 * Determines the relative location of a given location with respect to a prefix.
 *
 * @param location - The interior location to be analyzed.
 * @param prefix - The prefix interior location that serves as the reference.
 * @returns A location object that indicates how many parent blocks are present and the interior representation relative to the prefix.
 */
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
    !compareJunction(locationJunctions[0], prefixJunctions[0])
  ) {
    locationJunctions = locationJunctions.slice(1);
    prefixJunctions = prefixJunctions.slice(1);
  }

  return {
    parents: BigInt(prefixJunctions.length),
    interior: toInterior(locationJunctions),
  };
}

/**
 * Prepares assets for encoding by converting them to the appropriate version and sorting&duplicating them.
 *
 * @param version - The XCM version to which the assets should be converted.
 * @param assets - The assets to be prepared, which can be a single asset or an array of assets.
 * @returns A sorted and deduplicated list of versioned assets.
 */
export function prepareAssetsForEncoding(
  version: XcmVersion,
  assets: VersionedAssets | VersionedAsset[] | Asset[],
): VersionedAssets {
  const versionedAssets = convertAssetsVersion(version, assets);

  sortAndDeduplicateVersionedAssets(versionedAssets);
  return versionedAssets;
}

/**
 * Reanchors an asset ID from an old context to a new context.
 *
 * @param assetId - The asset ID to be reanchored.
 * @param oldContext - The previous context of the asset.
 * @param newContext - The new context to which the asset ID should be reanchored.
 * @returns The reanchored asset ID.
 */
export function reanchorAssetId({
  assetId,
  oldContext,
  newContext,
}: {
  assetId: AssetId;
  oldContext: InteriorLocation;
  newContext: InteriorLocation;
}): AssetId {
  return reanchorRelativeLocation({
    relativeLocation: assetId,
    oldContext,
    newContext,
  });
}

/**
 * Reanchors a relative location from an old context to a new context.
 *
 * @param relativeLocation - The relative location to be reanchored.
 * @param oldContext - The previous context of the relative location.
 * @param newContext - The new context to which the relative location should be reanchored.
 * @returns The reanchored relative location.
 */
export function reanchorRelativeLocation({
  relativeLocation,
  oldContext,
  newContext,
}: {
  relativeLocation: Location;
  oldContext: InteriorLocation;
  newContext: InteriorLocation;
}): Location {
  const location = relativeLocationToUniversal({
    relativeLocation,
    context: oldContext,
  });

  return locationRelativeToPrefix({
    location,
    prefix: newContext,
  });
}

/**
 * Finds the index of a specific asset ID within an array of asset IDs.
 *
 * @param xcmVersion - The version of the XCM protocol being used.
 * @param feeAssetId - The asset ID to search for.
 * @param assetIds - An array of asset IDs to search within.
 * @returns The index of the asset ID if found, otherwise undefined.
 */
export function findAnyAssetIdIndex(
  xcmVersion: XcmVersion,
  feeAssetId: AnyAssetId,
  assetIds: AnyAssetId[],
) {
  const index = assetIds.findIndex(
    assetId => compareAnyAssetId(xcmVersion, assetId, feeAssetId) === 0,
  );
  if (index !== -1) {
    return index;
  }
}

/**
 * Finds the index of a specific asset ID within an array of asset IDs using the current XCM version.
 *
 * @param feeAssetId - The asset ID to search for.
 * @param assetIds - An array of asset IDs to search within.
 * @returns The index of the asset ID if found, otherwise undefined.
 */
export function findAssetIdIndex(
  feeAssetId: AnyAssetId,
  assetIds: AnyAssetId[],
) {
  return findAnyAssetIdIndex(CURRENT_XCM_VERSION, feeAssetId, assetIds);
}

/**
 * Finds an asset by its versioned asset ID within a collection of versioned assets.
 *
 * @param versionedAssetId - The versioned asset ID to search for.
 * @param versionedAssets - The collection of versioned assets to search within.
 * @returns A tuple containing the found asset and its index if found, otherwise undefined.
 */
export function findAnyAssetById(
  versionedAssetId: VersionedAssetId,
  versionedAssets: VersionedAssets,
): [AnyAsset, number] | undefined {
  const assetsVersion = extractVersion(versionedAssets);

  const unwrapAssetId = unwrapVersionedAssetId(
    convertAssetIdVersion(assetsVersion, versionedAssetId),
  );
  const unwrappedAssets = unwrapVersionedAssets(versionedAssets);

  const assetIndex = findAnyAssetIdIndex(
    extractVersion(versionedAssets),
    unwrapAssetId,
    unwrappedAssets.map(asset => asset.id),
  );
  if (assetIndex !== undefined) {
    return [unwrappedAssets[assetIndex], assetIndex];
  }
}

export {SanitizationError} from './errors';
export {MAX_UINT8, MAX_UINT32, MAX_UINT64, MAX_UINT128} from './constants';
