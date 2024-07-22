import { SimpleXcm } from './simplexcm';
import { isChainUniversalLocation } from './util';
import { InteriorLocation, Location } from './xcmtypes';

export interface ChainInfo {
  chainId: string;
  universalLocation: InteriorLocation;
  endpoints: Set<string>;
}

export class Registry {
  chainInfos: Map<InteriorLocation, ChainInfo>;
  universalLocations: Map<string, InteriorLocation>;
  relativeLocations: Map<string, Location>;

  constructor() {
    this.chainInfos = new Map();
    this.universalLocations = new Map();
    this.relativeLocations = new Map();
  }

  connectXcm(chainId: string): Promise<SimpleXcm> {
    return SimpleXcm.create(chainId, this);
  }

  addChain(
    chainId: string,
    universalLocation: InteriorLocation,
    endpoints: string[]
  ): Registry {
    if (!isChainUniversalLocation(universalLocation)) {
      throw new Error(
        `${chainId}: the provided location is not a chain universal location`
      );
    }

    if (endpoints.length == 0) {
      throw new Error(`${chainId}: no endpoints provided`);
    }

    const endpointSet = new Set(endpoints);

    this.chainInfos.set(universalLocation, {
      chainId,
      universalLocation,
      endpoints: endpointSet
    });

    this.addUniveralLocation(chainId, universalLocation);

    return this;
  }

  addUniveralLocation(locationName: string, location: InteriorLocation) {
    if (this.relativeLocations.get(locationName)) {
      throw new Error(
        `${locationName}: can't registered as a universal location because it's already a relative one`
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
        `${locationName}: can't registered as a relative location because it's already a universal one`
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
    const chainInfo = this.chainInfos.get(location);

    if (!chainInfo) {
      const locationStr = JSON.stringify(location);
      throw new Error(`${locationStr}: no chain info found`);
    }

    return chainInfo;
  }
}
