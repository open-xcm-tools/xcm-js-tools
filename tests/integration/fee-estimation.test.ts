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

  test('test tooExpensive', async () => {
    const xcm = await registry.connectXcm('AssetHubA');
    expect(
      await xcm.composeTransfer({
        origin: 'Alice',
        assets: [xcm.adjustedFungible('USDT', '0.000001')],
        feeAssetId: 'USDT',
        destination: 'AssetHubB',
        beneficiary: 'Alice',
      }),
    ).not.toThrowError();

    await xcm.disconnect();
  });
});
