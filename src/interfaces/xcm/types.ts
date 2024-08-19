// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { Enum, Option, Result, Struct, Vec } from '@polkadot/types-codec';
import type { ITuple } from '@polkadot/types-codec/types';
import type { Event } from '@polkadot/types/interfaces/system';

/** @name DryRunCallEffects */
export interface DryRunCallEffects extends Struct {
  readonly execution_result: Result<FrameSupportDispatchPostDispatchInfo, SpRuntimeDispatchErrorWithPostInfo>;
  readonly emitted_events: Vec<Event>;
  readonly local_xcm: Option<XcmVersionedXcm>;
  readonly forwarded_xcms: Vec<ITuple<[XcmVersionedLocation, Vec<XcmVersionedXcm>]>>;
}

/** @name DryRunError */
export interface DryRunError extends Enum {
  readonly isUnimplemented: boolean;
  readonly isVersionedConversionFailed: boolean;
  readonly type: 'Unimplemented' | 'VersionedConversionFailed';
}

/** @name DryRunXcmEffects */
export interface DryRunXcmEffects extends Struct {
  readonly execution_result: StagingXcmV4TraitsOutcome;
  readonly emitted_events: Vec<Event>;
  readonly forwarded_xcms: Vec<ITuple<[XcmVersionedLocation, Vec<XcmVersionedXcm>]>>;
}

export type PHANTOM_XCM = 'xcm';
