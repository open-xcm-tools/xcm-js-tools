import {
  Asset,
  AssetIdLookup,
  AssetLookup,
  BodyId,
  BodyPart,
  CURRENT_XCM_VERSION,
  Fraction,
  Fungibility,
  Interior,
  Junction,
  LocationLookup,
  NetworkId,
  Location,
} from '@open-xcm-tools/xcm-types';
import {
  checkByteDataLength,
  checkNumberBitSize,
  checkUnitJunctionObj,
  hexToUint8Array,
  invalidJunctionObj,
} from './sanitize-utils';
import {decodeAddress} from '@polkadot/keyring';
import {bodyIdOrder, networkIdOrder} from '../asset-sort/compare-constants';
import {arrayToInterior, interiorToArray, SanitizationError} from '../common';

export function sanitizeAssets(assets: Asset[]) {
  assets.forEach(a => {
    sanitizeLocation(a.id);
    sanitizeFungibility(a.fun);
  });
}

export function sanitizeFungibility(fun: Fungibility) {
  if ('fungible' in fun) {
    checkNumberBitSize('fungible.value', 128, fun.fungible);
  } else if ('nonFungible' in fun && typeof fun.nonFungible === 'object') {
    if ('index' in fun.nonFungible) {
      checkNumberBitSize('nonFungible.index', 128, fun.nonFungible.index);
    }
    if ('array4' in fun.nonFungible) {
      checkByteDataLength(
        'nonFungible.array4',
        4,
        fun.nonFungible.array4.length,
      );
    }
    if ('array8' in fun.nonFungible) {
      checkByteDataLength(
        'nonFungible.array8',
        8,
        fun.nonFungible.array8.length,
      );
    }
    if ('array16' in fun.nonFungible) {
      checkByteDataLength(
        'nonFungible.array16',
        16,
        fun.nonFungible.array16.length,
      );
    }
    if ('array32' in fun.nonFungible) {
      checkByteDataLength(
        'nonFungible.array32',
        32,
        fun.nonFungible.array32.length,
      );
    }
  }
}

export function sanitizeLookup(
  lookup: LocationLookup | AssetIdLookup | AssetLookup,
) {
  if (typeof lookup === 'object') {
    if ('id' in lookup) {
      if (typeof lookup.id === 'object') {
        sanitizeLocation(lookup.id);
      }
    } else {
      sanitizeInterior(lookup.interior);
    }
  }
}

export function sanitizeLocation(location: Location) {
  checkNumberBitSize('Location.parents', 8, location.parents);
  sanitizeInterior(location.interior);
}

export function sanitizeInterior(interior: Interior) {
  if (typeof interior === 'object') {
    const junctions = interiorToArray(CURRENT_XCM_VERSION, interior);
    junctions.forEach(sanitizeJunction);
    interior = arrayToInterior(CURRENT_XCM_VERSION, junctions);
  }
}

export function sanitizeJunction(junction: Junction) {
  if (typeof junction === 'object') {
    if ('parachain' in junction) {
      checkNumberBitSize('parachain', 32, junction.parachain);
    } else if ('accountId32' in junction) {
      try {
        junction.accountId32.id = decodeAddress(junction.accountId32.id);
      } catch (error) {
        throw new SanitizationError(
          'accountId32',
          `failed to decode AccountId32: ${junction.accountId32.id}.`,
          error as Error,
        );
      }
      // A necessary check, because the decodeAddress function
      // accepts a hex-string of any length without raising an error.
      checkByteDataLength('accountId32.id', 32, junction.accountId32.id.length);

      sanitizeNetworkId(junction.accountId32.network, 'accountId32');
    } else if ('accountIndex64' in junction) {
      checkNumberBitSize(
        'accountIndex64.index',
        64,
        junction.accountIndex64.index,
      );
      sanitizeNetworkId(junction.accountIndex64.network, 'accountIndex64');
    } else if ('accountKey20' in junction) {
      if (typeof junction.accountKey20.key === 'string') {
        junction.accountKey20.key = hexToUint8Array(
          'accountKey20.key',
          junction.accountKey20.key,
        );
      }
      checkByteDataLength(
        'accountKey20.id',
        20,
        junction.accountKey20.key.length,
      );
      sanitizeNetworkId(junction.accountKey20.network, 'accountKey20');
    } else if ('palletInstance' in junction) {
      checkNumberBitSize('palletInstance', 8, junction.palletInstance);
    } else if ('generalIndex' in junction) {
      checkNumberBitSize('generalIndex', 128, junction.generalIndex);
    } else if ('generalKey' in junction) {
      if (typeof junction.generalKey.data === 'string') {
        junction.generalKey.data = hexToUint8Array(
          'generalKey',
          junction.generalKey.data,
        );
      }
      checkNumberBitSize('generalKey.length', 8, junction.generalKey.length);
      checkByteDataLength(
        'generalKey.data',
        32,
        junction.generalKey.data.length,
      );
    } else if ('plurality' in junction) {
      sanitizeBodyId(junction.plurality.id);
      sanitizeBodyPart(junction.plurality.part);
    } else if ('globalConsensus' in junction) {
      sanitizeNetworkId(junction.globalConsensus, 'globalConsensus');
    } else {
      invalidJunctionObj('junction', junction);
    }
  } else {
    checkUnitJunctionObj('junction', junction, ['onlyChild']);
  }
}

