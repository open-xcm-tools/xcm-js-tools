import {
  AnyAsset,
  Asset,
  AssetV2,
  AssetV3,
  AssetV4,
  CURRENT_XCM_VERSION,
  VersionedAssets,
  XcmVersion,
} from '@open-xcm-tools/xcm-types';
import {saturatingAdd} from './compare-utils';
import {
  compareAnyAssetId,
  compareAnyAsset,
  compareAnyNonFungibleInstance,
} from './compare-assets';
import {extractVersion, fungible, MAX_UINT64} from '../common';

export function sortAndDeduplicateAssets(assets: Asset[]) {
  sortAssets(assets);
  const deduplicated = deduplicateAnySortedAssets(
    CURRENT_XCM_VERSION,
    assets,
    compareAnyAssetId,
  ) as Asset[];

  assets.splice(0, assets.length, ...deduplicated);
}

export function sortAndDeduplicateVersionedAssets(assets: VersionedAssets) {
  const xcmVersion = extractVersion(assets);
  sortVersionedAssets(xcmVersion, assets);

  if ('v4' in assets) {
    assets.v4 = deduplicateAnySortedAssets(
      xcmVersion,
      assets.v4,
      compareAnyAssetId,
    ) as AssetV4[];
  } else if ('v3' in assets) {
    assets.v3 = deduplicateAnySortedAssets(
      xcmVersion,
      assets.v3,
      compareAnyAssetId,
    ) as AssetV3[];
  } else if ('v2' in assets) {
    assets.v2 = deduplicateAnySortedAssets(
      xcmVersion,
      assets.v2,
      compareAnyAssetId,
    ) as AssetV2[];
  } else {
    throw new Error('sortAndDeduplicateAssets: unknown XCM version');
  }
}

function sortAssets(assets: Asset[]) {
  const sortFunction = (a: AnyAsset, b: AnyAsset) =>
    compareAnyAsset(CURRENT_XCM_VERSION, a, b);

  assets.sort(sortFunction);
}

function sortVersionedAssets(xcmVersion: XcmVersion, assets: VersionedAssets) {
  const sortFunction = (a: AnyAsset, b: AnyAsset) =>
    compareAnyAsset(xcmVersion, a, b);

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

function deduplicateAnySortedAssets(
  xcmVersion: XcmVersion,
  versionedAssets: Array<AnyAsset>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compareFn: (version: XcmVersion, a: any, b: any) => number,
): Array<AnyAsset> {
  const res: Array<AnyAsset> = [];

  if (versionedAssets.length === 0) {
    return res;
  }

  const iter = versionedAssets.values();
  let last: AnyAsset = iter.next().value!;

  for (const current of iter) {
    if (compareFn(xcmVersion, last.id, current.id) === 0) {
      if ('fungible' in last.fun && 'fungible' in current.fun) {
        last.fun = fungible(
          saturatingAdd(last.fun.fungible, current.fun.fungible, MAX_UINT64),
        );
        continue;
      }
      if ('nonFungible' in last.fun && 'nonFungible' in current.fun) {
        if (
          compareAnyNonFungibleInstance(
            xcmVersion,
            last.fun.nonFungible,
            current.fun.nonFungible,
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
