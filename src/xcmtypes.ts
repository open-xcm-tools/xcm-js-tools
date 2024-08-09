export type XcmVersion = 2 | 3 | 4;
export const CURRENT_XCM_VERSION: XcmVersion = 4;
export const MIN_XCM_VERSION: XcmVersion = 2;

export type RegistryLookup = string;

export type InteriorLocation = Interior;

export type Versioned<V2, V3, V4> = { V2: V2 } | { V3: V3 } | { V4: V4 };

export type VersionedAsset = Versioned<AssetV2, AssetV3, AssetV4>;
export type VersionedAssets = Versioned<AssetV2[], AssetV3[], AssetV4[]>;
export type VersionedLocation = Versioned<LocationV2, LocationV3, LocationV4>;

export type AssetLookup = GenericAsset<AssetId | RegistryLookup, Fungibility>;
export type Asset = GenericAsset<AssetId, Fungibility>;

type GenericAsset<Id, Fun> = {
  id: Id;
  fun: Fun;
};

export type AssetV4 = GenericAsset<AssetIdV4, FungibilityV4>;
export type AssetV3 = GenericAsset<AssetIdV3, FungibilityV3>;
export type AssetV2 = GenericAsset<AssetIdV2, FungibilityV2>;

export type AssetId = AssetIdV4;
export type AssetIdV4 = Location;
export type AssetIdV3 = { Concrete: LocationV3 } | { Abstract: string };
export type AssetIdV2 = { Concrete: LocationV2 } | { Abstract: string };

export type Location = LocationV4;

type GenericLocation<Interior> = {
  parents: number;
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

type GenericFungibility<Instance> =
  | { Fungible: number | bigint }
  | { NonFungible: Instance };

export type FungibilityV2 = GenericFungibility<AssetInstanceV2>;
export type FungibilityV3 = GenericFungibility<AssetInstanceV3>;
export type FungibilityV4 = GenericFungibility<AssetInstanceV4>;

export type AssetInstance = AssetInstanceV4;

export type AssetInstanceV2 =
  | 'Undefined'
  | { Index: number | bigint }
  | { Array4: string }
  | { Array8: string }
  | { Array16: string }
  | { Array32: string }
  | { Blob: string };
export type AssetInstanceV3 = Exclude<AssetInstanceV2, { Blob: string }>;
export type AssetInstanceV4 = AssetInstanceV3;

type GenericJunctions<
  J,
  Length extends number,
  ResultTuple extends J[] = []
> = /* If Length == 1 then X1 */ Length extends 1
  ? { X1: [J] }
  : /* X<Length>: ResultTuple */ ResultTuple['length'] extends Length
    ? { [Variant in `X${Length}`]: ResultTuple }
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
  | 'Here'
  | { X1: JunctionV2 }
  | JunctionsV2<2>
  | JunctionsV2<3>
  | JunctionsV2<4>
  | JunctionsV2<5>
  | JunctionsV2<6>
  | JunctionsV2<7>
  | JunctionsV2<8>;
export type InteriorV3 =
  | 'Here'
  | { X1: JunctionV3 }
  | JunctionsV3<2>
  | JunctionsV3<3>
  | JunctionsV3<4>
  | JunctionsV3<5>
  | JunctionsV3<6>
  | JunctionsV3<7>
  | JunctionsV3<8>;
export type InteriorV4 =
  | 'Here'
  | JunctionsV4<1>
  | JunctionsV4<2>
  | JunctionsV4<3>
  | JunctionsV4<4>
  | JunctionsV4<5>
  | JunctionsV4<6>
  | JunctionsV4<7>
  | JunctionsV4<8>;

export type NetworkId = NetworkIdV4;
export type NetworkIdV2 = 'Any' | { Named: string } | 'Polkadot' | 'Kusama';
export type NetworkIdV3 =
  | { ByGenesis: string }
  | { ByFork: { blockNumber: number | bigint; blockHash: string } }
  | 'Polkadot'
  | 'Kusama'
  | 'Westend'
  | 'Rococo'
  | 'Wococo'
  | { Ethereum: { chainId: number | bigint } }
  | 'BitcoinCore'
  | 'BitcoinCash'
  | 'PolkadotBulletin';
export type NetworkIdV4 = NetworkIdV3;

export type BodyId = BodyIdV4;
export type BodyIdV2 =
  | 'Unit'
  | { Named: string }
  | { Index: number }
  | 'Executive'
  | 'Technical'
  | 'Legislative'
  | 'Judicial'
  | 'Defense'
  | 'Administration'
  | 'Treasury';
export type BodyIdV3 =
  | Exclude<BodyIdV2, { Named: string }>
  | { Moniker: string };
export type BodyIdV4 = BodyIdV3;

export type Fraction = { nom: number; denom: number };
export type BodyPart =
  | 'Voice'
  | { Members: number }
  | { Fraction: Fraction }
  | { AtLeastProportion: Fraction }
  | { MoreThanProportion: Fraction };

export type Junction = JunctionV4;
export type JunctionV2 =
  | { Parachain: number }
  | { AccountId32: { network: NetworkIdV2; id: string } }
  | { AccountIndex64: { network: NetworkIdV2; index: number | bigint } }
  | { AccountKey20: { network: NetworkIdV2; key: string } }
  | { PalletInstance: number }
  | { GeneralIndex: number | bigint  }
  | { GeneralKey: string }
  | 'OnlyChild'
  | { Plurality: { id: BodyIdV2; part: BodyPart } };

export type JunctionV3 =
  | { Parachain: number }
  | { AccountId32: { network?: NetworkIdV3 | null; id: string } }
  | { AccountIndex64: { network?: NetworkIdV3 | null; index: number | bigint } }
  | { AccountKey20: { network?: NetworkIdV3 | null; key: string } }
  | { PalletInstance: number }
  | { GeneralIndex: number | bigint }
  | { GeneralKey: { length: number; data: string } }
  | 'OnlyChild'
  | { Plurality: { id: BodyIdV3; part: BodyPart } }
  | { GlobalConsensus: NetworkIdV3 };
type JunctionV4 = JunctionV3;