function sanitizeNetworkId(
  network: NetworkId | null | undefined,
  junctionName: string,
) {
  if (typeof network === 'object' && network !== null) {
    if ('byGenesis' in network) {
      if (typeof network.byGenesis === 'string') {
        network.byGenesis = hexToUint8Array(
          `${junctionName}.networkId.byGenesis`,
          network.byGenesis,
        );
      }
      checkByteDataLength(
        `${junctionName}.network.byGenesis`,
        32,
        network.byGenesis.length,
      );
    } else if ('byFork' in network) {
      checkNumberBitSize(
        `${junctionName}.network.byFork.blockNumber`,
        64,
        network.byFork.blockNumber,
      );
      if (typeof network.byFork.blockHash === 'string') {
        network.byFork.blockHash = hexToUint8Array(
          `${junctionName}.byFork.blockHash`,
          network.byFork.blockHash,
        );
      }
      checkByteDataLength(
        `${junctionName}.network.byFork.blockHash`,
        32,
        network.byFork.blockHash.length,
      );
    } else if ('ethereum' in network) {
      checkNumberBitSize(
        `${junctionName}.network.ethereum.chainId`,
        64,
        network.ethereum.chainId,
      );
    } else {
      invalidJunctionObj(`${junctionName}.network`, network);
    }
  } else {
    if (network != null) {
      checkUnitJunctionObj(`${junctionName}.network`, network, [
        ...networkIdOrder.get(CURRENT_XCM_VERSION)!.keys(),
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
      if (typeof bodyId.moniker === 'string') {
        bodyId.moniker = hexToUint8Array('bodyId.moniker', bodyId.moniker);
      }
      checkByteDataLength('plurality.id.moniker', 4, bodyId.moniker.length);
    } else if ('index' in bodyId) {
      checkNumberBitSize('junction.plurality.id.index', 32, bodyId.index);
    } else {
      invalidJunctionObj('plurality.id', bodyId);
    }
  } else {
    checkUnitJunctionObj('plurality.id', bodyId, [
      ...bodyIdOrder.get(CURRENT_XCM_VERSION)!.keys(),
    ]);
  }
}

function sanitizeBodyPart(bodyPart: BodyPart) {
  if (typeof bodyPart === 'object') {
    if ('members' in bodyPart) {
      checkNumberBitSize(
        'plurality.bodyPart.members',
        32,
        bodyPart.members.count,
      );
    } else if ('fraction' in bodyPart) {
      sanitizeFraction(bodyPart.fraction, 'plurality.bodyPart.fraction');
    } else if ('atLeastProportion' in bodyPart) {
      sanitizeFraction(
        bodyPart.atLeastProportion,
        'plurality.bodyPart.atLeastProportion',
      );
    } else if ('moreThanProportion' in bodyPart) {
      sanitizeFraction(
        bodyPart.moreThanProportion,
        'plurality.bodyPart.moreThanProportion',
      );
    } else {
      invalidJunctionObj('plurality.bodyPart', bodyPart);
    }
  } else if (bodyPart !== 'voice') {
    invalidJunctionObj('plurality.bodyPart', bodyPart);
  }
}
