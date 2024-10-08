import {Location} from './xcm-types';

export type Origin =
  | {System: SystemOrigin}
  | {Xcm: Location}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | {[K in string]: any};

export type SystemOrigin = 'Root' | {Signed: string} | 'None';
