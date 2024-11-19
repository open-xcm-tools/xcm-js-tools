# simple-xcm

**simple-xcm** is a package designed for simplified usage of the Cross-Consensus Message Format (XCM), which is a messaging format and language used for communication between consensus systems.

## Installation

Before installing `simple-xcm` package to your project, you need to setup Yarn 2, due to requirements of the `open-xcm-tools` packages.

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

### `simple-xcm` installation

```bash
yarn add @open-xcm-tools/simple-xcm
```

## Usage

The simple-xcm library offers a set of intuitive functions for transferring tokens between chains. The primary classes to use are:

- `Registry`, which is responsible for storing information about parachains, currency data.
- `SimpleXcm`, which helps to compose the actual transfer extrinsic for a given chain.

The "simple-xcm" library is built upon smaller, modular components that can be utilized independently, allowing for greater flexibility and customization in cross-chain token transfers. Here are brief descriptions of these modules:

- `xcm-types` module provides types for XCM entities of all XCM versions.
- `xcm-util` module provides a comprehensive set of functions for sanitizing and validating various assets data structures in the context of cross-chain messaging (XCM).
- `xcm-estimate` module provides general functionality for fee estimation.

### Filling a `Registry` object

#### Registering Chains

To start using the `Registry`, you need to add ecosystems of parachains.

```typescript
const registry = new Registry()
  .addEcosystemChains('Polkadot')
  .addEcosystemChains('Kusama');
```

If you want to add an external parachain (not from a connected ecosystem), you can use the `Registry.addChain` function, which takes a `ChainInfo` object as a parameter.

Example of adding chain to `Registry` instance:

```typescript
registry.addChain(<ChainInfo>{
  identity: {
    name: 'AssetHub',
    universalLocation: parachainUniversalLocation('polkadot', 1000n),
  },
  endpoints: [
    'wss://asset-hub-polkadot-rpc.dwellir.com',
    'wss://sys.ibp.network/asset-hub-polkadot',
    // Add more endpoints as needed
  ],
});
```

#### Registering Currencies

The library allows you to add information about the native currency of a parachain that you wish to use, simply by specifying the (already registered) chain ID. For example:

```typescript
await registry.addNativeCurrency('Unique Network');
await registry.addNativeCurrency('QUARTZ by UNIQUE');
```

You can also register non-native currencies:

```typescript
registry.addCurrency(<CurrencyInfo>{
  symbol: 'USDT',
  decimals: 6,
  universalLocation: universalLocation('polkadot', [
    {parachain: 1000n},
    {palletInstance: 50n},
    {generalIndex: 1984n},
  ]),
});
```

#### Registering Arbitrary Locations

You can add information about universal or relative locations to your Registry object. For example:

```typescript
registry.addUniversalLocation(
  'Unique Network Chain Location',
  parachainUniversalLocation('polkadot', 2037n),
);
registry.addRelativeLocation(
  'MyAccountLocation',
  location(0n, [
    {
      accountId32: {
        id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      },
    },
  ]),
);
```

> Note: In the field of interiors, you can use hex-string byte sequences. Specifically for the accountId32 field, you can represent it as either a hex string or an ASCII representation, which is interpreted as an SS58 address

### `Registry` Functionality

The `Registry` class provides several functions to retrieve information about the stored data. For example:

```typescript
registry.chainInfoByName('Unique Network');
registry.chainInfoByLocation(parachainUniversalLocation('polkadot', 2037n)); // will return the same as above since it's the Unique's universal location
registry.currencyInfoBySymbol('DOT');
registry.currencyInfoByLocation(relaychainUniversalLocation('polkadot')); // will return the same as above
registry.universalLocation('SomeChainLocation');
registry.relativeLocation('MyAccountLocation');
```

After completing the setup, the library can interact with an XCM-capable parachain pallet (preferably `pallet-xcm` if present or `pallet-xtokens` as an experimental fallback). The library provides functionality to connect to a parachain using its in-registry name.
For example, using the chain's in-registry name:

```typescript
const xcm: SimpleXcm = await registry.connectXcm('Unique Network');
```

### `SimpleXcm` Functionality

`SimpleXcm` is a class that provides functionality for transferring assets with automatic fee estimation.

The library provides different methods to create assets. For example:

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
```

> Notice we used strings where an asset ID or a location is expected. These strings represent the in-registry names of these assets/locations. The `composeTransfer` utilizes this fact and resolves the actual asset IDs and locations via the `Registry`.

Additionally, the `simple-xcm` library automatically sorts and deduplicates assets, relieving users of the need to manage these tasks manually. This functionality is essential due to the peculiarities of XCM decoding. By handling sorting and deduplication automatically, the library ensures that users can focus on their core functionalities without being concerned about the complexities of XCM asset management.

You can retrieve the adjusted (converted a specified amount token into its equivalent while taking into account the decimal places) fungible amount by calling `adjustedFungible`:

```typescript
xcm.adjustedFungible('DOT', '22.23432');
```

To transfer assets between accounts cross-chain, you can use the `composeTransfer` function. This function accepts assets and locations in the latest version of XCM format. The conversion to the version supported by the target chain will be handled automatically by **simple-xcm**.

```typescript
await xcm.composeTransfer({
  origin: 'Test Account', // Assume you registered 'Test Account' as a relative `accountId32` location in the registry

  // List of assets to transfer
  assets: [
    asset(location(0n, 'here'), fungible(100n)),
    asset('DOT', fungible(5n)),
  ],

  feeAssetId: 'DOT', // What asset to use to cover the fees on *all* the hops
  destination: 'Acala',
  beneficiary: 'Test Account',
});
```

> Note: In the `composeTransfer` method, all arguments representing locations and asset IDs can be passed as strings. In this case, the library will retrieve them from the `Registry`.

Don't forget to disconnect your XCM connection after completing all operations:

```typescript
await xcm.disconnect();
```

You can easily enforce the XCM version used to interact with the parachain. By default, `SimpleXcm` uses the maximum XCM version supported by the parachain.

```typescript
registry.enforceXcmVersion(3);
```

> Note: The XCM version cannot exceed the maximum XCM version supported by the chain!

## Dependencies

- `@open-xcm-tools/xcm-types`
- `@open-xcm-tools/xcm-estimate`
- `@open-xcm-tools/xcm-util`
