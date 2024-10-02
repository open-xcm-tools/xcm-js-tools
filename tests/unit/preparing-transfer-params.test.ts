import {Registry} from 'src/registry';
import {prepareTransferParams, TransferParams} from 'src/simplexcm';
import {asset, fungible, location} from 'src/util';
import {Asset} from 'src/xcmtypes';
import {describe, expect, test} from 'vitest';

describe('preparing transfer params test', () => {
  describe('preparinhg tests', async () => {
    const registry = new Registry()
      .addEcosystemChains('Polkadot')
      .addRelativeLocation(
        'Test Account',
        location(0n, [
          {
            accountId32: {
              id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
            },
          },
        ]),
      );
    await registry.addNativeCurrency('Polkadot');
    const xcm = await registry.connectXcm('AssetHub');

    test('test account32 ascii', async () => {
      const params = <TransferParams>{
        origin: 'Test Account',
        assets: [
          asset(location(0n, 'here'), fungible(100n)),

          <Asset>{
            id: {
              parents: 0n,
              interior: {
                x2: [
                  {parachain: 1000n},
                  {
                    accountId32: {
                      id: '12YxqM83czUVSPRWtLdEmqeWCC7EHG88WZdfCGZ6Kph1pvt4',
                    },
                  },
                ],
              },
            },
            fun: {fungible: 88n},
          },
        ],
        feeAssetId: 'DOT',
        destination: 'Acala',
        beneficiary: 'Test Account',
      };
      await prepareTransferParams(xcm, params);
    });

    test.fails('test incorrect palletInstance', async () => {
      const params = <TransferParams>{
        origin: 'Test Account',
        assets: [
          asset(location(0n, 'here'), fungible(100n)),

          <Asset>{
            id: {
              parents: 0n,
              interior: {
                x3: [
                  {parachain: 1000n},
                  {palletInstance: 1000n},
                  {generalIndex: 1984n},
                ],
              },
            },
            fun: {fungible: 88n},
          },
        ],
        feeAssetId: 'DOT',
        destination: 'Acala',
        beneficiary: 'Test Account',
      };
      expect(await prepareTransferParams(xcm, params));
    });

    test.fails('test incorrect parachain', async () => {
      const params = <TransferParams>{
        origin: 'Test Account',
        assets: [
          <Asset>{
            id: {
              parents: 0n,
              interior: {
                x3: [
                  {parachain: 1984000012312312300n},
                  {palletInstance: 10n},
                  {generalIndex: 1984n},
                ],
              },
            },
            fun: {fungible: 88n},
          },
        ],
        feeAssetId: 'DOT',
        destination: 'Acala',
        beneficiary: 'Test Account',
      };
      expect(await prepareTransferParams(xcm, params));
    });

    test.fails('test incorrect networkId.byFork.blockHash', async () => {
      const params = <TransferParams>{
        origin: 'Test Account',
        assets: [
          <Asset>{
            id: {
              parents: 0n,
              interior: {
                x2: [
                  {parachain: 1000n},
                  {
                    accountId32: {
                      network: {
                        byFork: {blockHash: '0x000000', blockNumber: 2000n},
                      },
                    },
                  },
                ],
              },
            },
            fun: {fungible: 88n},
          },
        ],
        feeAssetId: 'DOT',
        destination: 'Acala',
        beneficiary: 'Test Account',
      };
      expect(await prepareTransferParams(xcm, params));
    });

    // TODO composeTransfer encoding tests with asset sort
  });
});
