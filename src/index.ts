import { Registry } from './registry';
import { asset, fungible, location } from './util';
import { Asset, AssetLookup } from './xcmtypes';

(async () => {
  const registry = new Registry()
    .addEcosystemChains('Polkadot')
    .addEcosystemChains('Kusama')
    .addRelativeLocation(
      'Test Account',
      location(0n, [
        {
          accountId32: {
            id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501'
          }
        }
      ])
    );

  await registry.addNativeCurrency('Polkadot');
  await registry.addNativeCurrency('Unique Network');
  await registry.addNativeCurrency('QUARTZ by UNIQUE');

  const xcm = await registry.connectXcm('Unique Network');
  // xcm.enforceXcmVersion(2);
  // xcm.enforceXcmVersion(3);
  // xcm.enforceXcmVersion(4);
  console.log('XCM version:', xcm.xcmVersion);

  // TODO check/convert all junctions add arbitrary byte data
  // TODO conversion for account id text reprs
  const transferTx = await xcm.composeTransfer({
    assets: [
      asset(location(0n, 'here'), fungible(100n)),

      asset('DOT', fungible(5n)),

      xcm.adjustedFungible('DOT', 300),

      <AssetLookup>{
        id: 'DOT',
        fun: fungible(42n)
      },

      <Asset>{
        id: { parents: 0n, interior: 'here' },
        fun: { fungible: 88n }
      },

      asset('QTZ', fungible(77n))
    ],
    feeAssetId: 'DOT',
    destination: 'Acala',
    beneficiary: 'Test Account'
  });

  console.log(transferTx.method.toHex());

  xcm.disconnect();
})();
