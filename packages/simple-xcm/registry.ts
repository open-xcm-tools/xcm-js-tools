import {EndpointOption} from '@polkadot/apps-config/endpoints/types';
import {
  prodRelayPolkadot,
  prodParasPolkadotCommon,
  prodParasPolkadot,
  prodRelayKusama,
  prodParasKusamaCommon,
  prodParasKusama,
} from '@polkadot/apps-config';
import {ApiPromise, WsProvider} from '@polkadot/api';
import {
  ChainInfo,
  CurrencyInfo,
  Ecosystem,
  InteriorLocation,
  Location,
} from '@open-xcm-tools/xcm-types';
import {SimpleXcm} from './simplexcm';
import {
  isChainUniversalLocation,
  parachainUniversalLocation,
  relaychainUniversalLocation,
} from './main-utils';
import {
  compareInteriorLocation,
  concatInterior,
  convertObjToJsonString,
  sanitizeInterior,
  sanitizeLocation,
} from '@open-xcm-tools/xcm-util';

/**
 * A `Registry` object can store and then provide information about chains, currencies, and locations.
 *
 * Each set method has at least one get method.
 * The different get methods use different types as keys.
 *
 * For example, the `chainInfoByName` gets the chain info by its in-registry name,
 * while the `chainInfoByUniversalLocation` fetches the information by the chain's universal location.
 */
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
   * @param chainName - The name of the chain to connect.
   * @returns A promise that resolves to a SimpleXcm instance.
   * @example
   * ```typescript
   * const xcm: SimpleXcm = await registry.connectXcm('Unique Network');
   * ```
   */
  connectXcm(chainName: string): Promise<SimpleXcm> {
    return SimpleXcm.connect(chainName, this);
  }

  /**
   * Adds an external chain to the `Registry` storage.
   * @param chain - Information about the new chain.
   * @returns The current instance of the Registry.
   * @example
   * ```typescript
   * registry.addChain(<ChainInfo>{
   *   chainName: 'AssetHub',
   *   universalLocation: parachainUniversalLocation('polkadot', 1000n),
   *   endpoints: [
   *     'wss://asset-hub-polkadot-rpc.dwellir.com',
   *     'wss://sys.ibp.network/asset-hub-polkadot',
   *     // Add more endpoints as needed
   *   ],
   * });
   * ```
   */
  addChain(chain: ChainInfo): Registry {
    sanitizeInterior(chain.identity.universalLocation);
    if (!isChainUniversalLocation(chain.identity.universalLocation)) {
      throw new Error(
        `${chain.identity.name}: the provided location is not a chain universal location`,
      );
    }

    if (chain.endpoints.length === 0) {
      throw new Error(`${chain.identity.name}: no endpoints provided`);
    }

    chain.endpoints = [...new Set(chain.endpoints)];

    this.chainInfos.set(
      convertObjToJsonString(chain.identity.universalLocation),
      chain,
    );
    this.addUniversalLocation(
      chain.identity.name,
      chain.identity.universalLocation,
    );

    return this;
  }

  /**
   * Adds chains from the specified ecosystem to the Registry.
   * This method populates the Registry using the PolkadotJS Apps information
   * about the Polkadot and Kusama blockchains (including the relay chain).
   *
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
   * @param currency - Information about the new currency.
   * @returns The current instance of the Registry.
   * @example
   * ```typescript
   * registry.addCurrency(<CurrencyInfo>{
   *    symbol: 'USDT',
   *    decimals: 6,
   *    universalLocation: universalLocation('polkadot', [
   *      {parachain: 1000n},
   *      {palletInstance: 50n},
   *      {generalIndex: 1984n},
   *    ]),
   * });
   * ```
   */
  addCurrency(currency: CurrencyInfo): Registry {
    sanitizeInterior(currency.universalLocation);
    this.currencyInfos.set(
      convertObjToJsonString(currency.universalLocation),
      currency,
    );
    this.addUniversalLocation(currency.symbol, currency.universalLocation);

    return this;
  }

  /**
   * Adds the native currency of the given chain.
   * The currency's info will be fetched from the chain's metadata.
   *
   * The currency will be stored with two symbols:
   * the actual symbol from the chain's metadata
   * and an alternative symbol coinciding with the chain's name.
   * @param chainName - The name of the chain.
   * @returns A promise that resolves when the currency is added.
   * @example
   * ```typescript
   * await registry.addNativeCurrency('Unique Network');
   * ```
   */
  async addNativeCurrency(chainName: string): Promise<void> {
    const chainInfo = this.chainInfoByName(chainName);

    const provider = new WsProvider(chainInfo.endpoints);
    const api = await ApiPromise.create({provider});

    if (api.registry.chainTokens.length > 0) {
      const symbol = api.registry.chainTokens[0];
      const decimals = api.registry.chainDecimals[0];
      const universalLocation = chainLocationToNativeCurrencyLocation(
        chainInfo.identity.universalLocation,
      );

      this.addCurrency({
        symbol,
        decimals,
        universalLocation,
      });

      this.addCurrency({
        symbol: chainName,
        decimals,
        universalLocation,
      });
    } else {
      console.warn(`${chainName}: no chain tokens found, skip`);
    }

    await api.disconnect();
  }

  /**
   * Adds a universal location to the `Registry` storage.
   * @param name - The name for the universal location.
   * @param universalLocation - The universal location.
   * @returns The current instance of the Registry.
   * @example
   * ```typescript
   * registry.addUniversalLocation(
   *  'Unique Network Chain Location',
   *  parachainUniversalLocation('polkadot', 2037n),
   * );
   * ```
   */
  addUniversalLocation(
    name: string,
    universalLocation: InteriorLocation,
  ): Registry {
    sanitizeInterior(universalLocation);
    if (this.relativeLocations.get(name)) {
      throw new Error(
        `${name}: can't be registered as a universal location because it's already a relative one`,
      );
    }

    this.universalLocations.set(name, universalLocation);
    return this;
  }

  /**
   * Returns the universal location by name if it exists.
   * @param name - The name for the universal location.
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
   * @param name - The name for the location.
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
  addRelativeLocation(name: string, location: Location): Registry {
    sanitizeLocation(location);
    if (this.universalLocations.get(name)) {
      throw new Error(
        `${name}: can't be registered as a relative location because it's already a universal one`,
      );
    }

    this.relativeLocations.set(name, location);
    return this;
  }

  /**
   * Returns the relative location by name if it exists.
   * @param name - The name for the location.
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
   * Returns information about a chain by its in-registry name.
   * @param chainName - The name of the chain.
   * @returns The ChainInfo object.
   * @example
   * ```typescript
   * registry.chainInfoByName('Unique Network');
   * ```
   */
  chainInfoByName(chainName: string): ChainInfo {
    const chainLocation = this.universalLocation(chainName);

    if (!chainLocation) {
      throw new Error(`${chainName}: chain's universal location is not found`);
    }

    return this.chainInfoByUniversalLocation(chainLocation);
  }

  /**
   * Returns information about a chain by its universal location.
   * @param universalLocation - The chain's universal location.
   * @returns The ChainInfo object.
   * @example
   * ```typescript
   * registry.chainInfoByLocation(parachainUniversalLocation('polkadot', 2037n));
   * ```
   */
  chainInfoByUniversalLocation(universalLocation: InteriorLocation): ChainInfo {
    sanitizeInterior(universalLocation);
    const locationStr = convertObjToJsonString(universalLocation);
    const chainInfo = this.chainInfos.get(locationStr);

    if (!chainInfo) {
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

    return this.currencyInfoByUniversalLocation(currencyLocation);
  }

  /**
   * Returns information about a currency by its universal location.
   * @param universalLocation - The currency's universal location.
   * @returns The CurrencyInfo object.
   * @example
   * ```typescript
   * registry.currencyInfoByLocation(parachainUniversalLocation('polkadot', 2037n));
   * ```
   */
  currencyInfoByUniversalLocation(
    universalLocation: InteriorLocation,
  ): CurrencyInfo {
    sanitizeInterior(universalLocation);
    const locationStr = convertObjToJsonString(universalLocation);
    const currencyInfo = this.currencyInfos.get(locationStr);

    if (!currencyInfo) {
      throw new Error(`${locationStr}: no currency info found`);
    }

    return currencyInfo;
  }

  /**
   * Adds all blockchains from an ecosystem to the `Registry`.
   * @param relayUniversalLocation - The relay's universal location.
   * @param relayEndpointOption - Relay details.
   * @param paraEndpointOptions - Parachain details.
   * @returns The current instance of the Registry.
   */
  #addRelayAndParachains(
    relayUniversalLocation: InteriorLocation,
    relayEndpointOption: EndpointOption,
    paraEndpointOptions: EndpointOption[],
  ): Registry {
    sanitizeInterior(relayUniversalLocation);
    const relayEndpoints = providersToWssEndpoints(
      relayEndpointOption.providers,
    );
    this.addChain({
      identity: {
        name: relayEndpointOption.text,
        universalLocation: relayUniversalLocation,
      },
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
        identity: {
          name: para.text,
          universalLocation: paraUniversalLocation,
        },
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

  if (!compareInteriorLocation(chainLocation, acalaLocation)) {
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
  } else if (!compareInteriorLocation(chainLocation, karuraLocation)) {
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
