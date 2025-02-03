export type XcmVersion = 2 | 3 | 4 | 5;
export const CURRENT_XCM_VERSION: XcmVersion = 5;
export const MIN_XCM_VERSION: XcmVersion = 2;

export type Ecosystem = 'Polkadot' | 'Kusama';

export interface ChainIdentity {
  name: string;
  universalLocation: InteriorLocation;
}
export interface ChainInfo {
  identity: ChainIdentity;
  endpoints: string[];
}
export interface CurrencyInfo {
  symbol: string;
  decimals: number;
  universalLocation: InteriorLocation;
}

export type PalletXcmName = 'polkadotXcm' | 'xcmPallet';

export type XcmExecutionEffect = {
  totalFeesNeeded: bigint;
  sentPrograms: SentPrograms[];
};

export type XcmProgram = unknown;

export type SentPrograms = {
  destination: Location;
  programs: XcmProgram[];
};

export type RegistryLookup = string;
export type LocationLookup = Location | RegistryLookup;
export type InteriorLocationLookup = InteriorLocation | RegistryLookup;
export type AssetIdLookup = AssetId | RegistryLookup;
export type AssetLookup = GenericAsset<AssetId | RegistryLookup, Fungibility>;

export type AnyLocation = LocationV2 | LocationV3 | LocationV4 | LocationV5;
export type AnyAssetId = AssetIdV2 | AssetIdV3 | AssetIdV4 | AssetIdV5;
export type AnyAsset = AssetV2 | AssetV3 | AssetV4 | AssetV5;
export type AnyAssetInstance =
  | AssetInstanceV5
  | AssetInstanceV4
  | AssetInstanceV3
  | AssetInstanceV2;

export type AnyNetworkId =
  | NetworkIdV5
  | NetworkIdV4
  | NetworkIdV3
  | NetworkIdV2;
export type AnyBodyId = BodyIdV4 | BodyIdV3 | BodyIdV2;
export type AnyJunction = JunctionV4 | JunctionV3 | JunctionV2;
export type AnyInterior = InteriorV4 | InteriorV3 | InteriorV2;
export type AnyFungibility = FungibilityV4 | FungibilityV3 | FungibilityV2;

export type InteriorLocation = Interior;

export type Versioned<V2, V3, V4, V5> =
  | {v2: V2}
  | {v3: V3}
  | {v4: V4}
  | {v5: V5};

export type VersionedAssetId = Versioned<
  AssetIdV2,
  AssetIdV3,
  AssetIdV4,
  AssetIdV5
>;
export type VersionedAsset = Versioned<AssetV2, AssetV3, AssetV4, AssetV5>;
export type VersionedAssets = Versioned<
  AssetV2[],
  AssetV3[],
  AssetV4[],
  AssetV5[]
>;
export type VersionedLocation = Versioned<
  LocationV2,
  LocationV3,
  LocationV4,
  LocationV5
>;

export type Asset = GenericAsset<AssetId, Fungibility>;
export type FungibleAnyAsset = GenericAsset<AnyAssetId, Fungible>;

type GenericAsset<Id, Fun> = {
  id: Id;
  fun: Fun;
};

export type AssetV5 = GenericAsset<AssetIdV5, FungibilityV5>;
export type AssetV4 = GenericAsset<AssetIdV4, FungibilityV4>;
export type AssetV3 = GenericAsset<AssetIdV3, FungibilityV3>;
export type AssetV2 = GenericAsset<AssetIdV2, FungibilityV2>;

export type AssetId = AssetIdV4;
export type AssetIdV4 = LocationV4;
export type AssetIdV5 = AssetIdV4;
export type AssetIdV3 = {concrete: LocationV3} | {abstract: Uint8Array};
export type AssetIdV2 = {concrete: LocationV2} | {abstract: Uint8Array};

// todo - should be a union, V5, or V4 (because V4 is wider than V5)
export type Location = LocationV4;

type GenericLocation<Interior> = {
  parents: bigint;
  interior: Interior;
};

export type LocationV2 = GenericLocation<InteriorV2>;
export type LocationV3 = GenericLocation<InteriorV3>;
export type LocationV4 = GenericLocation<InteriorV4>;
export type LocationV5 = GenericLocation<InteriorV5>;

export type Fungibility = FungibilityV5;
export type VersionedFungibility = Versioned<
  FungibilityV2,
  FungibilityV3,
  FungibilityV4,
  FungibilityV5
>;

type Fungible = {fungible: bigint};
type NonFungible<Instance> = {nonFungible: Instance};

type GenericFungibility<Instance> = Fungible | NonFungible<Instance>;

export type FungibilityV2 = GenericFungibility<AssetInstanceV2>;
export type FungibilityV3 = GenericFungibility<AssetInstanceV3>;
export type FungibilityV4 = GenericFungibility<AssetInstanceV4>;
export type FungibilityV5 = GenericFungibility<AssetInstanceV5>;

export type AssetInstance = AssetInstanceV4;

export type AssetInstanceV2 =
  | 'undefined'
  | {index: bigint}
  | {array4: string | Uint8Array}
  | {array8: string | Uint8Array}
  | {array16: string | Uint8Array}
  | {array32: string | Uint8Array}
  | {blob: string | Uint8Array};
export type AssetInstanceV3 = Exclude<
  AssetInstanceV2,
  {blob: string | Uint8Array}
>;
export type AssetInstanceV4 = AssetInstanceV3;
export type AssetInstanceV5 = AssetInstanceV4;

type GenericJunctions<
  J,
  Length extends number,
  ResultTuple extends J[] = [],
