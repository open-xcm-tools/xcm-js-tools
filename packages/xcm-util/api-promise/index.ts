import {ApiPromise, WsProvider} from '@polkadot/api';

export type ApiPromiseFactory = (endpoints: string[]) => Promise<ApiPromise>;

/**
 * Default implementation of the `ApiPromiseFactory` interface.
 *
 * Note: This is a most straightforward implementation that creates a new `ApiPromise` instance for each call.
 * In many cases, you may want to implement your own factory function to manage and reuse the ApiPromise instances.
 * @param endpoints - The list of websocket endpoints to connect to.
 */
export const defaultApiPromiseFactory: ApiPromiseFactory = (
  endpoints: string[],
) => {
  const provider = new WsProvider(endpoints);

  return ApiPromise.create({provider});
};
