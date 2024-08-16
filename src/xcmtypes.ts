export type XcmVersion = 2 | 3 | 4;
export const CURRENT_XCM_VERSION: XcmVersion = 4;
export const MIN_XCM_VERSION: XcmVersion = 2;

export type RegistryLookup = string;
export type LocationLookup = Location | RegistryLookup;
export type InteriorLocationLookup = InteriorLocation | RegistryLookup;
export type AssetIdLookup = AssetId | RegistryLookup;
export type AssetLookup = GenericAsset<AssetId | RegistryLookup, Fungibility>;

export type AnyAssetId = AssetIdV2 | AssetIdV3 | AssetIdV4;
export type AnyAsset = AssetV2 | AssetV3 | AssetV4;

export type InteriorLocation = Interior;

export type Versioned<V2, V3, V4> = { v2: V2 } | { v3: V3 } | { v4: V4 };

export type VersionedAssetId = Versioned<AssetIdV2, AssetIdV3, AssetIdV4>;
export type VersionedAsset = Versioned<AssetV2, AssetV3, AssetV4>;
export type VersionedAssets = Versioned<AssetV2[], AssetV3[], AssetV4[]>;
export type VersionedLocation = Versioned<LocationV2, LocationV3, LocationV4>;

export type Asset = GenericAsset<AssetId, Fungibility>;
export type FungibleAsset = GenericAsset<AssetId, Fungible>;

type GenericAsset<Id, Fun> = {
  id: Id;
  fun: Fun;
};

export type AssetV4 = GenericAsset<AssetIdV4, FungibilityV4>;
export type AssetV3 = GenericAsset<AssetIdV3, FungibilityV3>;
export type AssetV2 = GenericAsset<AssetIdV2, FungibilityV2>;

export type AssetId = AssetIdV4;
export type AssetIdV4 = Location;
export type AssetIdV3 = { concrete: LocationV3 } | { abstract: string };
export type AssetIdV2 = { concrete: LocationV2 } | { abstract: string };

export type Location = LocationV4;

type GenericLocation<Interior> = {
  parents: bigint;
  interior: Interior;
};

export type LocationV2 = GenericLocation<InteriorV2>;
export type LocationV3 = GenericLocation<InteriorV3>;
export type LocationV4 = GenericLocation<InteriorV4>;

export type Fungibility = FungibilityV4;
export type VersionedFungibility = Versioned<
  FungibilityV2,
  FungibilityV3,
  FungibilityV4
>;

type Fungible = { fungible: bigint };
type NonFungible<Instance> = { nonFungible: Instance };

type GenericFungibility<Instance> =
  | Fungible
  | NonFungible<Instance>;

export type FungibilityV2 = GenericFungibility<AssetInstanceV2>;
export type FungibilityV3 = GenericFungibility<AssetInstanceV3>;
export type FungibilityV4 = GenericFungibility<AssetInstanceV4>;

export type AssetInstance = AssetInstanceV4;

export type AssetInstanceV2 =
  | 'undefined'
  | { index: bigint }
  | { array4: string }
  | { array8: string }
  | { array16: string }
  | { array32: string }
  | { blob: string };
export type AssetInstanceV3 = Exclude<AssetInstanceV2, { blob: string }>;
export type AssetInstanceV4 = AssetInstanceV3;

type GenericJunctions<
  J,
  Length extends number,
  ResultTuple extends J[] = []
> = /* If Length == 1 then X1 */ Length extends 1
  ? { x1: [J] }
  : /* X<Length>: ResultTuple */ ResultTuple['length'] extends Length
    ? { [Variant in `x${Length}`]: ResultTuple }
    : /* Accumulate the ResultTuple */ GenericJunctions<
        J,
        Length,
        [...ResultTuple, J]
      >;

export type Junctions<Length extends number> = JunctionsV4<Length>;
type JunctionsV2<Length extends number> = GenericJunctions<JunctionV2, Length>;
type JunctionsV3<Length extends number> = GenericJunctions<JunctionV3, Length>;
type JunctionsV4<Length extends number> = GenericJunctions<JunctionV4, Length>;

export type Interior = InteriorV4;
export type InteriorV2 =
  | 'here'
  | { x1: JunctionV2 }
  | JunctionsV2<2>
  | JunctionsV2<3>
  | JunctionsV2<4>
  | JunctionsV2<5>
  | JunctionsV2<6>
  | JunctionsV2<7>
  | JunctionsV2<8>;
export type InteriorV3 =
  | 'here'
  | { x1: JunctionV3 }
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

export type NetworkId = NetworkIdV4;
export type NetworkIdV2 =
  | 'any'
  | { named: string }
  | 'polkadot'
  | 'kusama';
export type NetworkIdV3 =
  | { byGenesis: string }
  | { byFork: { blockNumber: bigint; blockHash: string } }
  | 'polkadot'
  | 'kusama'
  | 'westend'
  | 'rococo'
  | 'wococo'
  | { ethereum: { chainId: bigint } }
  | 'bitcoinCore'
  | 'bitcoinCash'
  | 'polkadotBulletin';
export type NetworkIdV4 = NetworkIdV3;

export type BodyId = BodyIdV4;
export type BodyIdV2 =
  | 'unit'
  | { named: string }
  | { index: bigint }
  | 'executive'
  | 'technical'
  | 'legislative'
  | 'judicial'
  | 'defense'
  | 'administration'
  | 'treasury';
export type BodyIdV3 =
  | Exclude<BodyIdV2, { named: string }>
  | { moniker: string };
export type BodyIdV4 = BodyIdV3;

export type Fraction = { nom: bigint; denom: bigint };
export type BodyPart =
  | 'voice'
  | { members: bigint }
  | { fraction: Fraction }
  | { atLeastProportion: Fraction }
  | { moreThanProportion: Fraction };

export type Junction = JunctionV4;
export type JunctionV2 =
  | { parachain: bigint }
  | { accountId32: { network: NetworkIdV2; id: string } }
  | { accountIndex64: { network: NetworkIdV2; index: bigint } }
  | { accountKey20: { network: NetworkIdV2; key: string } }
  | { palletInstance: bigint }
  | { generalIndex: bigint  }
  | { generalKey: string }
  | 'onlyChild'
  | { plurality: { id: BodyIdV2; part: BodyPart } };

export type JunctionV3 =
  | { parachain: bigint }
  | { accountId32: { network?: NetworkIdV3 | null; id: string } }
  | { accountIndex64: { network?: NetworkIdV3 | null; index: bigint } }
  | { accountKey20: { network?: NetworkIdV3 | null; key: string } }
  | { palletInstance: bigint }
  | { generalIndex: bigint }
  | { generalKey: { length: bigint; data: string } }
  | 'onlyChild'
  | { plurality: { id: BodyIdV3; part: BodyPart } }
  | { globalConsensus: NetworkIdV3 };
export type JunctionV4 = JunctionV3;
