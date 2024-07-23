import { Registry } from './registry';
import { asset, fungible, location } from './util';
import { Asset, AssetLookup } from './xcmtypes';

(async () => {
  const registry = new Registry()
    .addEcosystemChains('Polkadot')
    .addEcosystemChains('Kusama')
    .addRelativeLocation(
      'Test Account',
      location(0, [
        {
          AccountId32: {
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
      asset(location(0, 'Here'), fungible(100)),

      asset('DOT', fungible(5)),

      <AssetLookup>{
        id: 'DOT',
        fun: fungible(42)
      },

      <Asset>{
        id: { parents: 0, interior: 'Here' },
        fun: { Fungible: 88 }
      },

      asset('QTZ', fungible(77))
    ].map(asset => xcm.adjustToCurrencyUnit(asset)),
    feeAssetId: 'DOT',
    destination: 'Acala',
    beneficiary: 'Test Account'
  });

  console.log(transferTx.method.toHex());

  xcm.disconnect();
})();
