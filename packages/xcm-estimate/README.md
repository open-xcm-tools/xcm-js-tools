# xcm-estimate

**xcm-estimate** is a package designed to provide tools for estimating the XCM properties of a chain and the effects of XCM program execution.

## Installation

Before installing `xcm-estimate` package to your project, you need to setup Yarn 2, due to requirements of the `open-xcm-tools` packages.

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

### `xcm-estimate` installation

```bash
yarn add @open-xcm-tools/xcm-estimate
```

## Usage

The `Estimator` class provides a comprehensive framework for estimating fees and execution effects of cross-chain message (XCM) programs within a blockchain ecosystem, enabling seamless interactions and efficient resource management by leveraging dry-run simulations and dynamic fee calculations based on the specific characteristics of the connected chain.

### Connect to the Blockchain

Define the chain information, including the WebSocket endpoint and the chain identity:

```typescript
const chainInfo: ChainInfo = {
  identity: {
    name: 'AssetHub',
    universalLocation: parachainUniversalLocation('polkadot', 2001n),
  },
  endpoints: [
    'wss://asset-hub-polkadot-rpc.dwellir.com',
    'wss://sys.ibp.network/asset-hub-polkadot',
    // Add more endpoints as needed
  ],
};
```

Use the `Estimator.connect` method to connect to the blockchain and create an instance of the `Estimator` class.

```typescript
const estimator = await Estimator.connect(chainInfo);
```

### Estimate extrinsic fees

Call the `estimateExtrinsicFees` method to get the estimated fees for the specified extrinsic. Pass parameters for extrinsic estimation like `Origin` (from `@open-xcm-tools/xcm-types`), `feeAssetId` and extrinsic hash.

```typescript
const estimatedFees = await this.estimator.estimateExtrinsicFees(
  'Alice',
  api.tx.palletXcm.transferAssets(/* parameters */),
  'USDT',
  {
    estimatorResolver: (universalLocation: InteriorLocation) =>
      Estimator.connect(
        this.registry.chainInfoByUniversalLocation(universalLocation),
      ),
  },
);
```

## Dependencies

- `@open-xcm-tools/xcm-types`
- `@open-xcm-tools/xcm-util`
