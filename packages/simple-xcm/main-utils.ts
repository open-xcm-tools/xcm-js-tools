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

/**
 * Creates a universal location for a relay chain based on the provided network ID.
 * This method makes sense only for the `Polkadot`, `Kusama`, `Westend` and other Parity-related ecosystems.
 *
 * @param networkId - The network ID of an ecosystem.
 * @returns The universal location for the relay chain.
 */
export function relaychainUniversalLocation(
  networkId: NetworkId,
): InteriorLocation {
  const validNetworks = ['polkadot', 'kusama', 'rococo', 'westend', 'wococo'];

  if (typeof networkId !== 'string' || !validNetworks.includes(networkId)) {
    throw new Error(
      'Non-Parity network id passed. Please, use only Parity-related ecosystems',
    );
  }

  return {
    x1: [{globalConsensus: networkId}],
  };
}

/**
 * Creates a universal location for a parachain based on the provided network ID and parachain ID.
 *
 * @param networkId - The network ID of an ecosystem.
 * @param paraId - The ID of the parachain.
 * @returns The universal location for the parachain.
 */
export function parachainUniversalLocation(
  networkId: NetworkId,
  paraId: bigint,
): InteriorLocation {
  return {
    x2: [{globalConsensus: networkId}, {parachain: paraId}],
  };
}

/**
 * Creates a universal location for an asset hub currency based on the provided network ID and asset ID.
 * This function assumes that the asset hub has the `paraId = 1000`.
 *
 * @param networkId - The network ID of an ecosystem.
 * @param id - The ID of the asset.
 * @returns The universal location for the asset hub currency.
 */
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

/**
 * Checks if a given location is a universal location for a chain.
 *
 * A universal location is defined as starting with a global consensus junction,
 * and can be 1) a relay chain, 2) a solo-chain like Ethereum, 3) a parachain.
 *
 * @param location - The location to check.
 * @returns True if the location is a universal location, false otherwise.
 */
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

/**
 * Sanitizes transfer parameters to ensure they conform to expected formats.
 *
 * This function checks and sanitizes the origin, assets, beneficiary, destination,
 * and fee asset ID in the transfer parameters.
 *
 * @param params - The transfer parameters to sanitize.
 */
export function sanitizeTransferParams(params: TransferParams) {
  if (typeof params.origin === 'object' && 'Xcm' in params.origin) {
    sanitizeInterior(params.origin.Xcm);
  }
  params.assets.forEach(sanitizeLookup);
  sanitizeLookup(params.beneficiary);
  sanitizeLookup(params.destination);
  sanitizeLookup(params.feeAssetId);
}
