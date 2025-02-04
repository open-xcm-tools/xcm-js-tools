import {
  VersionedLocation,
  XcmVersion,
  Location,
  VersionedAssetId,
  AssetId,
  VersionedAsset,
  Asset,
  VersionedAssets,
  CURRENT_XCM_VERSION,
  AnyAsset,
  AnyAssetId,
} from '@open-xcm-tools/xcm-types';
import {extractVersion} from '../common';
import {
  downgradeAsset,
  downgradeAssetId,
  downgradeLocation,
} from './downgrade-xcm-version';
import {
  upgradeAsset,
  upgradeAssetId,
  upgradeLocation,
} from './upgrade-xcm-version';

export function convertLocationVersion(
  version: XcmVersion,
  location: VersionedLocation | Location,
): VersionedLocation {
  if ('parents' in location) {
    return convertLocationVersion(version, {
      v5: location,
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

export function assetIntoCurrentVersion(asset: VersionedAsset): Asset {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vCurrent = convertAssetVersion(CURRENT_XCM_VERSION, asset) as any;
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

export function unwrapVersionedAssetId(assetId: VersionedAssetId): AnyAssetId {
  if ('v2' in assetId) {
    return assetId.v2;
  } else if ('v3' in assetId) {
    return assetId.v3;
  } else if ('v4' in assetId) {
    return assetId.v4;
  } else {
    throw new Error('unwrapVersionedAsset: unknown XCM version');
  }
}

export function unwrapVersionedAsset(asset: VersionedAsset): AnyAsset {
  if ('v2' in asset) {
    return asset.v2;
  } else if ('v3' in asset) {
    return asset.v3;
  } else if ('v4' in asset) {
    return asset.v4;
  } else {
    throw new Error('unwrapVersionedAsset: unknown XCM version');
  }
}

export function unwrapVersionedAssets(assets: VersionedAssets): AnyAsset[] {
  if ('v2' in assets) {
    return assets.v2;
  } else if ('v3' in assets) {
    return assets.v3;
  } else if ('v4' in assets) {
    return assets.v4;
  } else {
    throw new Error('unwrapVersionedAssets: unknown XCM version');
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
