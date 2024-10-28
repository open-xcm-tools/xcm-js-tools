import {ApiPromise, Keyring, WsProvider} from '@polkadot/api';
import {exit} from 'process';

void (async () => {
  await new Promise(f => setTimeout(f, 60000));
  const BDK_URL = process.env.BDK_BALANCER!.replace('http', 'ws');
  const INTERVAL = 10000;
  const INTERVAL_ASHB = 15000;

  const providerRelay = new WsProvider(`${BDK_URL}/relay/`);
  const providerAssetHubA = new WsProvider(`${BDK_URL}/relay-assethubA/`);
  const providerAssetHubB = new WsProvider(`${BDK_URL}/relay-assethubB/`);
  const providerAssetHubC = new WsProvider(`${BDK_URL}/relay-assethubC/`);

  const apiRelay = await ApiPromise.create({provider: providerRelay});
  const apiAssetHubA = await ApiPromise.create({provider: providerAssetHubA});
  const apiAssetHubB = await ApiPromise.create({provider: providerAssetHubB});
  const apiAssetHubC = await ApiPromise.create({provider: providerAssetHubC});

  const keyring = new Keyring({type: 'sr25519'});

  const alice = keyring.addFromUri('//Alice');

  let hrmp = await apiRelay.tx.sudo
    .sudo(apiRelay.tx.hrmp.forceOpenHrmpChannel(2001, 2002, 8, 8192))
    .signAndSend(alice);

  console.log('Hrmp channel for 2001 and 2002 opened!');
  await new Promise(f => setTimeout(f, INTERVAL));

  hrmp = await apiRelay.tx.sudo
    .sudo(apiRelay.tx.hrmp.forceOpenHrmpChannel(2002, 2001, 8, 8192))
    .signAndSend(alice);

  console.log('Hrmp channel for 2002 and 2001 opened!');
  await new Promise(f => setTimeout(f, INTERVAL));

  hrmp = await apiRelay.tx.sudo
    .sudo(apiRelay.tx.hrmp.forceOpenHrmpChannel(2001, 2003, 8, 8192))
    .signAndSend(alice);

  console.log('Hrmp channel for 2001 and 2003 opened!');
  await new Promise(f => setTimeout(f, INTERVAL));

  hrmp = await apiRelay.tx.sudo
    .sudo(apiRelay.tx.hrmp.forceOpenHrmpChannel(2003, 2001, 8, 8192))
    .signAndSend(alice);

  console.log('Hrmp channel for 2003 and 2001 opened!');
  await new Promise(f => setTimeout(f, INTERVAL));
  hrmp = await apiRelay.tx.sudo
    .sudo(apiRelay.tx.hrmp.forceOpenHrmpChannel(2003, 2002, 8, 8192))
    .signAndSend(alice);

  console.log('Hrmp channel for 2003 and 2002 opened!');
  await new Promise(f => setTimeout(f, INTERVAL));
  hrmp = await apiRelay.tx.sudo
    .sudo(apiRelay.tx.hrmp.forceOpenHrmpChannel(2002, 2003, 8, 8192))
    .signAndSend(alice);

  console.log('Hrmp channel for 2002 and 2003 opened!');
  await new Promise(f => setTimeout(f, 60000));

  let asset = await apiRelay.tx.sudo
    .sudo(
      apiRelay.tx.xcmPallet.send(
        {
          V4: {
            parents: 0,
            interior: {
              X1: [
                {
                  Parachain: 2001,
                },
              ],
            },
          },
        },
        {
          V4: [
            {
              UnpaidExecution: {
                weightLimit: 'Unlimited',
              },
            },
            {
              Transact: {
                originKind: 'Superuser',
                requireWeightAtMost: {
                  refTime: 8000000000,
                  proofSize: 8000,
                },
                call: {
                  encoded:
                    '0x3201011f00d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d0104',
                },
              },
            },
          ],
        },
      ),
    )
    .signAndSend(alice);

  console.log('Asset created on AssetHubA');

  await new Promise(f => setTimeout(f, INTERVAL));

  asset = await apiAssetHubA.tx.assets
    .setMetadata(1984, 'USDT', 'USDT', 6)
    .signAndSend(alice);

  console.log('Asset metadata on AssetHubA');

  await new Promise(f => setTimeout(f, INTERVAL));

  asset = await apiRelay.tx.sudo
    .sudo(
      apiRelay.tx.xcmPallet.send(
        {
          V4: {
            parents: 0,
            interior: {
              X1: [
                {
                  Parachain: 2002,
                },
              ],
            },
          },
        },
        {
          V4: [
            {
              UnpaidExecution: {
                weightLimit: 'Unlimited',
              },
            },
            {
              Transact: {
                originKind: 'Superuser',
                requireWeightAtMost: {
                  refTime: 8000000000,
                  proofSize: 8000,
                },
                call: {
                  encoded:
                    '0x3501010300451f043205011f00d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d0104',
                },
              },
            },
          ],
        },
      ),
    )
    .signAndSend(alice);

  console.log('Asset created on AssetHubB');
  await new Promise(f => setTimeout(f, INTERVAL));

  let foreignAsset = await apiAssetHubB.tx.foreignAssets
    .setMetadata(
      {
        parents: 1,
        interior: {
          X3: [{Parachain: 2001}, {PalletInstance: 50}, {GeneralIndex: 1984}],
        },
      },
      'USDT',
      'USDT',
      6,
    )
    .signAndSend(alice);

  console.log('Asset metadata on AssetHubB');

  await new Promise(f => setTimeout(f, INTERVAL));

  asset = await apiRelay.tx.sudo
    .sudo(
      apiRelay.tx.xcmPallet.send(
        {
          V4: {
            parents: 0,
            interior: {
              X1: [
                {
                  Parachain: 2003,
                },
              ],
            },
          },
        },
        {
          V4: [
            {
              UnpaidExecution: {
                weightLimit: 'Unlimited',
              },
            },
            {
              Transact: {
                originKind: 'Superuser',
                requireWeightAtMost: {
                  refTime: 8000000000,
                  proofSize: 8000,
                },
                call: {
                  encoded:
                    '0x3501010300451f043205011f00d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d0104',
                },
              },
            },
          ],
        },
      ),
    )
    .signAndSend(alice);

  console.log('Asset created on AssetHubC');

  await new Promise(f => setTimeout(f, INTERVAL));

  foreignAsset = await apiAssetHubC.tx.foreignAssets
    .setMetadata(
      {
        parents: 1,
        interior: {
          X3: [{Parachain: 2001}, {PalletInstance: 50}, {GeneralIndex: 1984}],
        },
      },
      'USDT',
      'USDT',
      6,
    )
    .signAndSend(alice);

  console.log('Asset metadata on AssetHubC');

  await new Promise(f => setTimeout(f, INTERVAL_ASHB));

  await apiAssetHubA.tx.assets
    .mint(
      1984,
      {id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'},
      150000000,
    )
    .signAndSend(alice);
  console.log('Tokens minted for AssetHubA');

  await new Promise(f => setTimeout(f, INTERVAL_ASHB));

  await apiAssetHubA.tx.assets
    .mint(
      1984,
      {id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'},
      250000000,
    )
    .signAndSend(alice);
  console.log('Tokens minted for AssetHubA');

  await apiAssetHubB.tx.foreignAssets
    .mint(
      {
        parents: 1,
        interior: {
          X3: [{Parachain: 2001}, {PalletInstance: 50}, {GeneralIndex: 1984}],
        },
      },
      {id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'},
      50000000,
    )
    .signAndSend(alice);

  console.log('Tokens minted for AssetHubB');

  await new Promise(f => setTimeout(f, INTERVAL_ASHB));

  await apiAssetHubB.tx.foreignAssets
    .mint(
      {
        parents: 1,
        interior: {
          X3: [{Parachain: 2001}, {PalletInstance: 50}, {GeneralIndex: 1984}],
        },
      },
      {id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'},
      150000000,
    )
    .signAndSend(alice);

  console.log('Tokens minted for AssetHubB');

  await apiAssetHubC.tx.foreignAssets
    .mint(
      {
        parents: 1,
        interior: {
          X3: [{Parachain: 2001}, {PalletInstance: 50}, {GeneralIndex: 1984}],
        },
      },
      {id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'},
      50000000,
    )
    .signAndSend(alice);
  console.log('Tokens minted for AssetHubC');

  await new Promise(f => setTimeout(f, INTERVAL_ASHB));

  await apiAssetHubC.tx.foreignAssets
    .mint(
      {
        parents: 1,
        interior: {
          X3: [{Parachain: 2001}, {PalletInstance: 50}, {GeneralIndex: 1984}],
        },
      },
      {id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'},
      150000000,
    )
    .signAndSend(alice);
  console.log('Tokens minted for AssetHubC');
})();
