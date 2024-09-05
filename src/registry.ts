import {EndpointOption} from '@polkadot/apps-config/endpoints/types';
import {SimpleXcm} from './simplexcm';
import {
  concatInterior,
  isChainUniversalLocation,
  parachainUniversalLocation,
  relaychainUniversalLocation,
} from './util';
import {InteriorLocation, Location} from './xcmtypes';
import {
  prodRelayPolkadot,
  prodParasPolkadotCommon,
  prodParasPolkadot,
  prodRelayKusama,
  prodParasKusamaCommon,
  prodParasKusama,
} from '@polkadot/apps-config';
import _ from 'lodash';
import {ApiPromise, WsProvider} from '@polkadot/api';
import {canonicalize} from 'json-canonicalize';

export type Ecosystem = 'Polkadot' | 'Kusama';

/**
 * Information about a chain stored in the `Registry`.
 * @example
 * ```typescript
 * {
 *     chainId: 'AssetHub',
 *     universalLocation: parachainUniversalLocation('polkadot', 2001n),
 *     endpoints: [
 *       'wss://asset-hub-polkadot-rpc.dwellir.com',
 *       'wss://sys.ibp.network/asset-hub-polkadot',
 *       // Add more endpoints as needed
 *     ],
 * }
 * ```
 */
export interface ChainInfo {
  chainId: string;
  universalLocation: InteriorLocation;
  endpoints: string[];
}

