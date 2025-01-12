import {SimpleXcm} from '@open-xcm-tools/simple-xcm';
import {ApiPromise} from '@polkadot/api';
import {SubmittableExtrinsic} from '@polkadot/api/types';
import {IKeyringPair, ISubmittableResult} from '@polkadot/types/types';

export type AssetsPalletName = 'assets' | 'foreignAssets';

export const pseudoUsdName = 'pUSD';
export const pseudoUsdId = 1984n;
export const pseudoUsdDecimals = 6;
export const pseudoUsdMinBalance = 10000;

async function pauseUntil(fn: () => Promise<boolean>) {
  const maxIters = 120;
  let iter = 0;

  while (iter <= maxIters) {
    ++iter;

    if (await fn()) {
      return;
    } else {
      await new Promise(f => setTimeout(f, 1000));
    }
  }

  throw new Error('The maximum retries count during pause has been reached');
}

export async function finalize(
  signer: IKeyringPair,
  tx: SubmittableExtrinsic<'promise'>,
) {
  const promise: Promise<any> = new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('finalization timeout')),
      120000,
    );

    const unsubPromise = tx.signAndSend(signer, result => {
      if (result.status.isFinalized) {
        clearTimeout(timer);
        resolve({result, unsubPromise});
      } else if (result.isError) {
        reject(result);
      }
    });
  });

  const {result, unsubPromise} = await promise;
  const unsub = await unsubPromise;
  unsub();

  return result;
}

export async function tryUntilFinalized(
  signer: IKeyringPair,
  tx: SubmittableExtrinsic<'promise'>,
) {
  const maxIters = 5;
  let iter = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    ++iter;

    try {
      return await finalize(signer, tx);
    } catch (error: any) {
      const hasStatus = 'status' in error;

      if (!hasStatus) {
        throw error;
      }

      const result: ISubmittableResult = error;

      if (iter > maxIters) {
        throw new Error('The maximum retries count has been reached', {
          cause: error,
        });
      }

      if (result.status.isInvalid) {
        console.error(
          'Got invalid extrinsic status. Maybe due to async backing. Retrying in 5s...',
        );
        await new Promise(f => setTimeout(f, 5000));
      } else {
        throw new Error('Extrinsic failed', {cause: result.status});
      }
    }
  }
}

export async function ensureTwoWayHrmpChannelsOpened(
  signer: IKeyringPair,
  api: ApiPromise,
  pairs: [bigint, bigint][],
) {
  const channelsInfo = await Promise.all(
    pairs.map(([fromParaId, toParaId]) =>
      api.query.hrmp
        .hrmpChannels({
          sender: fromParaId,
          recipient: toParaId,
        })
        .then(c => c.toJSON()),
    ),
  );

  const allAlreadyOpened = channelsInfo.every(channel => channel !== null);

  const atLeastOneChannelJustOpened = true;
  if (allAlreadyOpened) {
    return !atLeastOneChannelJustOpened;
  }

  const openTxs = pairs
    .map(([fromParaId, toParaId]) => [
      api.tx.hrmp.forceOpenHrmpChannel(fromParaId, toParaId, 8, 8192),
      api.tx.hrmp.forceOpenHrmpChannel(toParaId, fromParaId, 8, 8192),
    ])
    .flat();

  await tryUntilFinalized(
    signer,
    api.tx.sudo.sudo(api.tx.utility.forceBatch(openTxs)),
  );

  return atLeastOneChannelJustOpened;
}

export async function pauseUntilNextSession(api: ApiPromise) {
  const oldSessionIndex = await api.query.session.currentIndex();

  await pauseUntil(async () => {
    const newSessionIndex = await api.query.session.currentIndex();

    return newSessionIndex > oldSessionIndex;
  });
}

export function extrinsicRelayRootXcmSendUnpaidTransact(
  api: ApiPromise,
  tx: SubmittableExtrinsic<'promise'>,
  destParaId: number,
): SubmittableExtrinsic<'promise'> {
  return api.tx.sudo.sudo(
    api.tx.xcmPallet.send(
      {
        V4: {
          parents: 0,
          interior: {
            X1: [{Parachain: destParaId}],
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
                proofSize: 10000,
              },
              call: {encoded: tx.method.toHex()},
            },
          },
        ],
      },
    ),
  );
}

export function resolvePseudoUsdId(
  xcm: SimpleXcm,
  assetsPalletName: AssetsPalletName,
) {
  if (assetsPalletName === 'assets') {
    return pseudoUsdId;
  } else if (assetsPalletName === 'foreignAssets') {
    return xcm.resolveRelativeLocation(pseudoUsdName);
  } else {
    throw new Error(`${assetsPalletName}: unknown assets pallet`);
  }
}

