import { Registry } from './registry';
import {
    asset,
  fungible,
  parachainUniveralLocation,
  relaychainUniversalLocation,
  location,
} from './util';

(async () => {
  const PolkadotNativeToken = 'DOT';
  const UniqueNativeToken = 'UNQ';

  const registry = new Registry()
    .addChain('Polkadot', relaychainUniversalLocation('Polkadot'), [
      'wss://polkadot-rpc.dwellir.com',
      'wss://polkadot-rpc.publicnode.com',
      'wss://polkadot-public-rpc.blockops.network/ws',
      'wss://polkadot-rpc-tn.dwellir.com',
      'wss://rpc.ibp.network/polkadot',
      'wss://rpc.dotters.network/polkadot',
      'wss://rpc-polkadot.luckyfriday.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot.public.curie.radiumblock.co/ws',
      'wss://rockx-dot.w3node.com/polka-public-dot/ws',
      'wss://dot-rpc.stakeworld.io'
    ])
    .addChain('Unique Network', parachainUniveralLocation('Polkadot', 2037), [
      'wss://unique-rpc.dwellir.com',
      'wss://us-ws.unique.network',
      'wss://asia-ws.unique.network',
      'wss://eu-ws.unique.network'
    ])
    .addUniveralLocation(PolkadotNativeToken, relaychainUniversalLocation('Polkadot'))
    .addUniveralLocation(
      UniqueNativeToken,
      parachainUniveralLocation('Polkadot', 2037)
    )
    .addRelativeLocation('Test Account', location(0, [{
      AccountId32: { id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501' }
    }]));

  const xcm = await registry.connectXcm('Polkadot');
//   xcm.enforceXcmVersion(2);
//   xcm.enforceXcmVersion(3);
  console.log('XCM version:', xcm.xcmVersion);

  // TODO check/convert all junctions add arbitrary byte data
  // TODO conversion for account id text reprs
  const transferTx = await xcm.composeTransfer({
    assets: [
      asset(
        location(0, 'Here'),
        fungible(100000000000),
      ),

      asset('DOT', fungible(500000000)),

      {
        id: 'DOT',
        fun: fungible(42424242),
      },

      {
        id: { parents: 0, interior: 'Here' },
        fun: { Fungible: 500500500500 },
      },
    ],
    feeAssetId: 'DOT',
    destination: 'Unique Network',
    beneficiary: 'Test Account',
  });

  console.log(transferTx.method.toHex());

  xcm.disconnect();
})();
