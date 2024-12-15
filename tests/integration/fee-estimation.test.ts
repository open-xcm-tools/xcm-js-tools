import {
  parachainUniversalLocation,
  Registry,
  relaychainUniversalLocation,
  SimpleXcm,
} from '@open-xcm-tools/simple-xcm';
import {universalLocation, location} from '@open-xcm-tools/xcm-util';
import {Keyring} from '@polkadot/api';
import {beforeAll, describe, expect, test} from 'vitest';

import {
  ensureTwoWayHrmpChannelsOpened,
  pauseUntilNextSession,
  tryUntilFinalized,
  pseudoUsdName,
  pseudoUsdId,
  pseudoUsdDecimals,
  forceCreatePseudoUsdEverywhere,
  pseudoUsdBalance,
  pauseUntilPseudoUsdBalanceIncreased,
  AssetsPalletName,
} from './testutil';

describe('fee estimation tests', async () => {
  const BDK_URL = process.env.BDK_BALANCER!.replace('http', 'ws');

  const keyring = new Keyring({type: 'sr25519'});

  const alice = keyring.addFromUri('//Alice');

  const paraIds = {
    assetHubA: 2001n,
    assetHubB: 2002n,
    assetHubC: 2003n,
  };

  const registry = new Registry()
    .addChain({
      identity: {
        name: 'Relay',
        universalLocation: relaychainUniversalLocation('westend'),
      },
      endpoints: [`${BDK_URL}/relay/`],
    })
    .addChain({
      identity: {
        name: 'AssetHubA',
        universalLocation: parachainUniversalLocation(
          'westend',
          paraIds.assetHubA,
        ),
      },
      endpoints: [`${BDK_URL}/relay-assethubA/`],
    })
    .addChain({
      identity: {
        name: 'AssetHubB',
        universalLocation: parachainUniversalLocation(
          'westend',
          paraIds.assetHubB,
        ),
      },
      endpoints: [`${BDK_URL}/relay-assethubB/`],
    })
    .addChain({
      identity: {
        name: 'AssetHubC',
        universalLocation: parachainUniversalLocation(
          'westend',
          paraIds.assetHubC,
        ),
      },
      endpoints: [`${BDK_URL}/relay-assethubC/`],
    })
    .addCurrency({
      symbol: pseudoUsdName,
      decimals: pseudoUsdDecimals,
      universalLocation: universalLocation('westend', [
        {parachain: paraIds.assetHubA},
        {palletInstance: 50n},
        {generalIndex: pseudoUsdId},
      ]),
    })
    .addRelativeLocation(
      'Alice',
      location(0n, [
        {
          accountId32: {
            id: alice.addressRaw,
          },
        },
      ]),
    );

  await registry.addNativeCurrency('Relay');
  const xcmRelay = await registry.connectXcm('Relay');
  const xcmAssetHubA = await registry.connectXcm('AssetHubA');
  const xcmAssetHubB = await registry.connectXcm('AssetHubB');
  const xcmAssetHubC = await registry.connectXcm('AssetHubC');

  beforeAll(async () => {
    const channelJustOpened = await ensureTwoWayHrmpChannelsOpened(
      alice,
      xcmRelay.api,
      [
        [paraIds.assetHubA, paraIds.assetHubB],
        [paraIds.assetHubA, paraIds.assetHubC],
        [paraIds.assetHubC, paraIds.assetHubB],
      ],
    );

    const oldRelaySessionIndex =
      await xcmRelay.api.query.session.currentIndex();

    await forceCreatePseudoUsdEverywhere(alice, xcmRelay, xcmAssetHubA, [
      xcmAssetHubB,
      xcmAssetHubC,
    ]);

    const aliceUsdtBalance = await pseudoUsdBalance(
      xcmAssetHubA,
      'assets',
      alice.address,
    );
    const initBalance = 1000000000000;

    if (aliceUsdtBalance < initBalance) {
      await tryUntilFinalized(
        alice,
        xcmAssetHubA.api.tx.assets.mint(
          pseudoUsdId,
          alice.address,
          initBalance,
        ),
      );
    }

    const newRelaySessionIndex =
      await xcmRelay.api.query.session.currentIndex();

    // Ensure all channels between sibling chains are operational
    if (newRelaySessionIndex === oldRelaySessionIndex && channelJustOpened) {
      await pauseUntilNextSession(xcmRelay.api);
    }
  });

  const xcTransferAndCheckBalanceIncrease = async (params: {
    transferAmount: number;
    fromXcm: SimpleXcm;
    destXcm: SimpleXcm;
    destAssetsPalletName: AssetsPalletName;
  }) => {
    const oldBalance = await pseudoUsdBalance(
      params.destXcm,
      params.destAssetsPalletName,
      alice.address,
    );

    const transferAmount = params.transferAmount;

    let transfer;
    try {
      transfer = await params.fromXcm.composeTransfer({
        origin: 'Alice',
        assets: [
          params.fromXcm.adjustedFungible(
            pseudoUsdName,
            transferAmount.toFixed(),
          ),
        ],
        feeAssetId: pseudoUsdName,
        destination: params.destXcm.chainInfo.identity.name,
        beneficiary: 'Alice',
      });
    } catch (error: any) {
      throw 'errors' in error ? error.errors : error;
    }

    await tryUntilFinalized(alice, transfer.submittableExtrinsic);

    const newBalance = await pauseUntilPseudoUsdBalanceIncreased(
      params.destXcm,
      params.destAssetsPalletName,
      alice.address,
      oldBalance,
    );

    const balanceIncrease = newBalance - oldBalance;
    expect(balanceIncrease).be.greaterThanOrEqual(transferAmount);
  };

  describe('SimpleXcm.composeTransfer fee estimation', () => {
    test('A -> B -> A', async () => {
      await xcTransferAndCheckBalanceIncrease({
        transferAmount: 30,
        fromXcm: xcmAssetHubA,
        destXcm: xcmAssetHubB,
        destAssetsPalletName: 'foreignAssets',
      });

      await xcTransferAndCheckBalanceIncrease({
        transferAmount: 15,
        fromXcm: xcmAssetHubB,
        destXcm: xcmAssetHubA,
        destAssetsPalletName: 'assets',
      });
    });

    test('A -> C -> A', async () => {
      await xcTransferAndCheckBalanceIncrease({
        transferAmount: 30,
        fromXcm: xcmAssetHubA,
        destXcm: xcmAssetHubC,
        destAssetsPalletName: 'foreignAssets',
      });

      await xcTransferAndCheckBalanceIncrease({
        transferAmount: 15,
        fromXcm: xcmAssetHubC,
        destXcm: xcmAssetHubA,
        destAssetsPalletName: 'assets',
      });
    });

    test('A -> B -> C', async () => {
      await xcTransferAndCheckBalanceIncrease({
        transferAmount: 30,
        fromXcm: xcmAssetHubA,
        destXcm: xcmAssetHubB,
        destAssetsPalletName: 'foreignAssets',
      });

      await xcTransferAndCheckBalanceIncrease({
        transferAmount: 15,
        fromXcm: xcmAssetHubB,
        destXcm: xcmAssetHubC,
        destAssetsPalletName: 'foreignAssets',
      });
    });
  });
});