/**
 * Information about a currency stored in the `Registry`.
 * @example
 * ```typescript
 * {
 *    symbol: 'DOT',
 *    decimals: 12,
 *    universalLocation: parachainUniversalLocation('polkadot', 2001n),
 * }
 * ```
 */
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

  /**
   * Connects to the XCM pallet of a chain.
   * @param chainId - The ID of the chain to connect.
   * @returns A promise that resolves to a SimpleXcm instance.
   * @example
   * ```typescript
   * const xcm: SimpleXcm = await registry.connectXcm('Unique Network');
   * ```
   */
  connectXcm(chainId: string): Promise<SimpleXcm> {
    return SimpleXcm.create(chainId, this);
  }

  /**
   * Adds an external chain to the `Registry` storage.
   * @param info - Information about the chain that isn't from the connected ecosystem.
   * @returns The current instance of the Registry.
   * @example
   * ```typescript
   * registry.addChain(<ChainInfo>{
   *   chainId: 'AssetHub',
   *   universalLocation: parachainUniversalLocation('polkadot', 2001n),
   *   endpoints: [
   *     'wss://asset-hub-polkadot-rpc.dwellir.com',
   *     'wss://sys.ibp.network/asset-hub-polkadot',
   *     // Add more endpoints as needed
   *   ],
   * });
   * ```
   */
  addChain(info: ChainInfo): Registry {
    if (!isChainUniversalLocation(info.universalLocation)) {
      throw new Error(
        `${info.chainId}: the provided location is not a chain universal location`,
      );
    }

    if (info.endpoints.length === 0) {
      throw new Error(`${info.chainId}: no endpoints provided`);
    }

    info.endpoints = [...new Set(info.endpoints)];

    this.chainInfos.set(canonicalize(info.universalLocation), info);
    this.addUniversalLocation(info.chainId, info.universalLocation);

    return this;
  }

  /**
   * Adds chains from the specified ecosystem to the Registry.
   * @param ecosystem - The name of the ecosystem (e.g., 'Polkadot').
   * @returns The current instance of the Registry.
   * @example
   * ```typescript
   * registry.addEcosystemChains('Polkadot');
   * ```
   */
  addEcosystemChains(ecosystem: Ecosystem): Registry {
    switch (ecosystem) {
      case 'Polkadot':
        return this.#addRelayAndParachains(
          relaychainUniversalLocation('polkadot'),
          prodRelayPolkadot,
          [...prodParasPolkadotCommon, ...prodParasPolkadot],
        );

      case 'Kusama':
        return this.#addRelayAndParachains(
          relaychainUniversalLocation('kusama'),
          prodRelayKusama,
          [...prodParasKusamaCommon, ...prodParasKusama],
        );

      default:
        throw new Error(`${ecosystem}: unknown ecosystem`);
    }
  }

  /**
   * Adds an external currency to the `Registry` storage.
   * @param info - Information about the currency that isn't from the connected ecosystem.
   * @returns The current instance of the Registry.
   * @example
   * ```typescript
   * registry.addCurrency(<CurrencyInfo>{
   *    symbol: 'USDT',
   *    decimals: 12,
   *    universalLocation: parachainUniversalLocation('polkadot', 2001n),
   * });
   * ```
   */
  addCurrency(info: CurrencyInfo): Registry {
    this.currencyInfos.set(canonicalize(info.universalLocation), info);
    this.addUniversalLocation(info.symbol, info.universalLocation);

    return this;
  }

  /**
   * Adds the native currency from the ecosystem connected to the Registry storage.
   * @param chainId - The name of the native currency chain from the ecosystem.
   * @returns A promise that resolves when the currency is added.
   * @example
   * ```typescript
   * await registry.addNativeCurrency('Unique Network');
   * ```
   */
  async addNativeCurrency(chainId: string): Promise<void> {
    const chainInfo = this.chainInfoById(chainId);

    const provider = new WsProvider(chainInfo.endpoints);
    const api = await ApiPromise.create({provider});

    if (api.registry.chainTokens.length > 0) {
      const symbol = api.registry.chainTokens[0];
      const decimals = api.registry.chainDecimals[0];
      const universalLocation = chainLocationToNativeCurrencyLocation(
        chainInfo.universalLocation,
      );

      this.addCurrency({
        symbol,
        decimals,
        universalLocation,
      });

      this.addCurrency({
        symbol: chainId,
        decimals,
        universalLocation,
      });
    } else {
      console.warn(`${chainId}: no chain tokens found, skip`);
    }

    await api.disconnect();
  }

  /**
   * Adds a universal location to the `Registry` storage.
   * @param locationName - The key-name for the location.
   * @param location - The universal location.
   * @returns The current instance of the Registry.
   * @example
   * ```typescript
   * registry.addUniversalLocation(
   *  'SomeChainLocation',
   *  parachainUniversalLocation('polkadot', 2001n),
   * );
   * ```
   */
  addUniversalLocation(
    locationName: string,
    location: InteriorLocation,
  ): Registry {
    if (this.relativeLocations.get(locationName)) {
      throw new Error(
        `${locationName}: can't be registered as a universal location because it's already a relative one`,
      );
    }

    this.universalLocations.set(locationName, location);
    return this;
  }

  /**
   * Returns the universal location by key-name if it exists.
   * @param name - The key-name for the location.
   * @returns The universal location or undefined if not found.
   * @example
   * ```typescript
   * registry.universalLocation('SomeChainLocation');
   * ```
   */
  universalLocation(name: string): InteriorLocation | undefined {
    return this.universalLocations.get(name);
  }

  /**
   * Adds a relative location to the `Registry` storage.
   * @param locationName - The key-name for the location.
   * @param location - The relative location.
   * @returns The current instance of the Registry.
   * @example
   * ```typescript
   * registry.addRelativeLocation(
   *   'MyAccountLocation',
   *   location(0n, [
   *     {
   *       accountId32: {
   *         id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
   *       },
   *     },
   *   ]),
   * );
   * ```
   */
  addRelativeLocation(locationName: string, location: Location): Registry {
    if (this.universalLocations.get(locationName)) {
      throw new Error(
        `${locationName}: can't be registered as a relative location because it's already a universal one`,
      );
    }

    this.relativeLocations.set(locationName, location);
    return this;
  }

  /**
   * Returns the relative location by key-name if it exists.
   * @param name - The key-name for the location.
   * @returns The relative location or undefined if not found.
   * @example
   * ```typescript
   * registry.relativeLocation('MyAccountLocation');
   * ```
   */
  relativeLocation(name: string): Location | undefined {
    return this.relativeLocations.get(name);
  }

  /**
   * Returns information about a chain by its name.
   * @param chainId - The name of the chain.
   * @returns The ChainInfo object.
   * @example
   * ```typescript
   * registry.chainInfoById('Unique Network');
   * ```
   */
  chainInfoById(chainId: string): ChainInfo {
    const chainLocation = this.universalLocation(chainId);

    if (!chainLocation) {
      throw new Error(`${chainId}: chain's universal location is not found`);
    }

    return this.chainInfoByLocation(chainLocation);
  }

  /**
   * Returns information about a chain by its location.
   * @param location - The chain location.
   * @returns The ChainInfo object.
   * @example
   * ```typescript
   * registry.chainInfoByLocation(parachainUniversalLocation('polkadot', 2001n));
   * ```
   */
  chainInfoByLocation(location: InteriorLocation): ChainInfo {
    const chainInfo = this.chainInfos.get(canonicalize(location));

    if (!chainInfo) {
      const locationStr = canonicalize(location);
      throw new Error(`${locationStr}: no chain info found`);
    }

    return chainInfo;
  }

  /**
   * Returns information about a currency by its symbol.
   * @param symbol - The currency symbol.
   * @returns The CurrencyInfo object.
   * @example
   * ```typescript
   * registry.currencyInfoBySymbol('DOT');
   * ```
   */
  currencyInfoBySymbol(symbol: string): CurrencyInfo {
    const currencyLocation = this.universalLocation(symbol);

    if (!currencyLocation) {
      throw new Error(`${symbol}: currency's universal location is not found`);
    }

    return this.currencyInfoByLocation(currencyLocation);
  }

  /**
   * Returns information about a currency by its location.
   * @param location - The currency location.
   * @returns The CurrencyInfo object.
   * @example
   * ```typescript
   * registry.currencyInfoByLocation(parachainUniversalLocation('polkadot', 2001n));
   * ```
   */
  currencyInfoByLocation(location: InteriorLocation): CurrencyInfo {
    const currencyInfo = this.currencyInfos.get(canonicalize(location));

    if (!currencyInfo) {
      const locationStr = canonicalize(location);
      throw new Error(`${locationStr}: no currency info found`);
    }

    return currencyInfo;
  }

  /**
   * Adds an ecosystem to the `Registry` and retrieves its parachains.
   * @param relayUniversalLocation - The universal relay location.
   * @param relayEndpointOption - Relay details.
   * @param paraEndpointOptions - Parachain details.
   * @returns The current instance of the Registry.
   */
  #addRelayAndParachains(
    relayUniversalLocation: InteriorLocation,
    relayEndpointOption: EndpointOption,
    paraEndpointOptions: EndpointOption[],
  ): Registry {
    const relayEndpoints = providersToWssEndpoints(
      relayEndpointOption.providers,
    );
    this.addChain({
      chainId: relayEndpointOption.text,
      universalLocation: relayUniversalLocation,
      endpoints: relayEndpoints,
    });

    for (const para of paraEndpointOptions) {
      if (!para.paraId) {
        console.warn(`${para.text}: no para ID is found, skip`);
        continue;
      }

      const paraUniversalLocation = concatInterior(relayUniversalLocation, {
        x1: [{parachain: BigInt(para.paraId)}],
      });

      const paraEndpoints = providersToWssEndpoints(para.providers);
      if (paraEndpoints.length === 0) {
        console.warn(`${para.text}: no wss:// endpoints found, skip`);
        continue;
      }

      this.addChain({
        chainId: para.text,
        universalLocation: paraUniversalLocation,
        endpoints: paraEndpoints,
      });
    }

    return this;
  }
}

function providersToWssEndpoints(providers: Record<string, string>): string[] {
  return Object.values(providers).filter(endpoint =>
    endpoint.startsWith('wss://'),
  );
}

function chainLocationToNativeCurrencyLocation(
  chainLocation: InteriorLocation,
): InteriorLocation {
  const acalaLocation = parachainUniversalLocation('polkadot', 2000n);
  const karuraLocation = parachainUniversalLocation('kusama', 2000n);

  if (_.isEqual(chainLocation, acalaLocation)) {
    return concatInterior(acalaLocation, {
      x1: [
        {
          generalKey: {
            length: 2n,
            data: '0x0000',
          },
        },
      ],
    });
  } else if (_.isEqual(chainLocation, karuraLocation)) {
    return concatInterior(karuraLocation, {
      x1: [
        {
          generalKey: {
            length: 2n,
            data: '0x0080',
          },
        },
      ],
    });
  } else {
    return chainLocation;
  }
}
