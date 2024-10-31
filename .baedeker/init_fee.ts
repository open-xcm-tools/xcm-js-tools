import {ApiPromise, Keyring, WsProvider} from '@polkadot/api';
import {exit} from 'process';

async function retry(fn, ...args) {
  while (true) {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Error occurred, retrying...', error);
      await new Promise(f => setTimeout(f, 5000));
    }
  }
}

async function openHrmpChannel(api, alice, para1, para2) {
  await retry(() =>
    api.tx.sudo
      .sudo(api.tx.hrmp.forceOpenHrmpChannel(para1, para2, 8, 8192))
      .signAndSend(alice),
  );
  console.log(`Hrmp channel for ${para1} and ${para2} opened!`);
}

async function sendTransaction(api, alice, callHex) {
  await retry(() =>
    api.tx.sudo
      .sudo(
        api.tx.xcmPallet.send(
          {
            V4: {
              parents: 0,
              interior: {
                X1: [{Parachain: api.parachainId}],
              },
            },
          },
          {
            V4: [
              {UnpaidExecution: {weightLimit: 'Unlimited'}},
              {
                Transact: {
                  originKind: 'Superuser',
                  requireWeightAtMost: {
                    refTime: 8000000000,
                    proofSize: 8000,
                  },
                  call: {encoded: callHex},
                },
              },
            ],
          },
        ),
      )
      .signAndSend(alice),
  );
}

void (async () => {
  await new Promise(f => setTimeout(f, 60000));
  const BDK_URL = process.env.BDK_BALANCER!.replace('http', 'ws');
  const INTERVAL = 10000;
  const INTERVAL_ASHB = 15000;

  const providers = [
    new WsProvider(`${BDK_URL}/relay/`),
    new WsProvider(`${BDK_URL}/relay-assethubA/`),
    new WsProvider(`${BDK_URL}/relay-assethubB/`),
    new WsProvider(`${BDK_URL}/relay-assethubC/`),
  ];

  const apis = await Promise.all(
    providers.map(provider => ApiPromise.create({provider})),
  );
  const [apiRelay, apiAssetHubA, apiAssetHubB, apiAssetHubC] = apis;

  const keyring = new Keyring({type: 'sr25519'});
  const alice = keyring.addFromUri('//Alice');

  const channels = [
    [2001, 2002],
    [2002, 2001],
    [2001, 2003],
    [2003, 2001],
    [2003, 2002],
    [2002, 2003],
  ];

  for (const [para1, para2] of channels) {
    await openHrmpChannel(apiRelay, alice, para1, para2);
    await new Promise(f => setTimeout(f, INTERVAL));
  }

  const forceCreateHex = apiAssetHubA.tx.assets
    .forceCreate(
      1984,
      {Id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'},
      true,
      1,
    )
    .toHex();

  await sendTransaction(apiRelay, alice, forceCreateHex);
  console.log('Asset created on AssetHubA');
  await new Promise(f => setTimeout(f, INTERVAL));

  await retry(() =>
    apiAssetHubA.tx.assets
      .setMetadata(1984, 'USDT', 'USDT', 6)
      .signAndSend(alice),
  );
  console.log('Asset metadata on AssetHubA');
  await new Promise(f => setTimeout(f, INTERVAL));

  const foreignAssetsForceCreateHex = apiAssetHubB.tx.foreignAssets
    .forceCreate(
      1,
      {X3: [{Parachain: 2001}, {PalletInstance: 50}, {GeneralIndex: 1984}]},
      '5Grwva  EF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      true,
      1,
    )
    .toHex();

  await sendTransaction(apiRelay, alice, foreignAssetsForceCreateHex);
  console.log('Asset created on AssetHubB');
  await new Promise(f => setTimeout(f, INTERVAL));

  await retry(() =>
    apiAssetHubB.tx.foreignAssets
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
      .signAndSend(alice),
  );
  console.log('Asset metadata on AssetHubB');
  await new Promise(f => setTimeout(f, INTERVAL));

  await sendTransaction(apiRelay, alice, foreignAssetsForceCreateHex);
  console.log('Asset created on AssetHubC');
  await new Promise(f => setTimeout(f, INTERVAL));

  await retry(() =>
    apiAssetHubC.tx.foreignAssets
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
      .signAndSend(alice),
  );
  console.log('Asset metadata on AssetHubC');
  await new Promise(f => setTimeout(f, INTERVAL_ASHB));

  const mintAmount1 = 150000000;
  const mintAmount2 = 250000000;
  const mintId = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

  await retry(() =>
    apiAssetHubA.tx.assets
      .mint(1984, {id: mintId}, mintAmount1)
      .signAndSend(alice),
  );
  console.log('Tokens minted for AssetHubA');

  await new Promise(f => setTimeout(f, INTERVAL_ASHB));

  await retry(() =>
    apiAssetHubA.tx.assets
      .mint(1984, {id: mintId}, mintAmount2)
      .signAndSend(alice),
  );
  console.log('Tokens minted for AssetHubA');

  exit(0);
})();
