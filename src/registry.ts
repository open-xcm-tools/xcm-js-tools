import { EndpointOption } from '@polkadot/apps-config/endpoints/types';
import { SimpleXcm } from './simplexcm';
import {
  concatInterior,
  isChainUniversalLocation,
  parachainUniveralLocation,
  relaychainUniversalLocation
} from './util';
import { InteriorLocation, Location } from './xcmtypes';
import {
  prodRelayPolkadot,
  prodParasPolkadotCommon,
  prodParasPolkadot,
  prodRelayKusama,
  prodParasKusamaCommon,
  prodParasKusama
} from '@polkadot/apps-config';
import _ from 'lodash';
import { ApiPromise, WsProvider } from '@polkadot/api';

export type Ecosystem = 'Polkadot' | 'Kusama';

export interface ChainInfo {
  chainId: string;
  universalLocation: InteriorLocation;
  endpoints: string[];
}

export interface CurrencyInfo {
  symbol: string;
  decimals: number;
  universalLocation: InteriorLocation;
}

export class Registry {
  chainInfos: Map<string, ChainInfo>;
  universalLocations: Map<string, InteriorLocation>;
  relativeLocations: Map<string, Location>;
  currencyInfos: Map<string, CurrencyInfo>;

  constructor() {
    this.chainInfos = new Map();
    this.universalLocations = new Map();
    this.relativeLocations = new Map();
    this.currencyInfos = new Map();
  }

  connectXcm(chainId: string): Promise<SimpleXcm> {
    return SimpleXcm.create(chainId, this);
  }

  addChain(info: ChainInfo): Registry {
    if (!isChainUniversalLocation(info.universalLocation)) {
      throw new Error(
        `${info.chainId}: the provided location is not a chain universal location`
      );
    }

    if (info.endpoints.length == 0) {
      throw new Error(`${info.chainId}: no endpoints provided`);
    }

    info.endpoints = [...new Set(info.endpoints)];

    this.chainInfos.set(locationToStringKey(info.universalLocation), info);
    this.addUniveralLocation(info.chainId, info.universalLocation);

    return this;
  }

  addEcosystemChains(ecosystem: Ecosystem) {
    switch (ecosystem) {
      case 'Polkadot':
        return this.#addRelayAndParachains(
          relaychainUniversalLocation('Polkadot'),
          prodRelayPolkadot,
          [...prodParasPolkadotCommon, ...prodParasPolkadot]
        );

      case 'Kusama':
        return this.#addRelayAndParachains(
          relaychainUniversalLocation('Kusama'),
          prodRelayKusama,
          [...prodParasKusamaCommon, ...prodParasKusama]
        );

      default:
        throw new Error(`${ecosystem}: unknown ecosystem`);
    }
  }

  addCurrency(info: CurrencyInfo) {
    this.currencyInfos.set(locationToStringKey(info.universalLocation), info);

    this.addUniveralLocation(info.symbol, info.universalLocation);

    return this;
  }

  async addNativeCurrency(chainId: string) {
    const chainInfo = this.chainInfoById(chainId);

    const provider = new WsProvider(chainInfo.endpoints);
    const api = await ApiPromise.create({ provider });

    if (api.registry.chainTokens.length > 0) {
      const symbol = api.registry.chainTokens[0];
      const decimals = api.registry.chainDecimals[0];
      const universalLocation = chainLocationToNativeCurrencyLocation(
        chainInfo.universalLocation
      );

      this.addCurrency({
        symbol,
        decimals,
        universalLocation
      });
    } else {
      console.warn(`${chainId}: no chain tokens found, skip`);
    }

    await api.disconnect();
  }

  addUniveralLocation(locationName: string, location: InteriorLocation) {
    if (this.relativeLocations.get(locationName)) {
      throw new Error(
        `${locationName}: can't be registered as a universal location because it's already a relative one`
      );
    }

    this.universalLocations.set(locationName, location);
    return this;
  }

  universalLocation(name: string) {
    return this.universalLocations.get(name);
  }

  addRelativeLocation(locationName: string, location: Location) {
    if (this.universalLocations.get(locationName)) {
      throw new Error(
        `${locationName}: can't be registered as a relative location because it's already a universal one`
      );
    }

    this.relativeLocations.set(locationName, location);
    return this;
  }

  relativeLocation(name: string) {
    return this.relativeLocations.get(name);
  }

  chainInfoById(chainId: string) {
    const chainLocation = this.universalLocation(chainId);

    if (!chainLocation) {
      throw new Error(`${chainId}: chain's universal location is not found`);
    }

    return this.chainInfoByLocation(chainLocation);
  }

  chainInfoByLocation(location: InteriorLocation) {
    const chainInfo = this.chainInfos.get(locationToStringKey(location));

    if (!chainInfo) {
      const locationStr = JSON.stringify(location);
      throw new Error(`${locationStr}: no chain info found`);
    }

    return chainInfo;
  }

  currencyInfoBySymbol(symbol: string) {
    const currencyLocation = this.universalLocation(symbol);

    if (!currencyLocation) {
      throw new Error(`${symbol}: currency's universal location is not found`);
    }

    return this.currencyInfoByLocation(currencyLocation);
  }

  currencyInfoByLocation(location: InteriorLocation) {
    const currencyInfo = this.currencyInfos.get(locationToStringKey(location));

    if (!currencyInfo) {
      const locationStr = JSON.stringify(location);
      throw new Error(`${locationStr}: no currency info found`);
    }

    return currencyInfo;
  }

  #addRelayAndParachains(
    relayUniversalLocation: InteriorLocation,
    relayEndpointOption: EndpointOption,
    paraEndpointOptions: EndpointOption[]
  ) {
    const relayEndpoints = providersToWssEndpoints(
      relayEndpointOption.providers
    );
    this.addChain({
      chainId: relayEndpointOption.text,
      universalLocation: relayUniversalLocation,
      endpoints: relayEndpoints
    });

    for (const para of paraEndpointOptions) {
      if (!para.paraId) {
        console.warn(`${para.text}: no para ID is found, skip`);
        continue;
      }

      const paraUniversalLocation = concatInterior(relayUniversalLocation, {
        X1: [{ Parachain: para.paraId }]
      });

      const paraEndpoints = providersToWssEndpoints(para.providers);
      if (paraEndpoints.length == 0) {
        console.warn(`${para.text}: no wss:// endpoints found, skip`);
        continue;
      }

      this.addChain({
        chainId: para.text,
        universalLocation: paraUniversalLocation,
        endpoints: paraEndpoints
      });
    }

    return this;
  }
}

function providersToWssEndpoints(providers: Record<string, string>): string[] {
  return Object.values(providers).filter((endpoint) =>
    endpoint.startsWith('wss://')
  );
}

function chainLocationToNativeCurrencyLocation(
  chainLocation: InteriorLocation
) {
  const acalaLocation = parachainUniveralLocation('Polkadot', 2000);
  const karuraLocation = parachainUniveralLocation('Kusama', 2000);

  if (_.isEqual(chainLocation, acalaLocation)) {
    return concatInterior(acalaLocation, {
      X1: [
        {
          GeneralKey: {
            length: 2,
            data: '0x0000'
          }
        }
      ]
    });
  } else if (_.isEqual(chainLocation, karuraLocation)) {
    return concatInterior(karuraLocation, {
      X1: [
        {
          GeneralKey: {
            length: 2,
            data: '0x0080'
          }
        }
      ]
    });
  } else {
    return chainLocation;
  }
}

function locationToStringKey(location: InteriorLocation) {
  return JSON.stringify(location);
}
