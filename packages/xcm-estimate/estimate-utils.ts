import {
  FungibleAnyAsset,
  VersionedAssetId,
  VersionedAssets,
} from '@open-xcm-tools/xcm-types';
import {findAnyAssetById} from '@open-xcm-tools/xcm-util';

/**
 * Finds a fee asset by its ID from a list of versioned assets.
 *
 * This function searches for a specified fee asset ID within a collection of versioned assets.
 * If the asset is found and is fungible, it returns the asset along with its index in the list.
 * If the asset is found but is non-fungible, an error is thrown.
 *
 * @param feeAssetId - The ID of the fee asset to find.
 * @param assets - The collection of versioned assets to search within.
 * @returns A tuple containing the found fungible asset and its index, or undefined if not found.
 * @throws If the found asset is non-fungible, indicating that the fee asset cannot be an NFT.
 */
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