> = /* If Length == 1 then X1 */ Length extends 1
  ? {x1: [J]}
  : /* X<Length>: ResultTuple */ ResultTuple['length'] extends Length
    ? {[Variant in `x${Length}`]: ResultTuple}
    : /* Accumulate the ResultTuple */ GenericJunctions<
        J,
        Length,
        [...ResultTuple, J]
      >;

export type Junctions<Length extends number> = JunctionsV4<Length>;
export type JunctionsV2<Length extends number> = GenericJunctions<
  JunctionV2,
  Length
>;
export type JunctionsV3<Length extends number> = GenericJunctions<
  JunctionV3,
  Length
>;
export type JunctionsV4<Length extends number> = GenericJunctions<
  JunctionV4,
  Length
>;
export type JunctionsV5<Length extends number> = GenericJunctions<
  JunctionV5,
  Length
>;

export type Interior = InteriorV4;
export type InteriorV2 =
  | 'here'
  | {x1: JunctionV2}
  | JunctionsV2<2>
  | JunctionsV2<3>
  | JunctionsV2<4>
  | JunctionsV2<5>
  | JunctionsV2<6>
  | JunctionsV2<7>
  | JunctionsV2<8>;
export type InteriorV3 =
  | 'here'
  | {x1: JunctionV3}
  | JunctionsV3<2>
  | JunctionsV3<3>
  | JunctionsV3<4>
  | JunctionsV3<5>
  | JunctionsV3<6>
  | JunctionsV3<7>
  | JunctionsV3<8>;
export type InteriorV4 =
  | 'here'
  | JunctionsV4<1>
  | JunctionsV4<2>
  | JunctionsV4<3>
  | JunctionsV4<4>
  | JunctionsV4<5>
  | JunctionsV4<6>
  | JunctionsV4<7>
  | JunctionsV4<8>;
export type InteriorV5 =
  | 'here'
  | JunctionsV5<1>
  | JunctionsV5<2>
  | JunctionsV5<3>
  | JunctionsV5<4>
  | JunctionsV5<5>
  | JunctionsV5<6>
  | JunctionsV5<7>
  | JunctionsV5<8>;

export type NetworkId = NetworkIdV5;
export type NetworkIdV2 =
  | 'any'
  | {named: string | Uint8Array}
  | 'polkadot'
  | 'kusama';
export type NetworkIdV3 =
  | {byGenesis: string | Uint8Array}
  | {byFork: {blockNumber: bigint; blockHash: string | Uint8Array}}
  | 'polkadot'
  | 'kusama'
  | 'westend'
  | 'rococo'
  | 'wococo'
  | {ethereum: {chainId: bigint}}
  | 'bitcoinCore'
  | 'bitcoinCash'
  | 'polkadotBulletin';
export type NetworkIdV4 = NetworkIdV3;

export type NetworkIdV5 =
  | {byGenesis: string | Uint8Array}
  | {byFork: {blockNumber: bigint; blockHash: string | Uint8Array}}
  | 'polkadot'
  | 'kusama'
  | {ethereum: {chainId: bigint}}
  | 'bitcoinCore'
  | 'bitcoinCash'
  | 'polkadotBulletin';

export type BodyId = BodyIdV5;
export type BodyIdV2 =
  | 'unit'
  | {named: string | Uint8Array}
  | {index: bigint}
  | 'executive'
  | 'technical'
  | 'legislative'
  | 'judicial'
  | 'defense'
  | 'administration'
  | 'treasury';
export type BodyIdV3 =
  | Exclude<BodyIdV2, {named: string | Uint8Array}>
  | {moniker: string | Uint8Array};
export type BodyIdV4 = BodyIdV3;
export type BodyIdV5 = BodyIdV4;

export type Fraction = {nom: bigint; denom: bigint};
export type BodyPart =
  | 'voice'
  | {members: {count: bigint}}
  | {fraction: Fraction}
  | {atLeastProportion: Fraction}
  | {moreThanProportion: Fraction};

export type Junction = JunctionV5;
export type JunctionV2 =
  | {parachain: bigint}
  | {accountId32: {network: NetworkIdV2; id: string | Uint8Array}}
  | {accountIndex64: {network: NetworkIdV2; index: bigint}}
  | {accountKey20: {network: NetworkIdV2; key: string | Uint8Array}}
  | {palletInstance: bigint}
  | {generalIndex: bigint}
  | {generalKey: string | Uint8Array}
  | 'onlyChild'
  | {plurality: {id: BodyIdV2; part: BodyPart}};

export type JunctionV3 =
  | {parachain: bigint}
  | {accountId32: {network?: NetworkIdV3 | null; id: string | Uint8Array}}
  | {accountIndex64: {network?: NetworkIdV3 | null; index: bigint}}
  | {accountKey20: {network?: NetworkIdV3 | null; key: string | Uint8Array}}
  | {palletInstance: bigint}
  | {generalIndex: bigint}
  | {generalKey: {length: bigint; data: string | Uint8Array}}
  | 'onlyChild'
  | {plurality: {id: BodyIdV3; part: BodyPart}}
  | {globalConsensus: NetworkIdV3};
export type JunctionV4 = JunctionV3;

export type JunctionV5 =
  | {parachain: bigint}
  | {accountId32: {network?: NetworkIdV5 | null; id: string | Uint8Array}}
  | {accountIndex64: {network?: NetworkIdV5 | null; index: bigint}}
  | {accountKey20: {network?: NetworkIdV5 | null; key: string | Uint8Array}}
  | {palletInstance: bigint}
  | {generalIndex: bigint}
  | {generalKey: {length: bigint; data: string | Uint8Array}}
  | 'onlyChild'
  | {plurality: {id: BodyIdV3; part: BodyPart}}
  | {globalConsensus: NetworkIdV5};
