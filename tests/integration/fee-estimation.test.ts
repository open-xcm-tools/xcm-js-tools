import {
  parachainUniversalLocation,
  Registry,
  relaychainUniversalLocation,
} from '@open-xcm-tools/simple-xcm';
import {universalLocation, location} from '@open-xcm-tools/xcm-util';
import {describe, expect, test} from 'vitest';

describe('fee estimation tests', async () => {
  const BDK_URL = process.env.BDK_BALANCER!.replace('http', 'ws');

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
  const xcmAssetHubA = await registry.connectXcm('AssetHubA');
  const xcmAssetHubB = await registry.connectXcm('AssetHubB');
  const xcmAssetHubC = await registry.connectXcm('AssetHubC');

  test('correct composeTransfer: A -> B', async () => {
    expect(
      await xcmAssetHubA.composeTransfer({
        origin: 'Alice',
        assets: [xcmAssetHubA.adjustedFungible('USDT', '30')],
        feeAssetId: 'USDT',
        destination: 'AssetHubB',
        beneficiary: 'Alice',
      }),
    );
  });

  test('correct composeTransfer: A -> C', async () => {
    expect(
      await xcmAssetHubA.composeTransfer({
        origin: 'Alice',
        assets: [xcmAssetHubA.adjustedFungible('USDT', '30')],
        feeAssetId: 'USDT',
        destination: 'AssetHubC',
        beneficiary: 'Alice',
      }),
    );
  });

  test('correct composeTransfer: B -> A', async () => {
    expect(
      await xcmAssetHubB.composeTransfer({
        origin: 'Alice',
        assets: [xcmAssetHubB.adjustedFungible('USDT', '30')],
        feeAssetId: 'USDT',
        destination: 'AssetHubA',
        beneficiary: 'Alice',
      }),
    );
  });

  test('correct composeTransfer: C -> A', async () => {
    expect(
      await xcmAssetHubC.composeTransfer({
        origin: 'Alice',
        assets: [xcmAssetHubC.adjustedFungible('USDT', '30')],
        feeAssetId: 'USDT',
        destination: 'AssetHubA',
        beneficiary: 'Alice',
      }),
    );
  });

  test('tooExpensive error handling: A -> B', async () => {
    expect(
      await xcmAssetHubA.composeTransfer({
        origin: 'Alice',
        assets: [xcmAssetHubA.adjustedFungible('USDT', '0.000001')],
        feeAssetId: 'USDT',
        destination: 'AssetHubB',
        beneficiary: 'Alice',
      }),
    );
  });

  test('tooExpensive error handling: A -> C', async () => {
    expect(
      await xcmAssetHubA.composeTransfer({
        origin: 'Alice',
        assets: [xcmAssetHubA.adjustedFungible('USDT', '0.000001')],
        feeAssetId: 'USDT',
        destination: 'AssetHubC',
        beneficiary: 'Alice',
      }),
    );
  });

  test('tooExpensive error handling: B -> A', async () => {
    expect(
      await xcmAssetHubB.composeTransfer({
        origin: 'Alice',
        assets: [xcmAssetHubB.adjustedFungible('USDT', '0.000001')],
        feeAssetId: 'USDT',
        destination: 'AssetHubA',
        beneficiary: 'Alice',
      }),
    );
  });

  test('tooExpensive error handling: C -> A', async () => {
    expect(
      await xcmAssetHubC.composeTransfer({
        origin: 'Alice',
        assets: [xcmAssetHubC.adjustedFungible('USDT', '0.000001')],
        feeAssetId: 'USDT',
        destination: 'AssetHubA',
        beneficiary: 'Alice',
      }),
    );
  });
});
