import {ApiPromise, WsProvider} from '@polkadot/api';

export type ApiPromiseFactory = {
  get: (endpoints: string[]) => Promise<ApiPromise>;
  finalize: (api: ApiPromise) => Promise<void>;
};

/**
 * Default implementation of the `ApiPromiseFactory` interface.
 *
 * Note: This is a most straightforward implementation that creates a new `ApiPromise` instance for each call
 * and finalizes it by disconnecting it.
 * In many cases, you may want to implement your own factory function to manage and reuse the ApiPromise instances.
 */
export const defaultApiPromiseFactory: ApiPromiseFactory = {
  get: (endpoints: string[]) => {
    const provider = new WsProvider(endpoints);

    return ApiPromise.create({provider});
  },
  finalize: api => api.disconnect(),
};
