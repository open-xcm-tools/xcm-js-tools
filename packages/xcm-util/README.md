# xcm-util

**xcm-util** is a package designed to provide tools for tedious actions needed to work with XCM, such as

- Upgrading and downgrading XCM entities such as locations, assets, and fungibilities.
- Comparing and sorting of assets.
  NOTE: The `VersionedAssets` must be sorted before encoding the extrinsic; **otherwise, the chain won't decode it**. This is a property of the `VersionedAssets` type (this type is usually the main parameter of a transfer extrinsic).
- Sanitizing XCM entities. The sanitizing functions provide better error reporting when an XCM entity is malformed. Also, they perform necessary conversions that PolkadotJS doesn't automatically, such as encoding the SS58 address into bytes for the `AccountId32` junction.

## Installation

Before installing `xcm-util` package to your project, you need to setup Yarn 2, due to requirements of the `open-xcm-tools` packages.

### Yarn 2 (Berry) installation

First, set up a global Yarn, which will be used to create local instances:

```bash
npm install -g yarn
```

Then you need to locally change **Yarn** version for your project. In project folder:

```bash
yarn set version berry
```

After this actions you can use **Yarn** as usually (init project, add dependencies, etc.)

### `xcm-util` installation

```bash
yarn add @open-xcm-tools/xcm-util
```

## Usage

For showing the general functionality of the package let's take a look to the examples of `Location` and `Asset` entities:

```typescript
// A more concise way to write `{ parents: 1n, interior: { x3: [/* parachain, ... */] } }`
const location: Location = location(1n, [
  {parachain: 1000n},
  {palletInstance: 50n},
  {generalIndex: 1984n},
]);

// A more concise way to write `{ id: { parents: 0n, interior: 'here' }, fun: { fungible: 100n } }`
const asset: Asset = asset(location(0n, 'here'), fungible(100n));
```

### Convert XCM version

The examples above are `Location` and `Asset` instance of latest XCM versions.  The package `xcm-util` provides the opportunity to convert current XCM version of instances to specific, for example:

```typescript
const locationV3: LocationV3 = convertLocationVersion(3, location);
const assetV3: AssetV3 = convertAssetVersion(3, asset);
```

Also you can create `VersionedAsset` instance of XCM version 2, for example, and convert it to the latest XCM version, using:

```typescript
const versionedAssetV2: VersionedAsset = {
  V2: {
    concrete: {
      interior: 'here',
      parents: 0n,
    },
    fun: {
      fungible: 10n,
    },
  },
};

const asset: Asset = assetIntoCurrentVersion(versionedAssetV2);
```

### Sorting and deduplicating assets

`xcm-util` defines a set of functions designed to sort and deduplicate asset collections based on their versioning and properties. The primary goal is to ensure that the assets are organized in a specific order, that any duplicates are removed and aggregate certain properties, specifically summing the fungible amounts of assets with the same ID or ignoring duplicate NFTs.

The `sortAndDeduplicateAssets` and `sortAndDeduplicateVersionedAssets` functions provide the described functionality.

```typescript
const assets = [
  asset(location(0n, 'here'), fungible(100n)),
  asset('DOT', fungible(5n)),
  xcm.adjustedFungible('DOT', '2.5'),

  <AssetLookup>{
    id: 'DOT',
    fun: fungible(42n),
  },

  <Asset>{
    id: {parents: 0n, interior: 'here'},
    fun: {fungible: 88n},
  },

  asset('QTZ', fungible(77n)),
];

sortAndDeduplicateAssets(assets);
```

> **Note:** `sortAndDeduplicateAssets` and `sortAndDeduplicateVersionedAssets` working with array in-place.

### Sanitizing XCM entities

`xcm-util` provides a comprehensive set of functions for sanitizing and validating various assets data structures in the context of cross-chain messaging (XCM). It ensures that the data adheres to specified constraints, such as bit size and byte length, thereby preventing potential errors and inconsistencies. The module includes functions to sanitize assets, fungibility types, locations, junctions, and network identifiers, ensuring that all data conforms to the expected formats and standards.

For instance, the `sanitizeAssets` function will validate and sanitize your array of assets:

```typescript
const assets = [
  asset(location(258n, 'here'), fungible(100n)), // sanitizeAssets will throw error due to `parents` value (8-bit max)
  <Asset>{
    id: {
      parents: 1n,
      interior: {
        x3: [
          {parachain: 1000000000000000n}, // sanitizeAssets will throw error due to `parachain` value (32-bit max)
          {palletInstance: 50n},
          {generalIndex: 1984n},
        ],
      },
    },
    fun: {fungible: 88n},
  },
];

sanitizeAssets(assets);

const locations = [
  location(0n, [
    {parachain: 1000n},
    {
      accountId32: {
        id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
      },
    },
  ]),
  location(0n, [
    {parachain: 1000n},
    {accountId32: {id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'}},
  ]),
]; // both variants of accountId32 field are correct, sanitize will convert it to unified form

locations.forEach(sanitizeLocation);
```

> **Note:** `sanitizeAssets` working with array in-place.

## Dependencies

- `@open-xcm-tools/xcm-types`
