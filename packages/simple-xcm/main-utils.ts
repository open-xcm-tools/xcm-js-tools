import {
  CURRENT_XCM_VERSION,
  InteriorLocation,
  Junction,
  NetworkId,
} from '@open-xcm-tools/xcm-types';
import {
  interiorToArray,
  sanitizeInterior,
  sanitizeLookup,
} from '@open-xcm-tools/xcm-util';
import {TransferParams} from './simplexcm';

export function relaychainUniversalLocation(
  networkId: NetworkId,
): InteriorLocation {
  return {
    x1: [{globalConsensus: networkId}],
  };
}

export function parachainUniversalLocation(
  networkId: NetworkId,
  paraId: bigint,
): InteriorLocation {
  return {
    x2: [{globalConsensus: networkId}, {parachain: paraId}],
  };
}

export function assetHubCurrencyUniversalLocation(
  networkId: NetworkId,
  id: bigint,
): InteriorLocation {
  return {
    x4: [
      {globalConsensus: networkId},
      {parachain: 1000n},
      {palletInstance: 50n},
      {generalIndex: id},
    ],
  };
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

export function sanitizeTransferParams(params: TransferParams) {
  if (typeof params.origin === 'object' && 'Xcm' in params.origin) {
    sanitizeInterior(params.origin.Xcm);
  }
  params.assets.forEach(sanitizeLookup);
  sanitizeLookup(params.beneficiary);
  sanitizeLookup(params.destination);
  sanitizeLookup(params.feeAssetId);
}
