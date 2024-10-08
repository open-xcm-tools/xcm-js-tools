import {hexToU8a, stringify} from '@polkadot/util';
import {CURRENT_XCM_VERSION} from '@open-xcm-tools/xcm-types';
import {
  MAX_UINT128,
  MAX_UINT32,
  MAX_UINT64,
  MAX_UINT8,
  SanitizationError,
} from '../common';

export function checkByteDataLength(
  fieldName: string,
  expectedLength: number,
  actualLength: number | null,
) {
  if (actualLength === null) {
    throw new SanitizationError(fieldName, `${fieldName} must be hex string`);
  }

  if (expectedLength !== actualLength) {
    throw new SanitizationError(
      fieldName,
      `${fieldName} has incorrect length: expected ${expectedLength} bytes, got ${actualLength} bytes`,
    );
  }
}

export function hexToUint8Array(fieldName: string, hex: string): Uint8Array {
  try {
    return hexToU8a(hex);
  } catch (error) {
    throw new SanitizationError(
      fieldName,
      `failed to decode ${fieldName} hex string to Uint8Array.`,
      error as Error,
    );
  }
}

export function checkNumberBitSize(
  fieldName: string,
  expectedBitSize: 8 | 32 | 64 | 128,
  actualNumber: bigint,
) {
  if (actualNumber < 0) {
    throw new SanitizationError(
      fieldName,
      `${fieldName} is less than 0, expected positive integer.`,
    );
  }
  let expectedMaxNumber: bigint;
  switch (expectedBitSize) {
    case 8:
      expectedMaxNumber = MAX_UINT8;
      break;
    case 32:
      expectedMaxNumber = MAX_UINT32;
      break;
    case 64:
      expectedMaxNumber = MAX_UINT64;
      break;
    case 128:
      expectedMaxNumber = MAX_UINT128;
      break;
    default:
      throw new Error(`Unknown bit size for ${fieldName}`);
  }
  if (actualNumber > expectedMaxNumber) {
    throw new SanitizationError(
      fieldName,
      `${fieldName} is greater than u${expectedBitSize}`,
    );
  }
}

export function invalidJunctionObj(objName: string, obj: unknown) {
  throw new SanitizationError(
    `not a V${CURRENT_XCM_VERSION} ${objName}`,
    `invalid object: ${stringify(obj)}`,
  );
}

export function checkUnitJunctionObj<T>(
  objName: string,
  obj: T,
  validUnitVariants: string[],
) {
  const isValid = validUnitVariants.find(variant => variant === obj);
  if (isValid === undefined) {
    invalidJunctionObj(objName, obj);
  }
}
