import {hexToU8a, stringify} from '@polkadot/util';
import {CURRENT_XCM_VERSION} from '@open-xcm-tools/xcm-types';
import {
  MAX_UINT128,
  MAX_UINT32,
  MAX_UINT64,
  MAX_UINT8,
  SanitizationError,
} from '../common';

/**
 * Checks the length of byte data against an expected length.
 *
 * @param fieldName - The name of the field being validated, used for error messages.
 * @param expectedLength - The expected length of the byte data in bytes.
 * @param actualLength - The actual length of the byte data, or null if not provided.
 *
 * @throws {SanitizationError} If actualLength is null or does not match expectedLength.
 */
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

/**
 * Converts a hexadecimal string to a Uint8Array.
 *
 * @param fieldName - The name of the field being converted, used for error messages.
 * @param hex - The hexadecimal string to be converted.
 *
 * @returns {Uint8Array} The converted Uint8Array.
 *
 * @throws {SanitizationError} If the hex string cannot be decoded.
 */
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

/**
 * Checks if a number fits within the specified bit size.
 *
 * @param fieldName - The name of the field being validated, used for error messages.
 * @param expectedBitSize - The expected bit size (8, 32, 64, or 128).
 * @param actualNumber - The actual number to be checked, represented as a bigint.
 *
 * @throws {SanitizationError} If actualNumber is negative or exceeds the maximum value for the expected bit size.
 * @throws {Error} If an unknown bit size is provided.
 */
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

/**
 * Throws a SanitizationError for an invalid junction object.
 *
 * @param objName - The name of the object being validated, used for error messages.
 * @param obj - The object that failed validation.
 *
 * @throws {SanitizationError} Always thrown with details about the invalid object.
 */
export function invalidJunctionObj(objName: string, obj: unknown) {
  throw new SanitizationError(
    `not a V${CURRENT_XCM_VERSION} ${objName}`,
    `invalid object: ${stringify(obj)}`,
  );
}

/**
 * Validates a unit junction object against a list of valid variants.
 *
 * @param objName - The name of the object being validated, used for error messages.
 * @param obj - The object to be validated.
 * @param validUnitVariants - An array of valid unit variants for comparison.
 *
 * @throws {SanitizationError} If the object is not a valid unit variant.
 */
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
