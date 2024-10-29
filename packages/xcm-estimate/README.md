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

The `Estimator` class provides a comprehensive framework for estimating fees and execution effects of cross-chain message (XCM) programs using Runtime API. It enables seamless interactions and efficient resource management by leveraging dry-run simulations and dynamic fee calculations based on the connected chain's XCM Runtime API reports.

### Estimator creation

Define the chain identity:

```typescript
const chainIdentity: ChainIdentity = {
    name: 'AssetHub',
    universalLocation: parachainUniversalLocation('polkadot', 1000n),
};
```

Use the constructor of `Estimator` to create an instance of this class:

```typescript
const api = /* an instance of the `ApiPromise` */;
const xcmVersion = /* xcm version to use to communicate with the chain */
const estimator = new Estimator(api, chainIdentity, xcmVersion);
```

The `Estimator` can estimate the XCM version by itself (see `estimateMaxXcmVersion`) and it also can create the `ApiPromise` instance internally. If you want to pass the `ChainInfo` (which is the chain identity + list of endpoints) and make the `Estimator` to "just connect", you can use the `connect` method.

```typescript
Estimator.connect(<ChainInfo>{
  identity: {
    name: 'AssetHub',
    universalLocation: parachainUniversalLocation('polkadot', 1000n),
  },
  endpoints: [
    'wss://asset-hub-polkadot-rpc.dwellir.com',
    'wss://sys.ibp.network/asset-hub-polkadot',
    // Add more endpoints as needed
  ],
}),
```

### Estimate extrinsic fees

Call the `tryEstimateExtrinsicFees` method to get the estimated fees for the specified extrinsic. Pass parameters for extrinsic estimation like `Origin` (from `@open-xcm-tools/xcm-types`), `feeAssetId` and a constructed extrinsic.

```typescript
const estimatedFees = await this.estimator.tryEstimateExtrinsicFees(
  {System: {Signed: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'}},
  api.tx.palletXcm.transferAssets(/* parameters */),
  <AssetId>{
    parents: 1n,
    interior: {
      x3: [{parachain: 1000n}, {palletInstance: 50n}, {generalIndex: 1984n}],
    },
  },
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
