import {
  FungibleAnyAsset,
  VersionedAssetId,
  VersionedAssets,
} from '@open-xcm-tools/xcm-types';
import {findAnyAssetById} from '@open-xcm-tools/xcm-util';

export function findFeeAssetById(
  feeAssetId: VersionedAssetId,
  assets: VersionedAssets,
): [FungibleAnyAsset, number] | undefined {
  const result = findAnyAssetById(feeAssetId, assets);
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