export async function assetExists(
  api: ApiPromise,
  assetsPalletName: AssetsPalletName,
  assetId: any,
) {
  const pallet = api.query[assetsPalletName];

  const asset = await pallet.asset(assetId).then(a => a.toJSON());

  return asset != null;
}

export async function pauseUntilPseudoUsdCreated(
  xcm: SimpleXcm,
  assetsPalletName: AssetsPalletName,
) {
  const assetId = resolvePseudoUsdId(xcm, assetsPalletName);

  await pauseUntil(() => assetExists(xcm.api, assetsPalletName, assetId));
}

export async function getParaId(api: ApiPromise) {
  return (await api.query.parachainInfo.parachainId()).toJSON() as number;
}

export async function forceCreatePseudoUsdEverywhere(
  signer: IKeyringPair,
  xcmRelay: SimpleXcm,
  originalXcm: SimpleXcm,
  derivativeXcms: SimpleXcm[],
) {
  const xcmSendInfo = async (
    destXcm: SimpleXcm,
    assetsPalletName: AssetsPalletName,
  ) => {
    const sendExtrinsic = await relayXcmSendCreatePseudoUsd(
      xcmRelay,
      destXcm,
      assetsPalletName,
      signer.address,
    );

    const pauseUntilCreated = () =>
      pauseUntilPseudoUsdCreated(destXcm, assetsPalletName);

    return sendExtrinsic ? {sendExtrinsic, pauseUntilCreated} : null;
  };

  const sendInfosUnfiltered = await Promise.all([
    xcmSendInfo(originalXcm, 'assets'),
    ...derivativeXcms.map(derivativeXcm =>
      xcmSendInfo(derivativeXcm, 'foreignAssets'),
    ),
  ]);

  const sendInfos = sendInfosUnfiltered.filter(info => info !== null);

  if (sendInfos.length !== 0) {
    const sendTxs = sendInfos.map(info => info!.sendExtrinsic);
    const deferredPauses = sendInfos.map(info => info!.pauseUntilCreated);

    await tryUntilFinalized(signer, xcmRelay.api.tx.utility.batchAll(sendTxs));

    await Promise.all(deferredPauses.map(pause => pause()));
  }
}

async function relayXcmSendCreatePseudoUsd(
  xcmRelay: SimpleXcm,
  xcmDest: SimpleXcm,
  assetsPalletName: AssetsPalletName,
  owner: string,
) {
  const createExtrinsic = await extrinsicCreatePseudoUsd(
    xcmDest,
    assetsPalletName,
    owner,
  );

  if (createExtrinsic === null) {
    return null;
  }

  return extrinsicRelayRootXcmSendUnpaidTransact(
    xcmRelay.api,
    createExtrinsic,
    await getParaId(xcmDest.api),
  );
}

async function extrinsicCreatePseudoUsd(
  xcm: SimpleXcm,
  assetsPalletName: AssetsPalletName,
  owner: string,
) {
  const assetId = resolvePseudoUsdId(xcm, assetsPalletName);

  if (await assetExists(xcm.api, assetsPalletName, assetId)) {
    return null;
  }

  const isSufficient = true;

  const create = xcm.api.tx[assetsPalletName].forceCreate(
    assetId,
    owner,
    isSufficient,
    pseudoUsdMinBalance,
  );

  const setMetadata = xcm.api.tx[assetsPalletName].forceSetMetadata(
    assetId,
    pseudoUsdName,
    pseudoUsdName,
    pseudoUsdDecimals,
    /* isFrozen = */ false,
  );

  return xcm.api.tx.utility.batchAll([create, setMetadata]);
}

export async function pseudoUsdBalance(
  xcm: SimpleXcm,
  assetsPalletName: AssetsPalletName,
  account: string,
) {
  const assetId = resolvePseudoUsdId(xcm, assetsPalletName);

  return await xcm.api.query[assetsPalletName]
    .account(assetId, account)
    .then(b => b.toJSON() as any)
    .then(b => (b ? (b.balance as number) : 0));
}

export async function pauseUntilPseudoUsdBalanceIncreased(
  xcm: SimpleXcm,
  assetsPalletName: AssetsPalletName,
  account: string,
  oldBalance: number,
) {
  let newBalance = oldBalance;

  await pauseUntil(async () => {
    newBalance = await pseudoUsdBalance(xcm, assetsPalletName, account);

    return newBalance > oldBalance;
  });

  return newBalance;
}
