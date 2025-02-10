import {XcmVersion} from '@open-xcm-tools/xcm-types';

const commonAssets = new Map<string, number>([
  ['undefined', 0],
  ['index', 1],
  ['array4', 2],
  ['array8', 3],
  ['array16', 4],
  ['array32', 5],
]);

// todo - transform maps here to a Record<XcmVersion, Map<string, number> or smth> to make it more type-safe?
export const assetInstanceOrder = new Map<XcmVersion, Map<string, number>>([
  [2, new Map<string, number>([...commonAssets, ['blob', 6]])],
  [3, commonAssets],
  [4, commonAssets],
  [5, commonAssets],
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

const commonNetworksV5 = new Map(
  [...commonNetworks].filter(
    ([key]) => !['westend', 'rococo', 'wococo'].includes(key),
  ),
);

export const networkIdOrder = new Map<XcmVersion, Map<string, number>>([
  [2, new Map<string, number>([['any', 2], ['named', 3], ...commonNetworks])],
  [3, commonNetworks],
  [4, commonNetworks],
  [5, commonNetworksV5],
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

export const bodyIdOrder = new Map<XcmVersion, Map<string, number>>([
  [2, new Map<string, number>([['named', 1], ...commonBodyIds])],
  [3, new Map<string, number>([['moniker', 2], ...commonBodyIds])],
  [4, new Map<string, number>([['moniker', 2], ...commonBodyIds])],
  [5, new Map<string, number>([['moniker', 2], ...commonBodyIds])],
]);

const commonBodyParts = new Map<string, number>([
  ['voice', 0],
  ['members', 1],
  ['fraction', 2],
  ['atLeastProportion', 3],
  ['moreThanProportion', 4],
]);

export const bodyPartOrder = new Map<XcmVersion, Map<string, number>>([
  [2, commonBodyParts],
  [3, commonBodyParts],
  [4, commonBodyParts],
  [5, commonBodyParts],
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

export const junctionOrder = new Map<XcmVersion, Map<string, number>>([
  [2, commonJunctions],
  [3, new Map<string, number>([['globalConsensus', 9], ...commonJunctions])],
  [4, new Map<string, number>([['globalConsensus', 9], ...commonJunctions])],
  [5, new Map<string, number>([['globalConsensus', 9], ...commonJunctions])],
]);

const commonAssetIds = new Map<string, number>([
  ['Concrete', 0],
  ['Abstract', 1],
]);

export const assetIdOrder = new Map<XcmVersion, Map<string, number>>([
  [2, commonAssetIds],
  [3, commonAssetIds],
]);
