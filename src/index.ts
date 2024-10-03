import {Registry} from './registry';
import {
  location,
  parachainUniversalLocation,
  relaychainUniversalLocation,
} from './util';

const BDK_URL = process.env.BDK_URL!;

void (async () => {
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
    .addRelativeLocation(
      'Alice',
      location(0n, [
        {
          accountId32: {
            id: '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
          },
        },
      ]),
    );

  await registry.addNativeCurrency('Polkadot');
  registry.addCurrency({
    symbol: 'AHST',
    decimals: 6,
    universalLocation: {
      x4: [
        {globalConsensus: 'westend'},
        {parachain: 2001n},
        {palletInstance: 50n},
        {generalIndex: 1984n},
      ],
    },
  });

  const xcm = await registry.connectXcm('AssetHubB');
  // xcm.enforceXcmVersion(2);
  // xcm.enforceXcmVersion(3);
  // xcm.enforceXcmVersion(4);
  console.log('XCM version:', xcm.xcmVersion);

  // TODO check/convert all junctions add arbitrary byte data
  // TODO conversion for account id text reprs
  const transferTx = await xcm.composeTransfer({
    origin: 'Alice',
    assets: [xcm.adjustedFungible('AHST', '10')],
    feeAssetId: 'AHST',
    destination: 'AssetHubC',
    beneficiary: 'Alice',
  });

  console.log(transferTx.method.toHex());

  await xcm.disconnect();
})();
