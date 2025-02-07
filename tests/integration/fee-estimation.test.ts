import {
  parachainUniversalLocation,
  Registry,
  relaychainUniversalLocation,
  SimpleXcm,
} from '@open-xcm-tools/simple-xcm';
import {universalLocation, location} from '@open-xcm-tools/xcm-util';
import {NetworkId} from '@open-xcm-tools/xcm-types';
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
  extrinsicSetupExchangePoolPseudoUsd,
  extrinsicMintPseudoUsd,
  extrinsicRawTransferPseudoUsd,
  pauseUntilPseudoUsdBalanceAtLeast,
} from './testutil';

describe('fee estimation tests', async () => {
  const WESTEND_NETWORK_ID: NetworkId = {
    byGenesis:
      '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
  };
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
        universalLocation: relaychainUniversalLocation(WESTEND_NETWORK_ID),
      },
      endpoints: [`${BDK_URL}/relay/`],
    })
    .addChain({
      identity: {
        name: 'AssetHubA',
        universalLocation: parachainUniversalLocation(
          WESTEND_NETWORK_ID,
          paraIds.assetHubA,
        ),
      },
      endpoints: [`${BDK_URL}/relay-assethubA/`],
    })
    .addChain({
      identity: {
        name: 'AssetHubB',
        universalLocation: parachainUniversalLocation(
          WESTEND_NETWORK_ID,
          paraIds.assetHubB,
        ),
      },
      endpoints: [`${BDK_URL}/relay-assethubB/`],
    })
    .addChain({
      identity: {
        name: 'AssetHubC',
        universalLocation: parachainUniversalLocation(
          WESTEND_NETWORK_ID,
          paraIds.assetHubC,
        ),
      },
      endpoints: [`${BDK_URL}/relay-assethubC/`],
    })
    .addCurrency({
      symbol: pseudoUsdName,
      decimals: pseudoUsdDecimals,
      universalLocation: universalLocation(WESTEND_NETWORK_ID, [
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

    // 100 billion pUSD
    const initBalance = 100000000000000000n;

    await tryUntilFinalized(
      alice,
      await extrinsicMintPseudoUsd(xcmAssetHubA, alice.address, initBalance),
    );

    const newRelaySessionIndex =
      await xcmRelay.api.query.session.currentIndex();

    // Ensure all channels between sibling chains are operational
    if (newRelaySessionIndex === oldRelaySessionIndex && channelJustOpened) {
      await pauseUntilNextSession(xcmRelay.api);
    }

    const poolOptions = {
      relayToken: {
        // 1 billion relay token
        desiredAmount: 1000000000000000000000n,

        // 1 relay token
        minAmount: 1000000000000n,
      },
      pseudoUsd: {
        // 8 billion pUSD
        desiredAmount: 8000000000000000n,

        // 1 pUSD
        minAmount: 1000000n,
      },
    };

    await tryUntilFinalized(
      alice,
      extrinsicRawTransferPseudoUsd(
        xcmAssetHubA,
        xcmAssetHubB,
        alice.address,
        2n * poolOptions.pseudoUsd.desiredAmount,
      ),
    );

    await pauseUntilPseudoUsdBalanceAtLeast(
      xcmAssetHubB,
      'foreignAssets',
      alice.address,
      poolOptions.pseudoUsd.desiredAmount,
    );

    await tryUntilFinalized(
      alice,
      extrinsicRawTransferPseudoUsd(
        xcmAssetHubA,
        xcmAssetHubC,
        alice.address,
        2n * poolOptions.pseudoUsd.desiredAmount,
      ),
    );

    await pauseUntilPseudoUsdBalanceAtLeast(
      xcmAssetHubC,
      'foreignAssets',
      alice.address,
      poolOptions.pseudoUsd.desiredAmount,
    );

    await tryUntilFinalized(
      alice,
      extrinsicSetupExchangePoolPseudoUsd(
        xcmAssetHubA,
        alice.address,
        poolOptions,
      ),
    );

    await tryUntilFinalized(
      alice,
      extrinsicSetupExchangePoolPseudoUsd(
        xcmAssetHubB,
        alice.address,
        poolOptions,
      ),
    );

    await tryUntilFinalized(
      alice,
      extrinsicSetupExchangePoolPseudoUsd(
        xcmAssetHubC,
        alice.address,
        poolOptions,
      ),
    );
  });

  const xcTransferAndCheckBalanceIncrease = async (params: {
    transferAmount: bigint;
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

    let tx;
    try {
      tx = await params.fromXcm.composeTransfer({
        origin: 'Alice',
        assets: [
          params.fromXcm.adjustedFungible(
            pseudoUsdName,
            transferAmount.toString(),
          ),
        ],
        feeAssetId: pseudoUsdName,
        destination: params.destXcm.chainInfo.identity.name,
        beneficiary: 'Alice',
      });
    } catch (error: any) {
      throw 'errors' in error ? error.errors : error;
    }

    await tryUntilFinalized(alice, tx);

    const newBalance = await pauseUntilPseudoUsdBalanceIncreased(
      params.destXcm,
      params.destAssetsPalletName,
      alice.address,
      oldBalance,
    );

    const balanceIncrease = newBalance - oldBalance;
    expect(balanceIncrease >= transferAmount).to.be.true;
  };

  describe('SimpleXcm.composeTransfer fee estimation', () => {
    test('A -> B -> A', async () => {
      await xcTransferAndCheckBalanceIncrease({
        transferAmount: 30n,
        fromXcm: xcmAssetHubA,
        destXcm: xcmAssetHubB,
        destAssetsPalletName: 'foreignAssets',
      });

      await xcTransferAndCheckBalanceIncrease({
        transferAmount: 15n,
        fromXcm: xcmAssetHubB,
        destXcm: xcmAssetHubA,
        destAssetsPalletName: 'assets',
      });
    });

    test('A -> C -> A', async () => {
      await xcTransferAndCheckBalanceIncrease({
        transferAmount: 30n,
        fromXcm: xcmAssetHubA,
        destXcm: xcmAssetHubC,
        destAssetsPalletName: 'foreignAssets',
      });

      await xcTransferAndCheckBalanceIncrease({
        transferAmount: 15n,
        fromXcm: xcmAssetHubC,
        destXcm: xcmAssetHubA,
        destAssetsPalletName: 'assets',
      });
    });

    test('A -> B -> C', async () => {
      await xcTransferAndCheckBalanceIncrease({
        transferAmount: 30n,
        fromXcm: xcmAssetHubA,
        destXcm: xcmAssetHubB,
        destAssetsPalletName: 'foreignAssets',
      });

      await xcTransferAndCheckBalanceIncrease({
        transferAmount: 15n,
        fromXcm: xcmAssetHubB,
        destXcm: xcmAssetHubC,
        destAssetsPalletName: 'foreignAssets',
      });
    });
  });
});
