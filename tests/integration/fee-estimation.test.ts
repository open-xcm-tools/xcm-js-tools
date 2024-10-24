import {
  parachainUniversalLocation,
  Registry,
  relaychainUniversalLocation,
} from '@open-xcm-tools/simple-xcm';
import {universalLocation, location} from '@open-xcm-tools/xcm-util';
import {describe, expect, test} from 'vitest';

describe('fee estimation tests', async () => {
  const BDK_URL = process.env.BDK_URL!;

  const registry = new Registry()
    .addChain({
      identity: {
        name: 'Polkadot',
        universalLocation: relaychainUniversalLocation('westend'),
      },
      endpoints: [`${BDK_URL}/relay/`],
    })
    .addChain({
      identity: {
        name: 'AssetHubA',
        universalLocation: parachainUniversalLocation('westend', 2001n),
      },
      endpoints: [`${BDK_URL}/relay-assethubA/`],
    })
    .addChain({
      identity: {
        name: 'AssetHubB',
        universalLocation: parachainUniversalLocation('westend', 2002n),
      },
      endpoints: [`${BDK_URL}/relay-assethubB/`],
    })
    .addChain({
      identity: {
        name: 'AssetHubC',
        universalLocation: parachainUniversalLocation('westend', 2003n),
      },
      endpoints: [`${BDK_URL}/relay-assethubC/`],
    })
    .addCurrency({
      symbol: 'USDT',
      decimals: 6,
      universalLocation: universalLocation('westend', [
        {parachain: 2001n},
        {palletInstance: 50n},
        {generalIndex: 1984n},
      ]),
    })
    .addRelativeLocation(
      'Alice',
      location(0n, [
        {
          accountId32: {
            id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          },
        },
      ]),
    );

  await registry.addNativeCurrency('Polkadot');

  test('correct composeTransfer: A -> B', async () => {
    const xcmAssetHubA = await registry.connectXcm('AssetHubA');
    expect(
      await xcmAssetHubA.composeTransfer({
        origin: 'Alice',
        assets: [xcmAssetHubA.adjustedFungible('USDT', '20')],
        feeAssetId: 'USDT',
        destination: 'AssetHubB',
        beneficiary: 'Alice',
      }),
    );

    // await xcmAssetHubA.disconnect();
  });
  
  test('correct composeTransfer: B -> C', async () => {
    const xcmAssetHubA = await registry.connectXcm('AssetHubB');
    expect(
      await xcmAssetHubA.composeTransfer({
        origin: 'Alice',
        assets: [xcmAssetHubA.adjustedFungible('USDT', '15')],
        feeAssetId: 'USDT',
        destination: 'AssetHubC',
        beneficiary: 'Alice',
      }),
    );

    // await xcmAssetHubA.disconnect();
  });

  test('correct composeTransfer: C -> A', async () => {
    const xcmAssetHubA = await registry.connectXcm('AssetHubB');
    expect(
      await xcmAssetHubA.composeTransfer({
        origin: 'Alice',
        assets: [xcmAssetHubA.adjustedFungible('USDT', '1')],
        feeAssetId: 'USDT',
        destination: 'AssetHubA',
        beneficiary: 'Alice',
      }),
    );

    // await xcmAssetHubA.disconnect();
  });

  test('tooExpensive error handling: A -> B', async () => {
    const xcm = await registry.connectXcm('AssetHubA');
    expect(
      await xcm.composeTransfer({
        origin: 'Alice',
        assets: [xcm.adjustedFungible('USDT', '0.000001')],
        feeAssetId: 'USDT',
        destination: 'AssetHubB',
        beneficiary: 'Alice',
      }),
    );

    // await xcm.disconnect();
  });

  test('tooExpensive error handling: A -> C', async () => {
    const xcm = await registry.connectXcm('AssetHubA');
    expect(
      await xcm.composeTransfer({
        origin: 'Alice',
        assets: [xcm.adjustedFungible('USDT', '0.000001')],
        feeAssetId: 'USDT',
        destination: 'AssetHubC',
        beneficiary: 'Alice',
      }),
    );

    // await xcm.disconnect();
  });

  test('tooExpensive error handling: B -> C', async () => {
    const xcm = await registry.connectXcm('AssetHubA');
    expect(
      await xcm.composeTransfer({
        origin: 'Alice',
        assets: [xcm.adjustedFungible('USDT', '0.000001')],
        feeAssetId: 'USDT',
        destination: 'AssetHubB',
        beneficiary: 'Alice',
      }),
    );

    // await xcm.disconnect();
  });

  test('tooExpensive error handling: C -> A', async () => {
    const xcm = await registry.connectXcm('AssetHubA');
    expect(
      await xcm.composeTransfer({
        origin: 'Alice',
        assets: [xcm.adjustedFungible('USDT', '0.000001')],
        feeAssetId: 'USDT',
        destination: 'AssetHubB',
        beneficiary: 'Alice',
      }),
    );

    // await xcm.disconnect();
  });
});
