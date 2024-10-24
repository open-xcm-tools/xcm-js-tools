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

The simple-xcm library offers a set of intuitive functions for transferring tokens between chains. The primary class to use is `Registry`, which is responsible for storing information about parachains, currency data, and the main functionalities of this library.

### Registering Chains

To start using the `Registry`, you need to add ecosystems of parachains.

```typescript
const registry = new Registry()
  .addEcosystemChains('Polkadot')
  .addEcosystemChains('Kusama');
```

If you want to add an external parachain (not from a connected ecosystem), you can use the `Registry.addChain` function, which takes a `ChainInfo` object as a parameter.

For understanding, it is necessary to show `ChainInfo` instance:

```typescript
interface CurrencyInfo {
  symbol: string;
  decimals: number;
  universalLocation: InteriorLocation;
}

interface ChainInfo {
  identity: ChainIdentity;
  endpoints: string[];
}
```

Example of adding chain to `Registry` instance:

```typescript
registry.addChain(<ChainInfo>{
  identity: {
    name: 'AssetHub',
    universalLocation: parachainUniversalLocation('polkadot', 2001n),
  },
  endpoints: [
    'wss://asset-hub-polkadot-rpc.dwellir.com',
    'wss://sys.ibp.network/asset-hub-polkadot',
    // Add more endpoints as needed
  ],
});
```

### Registering Currencies

The library allows you to add information about the native currency of a parachain that you wish to use, simply by specifying the chain ID. For example:

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
    {parachain: 2001n},
    {palletInstance: 50n},
    {generalIndex: 1984n},
  ]),
});
```

### Registering Locations

You can add information about universal or relative locations to your Registry object. For example:

```typescript
registry.addUniversalLocation(
  'SomeChainLocation',
  parachainUniversalLocation('polkadot', 2001n),
);
registry.addRelativeLocation(
  'MyAccountLocation',
  location(0n, [
    {
      accountId32: {
        id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
      },
    },
  ]),
);
```

> Note: In the field of interiors, you can use hex-string byte sequences. Specifically for the accountId32 field, you can represent it as either a hex string or an ASCII representation, which is interpreted as an SS58 address

### `Registry` Functionality

The `Registry` class provides several functions to retrieve information about the stored data. For example:

```typescript
registry.chainInfoById('Unique Network');
registry.chainInfoByLocation(parachainUniversalLocation('polkadot', 2001n));
registry.currencyInfoBySymbol('DOT');
registry.currencyInfoByLocation(parachainUniversalLocation('polkadot', 2001n));
registry.universalLocation('SomeChainLocation');
registry.relativeLocation('MyAccountLocation');
```

After completing the setup, the library can interact with an XCM-capable parachain pallet. The library provides functionality to connect to a parachain using its registry name.
For example, using the registry name:

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

Additionally, the library will sort and deduplicate assets automatically, so the user does not need to worry about it.

You can retrieve the adjusted (converted a specified amount token into its equivalent while taking into account the decimal places) fungible amount by calling `adjustedFungible`:

```typescript
xcm.adjustedFungible('DOT', '22.23432');
```

To transfer assets between accounts cross-chain, you can use the `composeTransfer` function. This function accepts assets and locations in the latest version of XCM format. The conversion to the version supported by the target chain will be handled automatically by **simple-xcm**.

```typescript
await xcm.composeTransfer({
  origin: 'Test Account',
  assets: [
    asset(location(0n, 'here'), fungible(100n)),
    asset('DOT', fungible(5n)),
  ],
  feeAssetId: 'DOT',
  destination: 'Acala',
  beneficiary: 'Test Account',
});

await xcm.composeTransfer({
  origin: 'Test Account',
  assets: [
    <AssetLookup>{
      id: 'DOT',
      fun: fungible(42n),
    },

    <Asset>{
      id: {parents: 0n, interior: 'here'},
      fun: {fungible: 88n},
    },
  ],
  feeAssetId: 'DOT',
  destination: 'Acala',
  beneficiary: 'Test Account',
});
```

> Note: In the `composeTransfer` method, all arguments representing locations can be passed as strings. In this case, the library will retrieve them from the `Registry` storage.

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
