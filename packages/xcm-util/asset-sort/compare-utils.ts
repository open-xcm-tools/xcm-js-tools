import {XcmVersion} from '@open-xcm-tools/xcm-types';

export function validateHexStringType(
  fieldName: string,
  ...fields: (string | Uint8Array)[]
): Uint8Array[] {
  fields.map(el => {
    if (typeof el === 'string') {
      throw new Error(`Invalid ${fieldName} type, please use sanitizeAssets.`);
    }
  });
  return fields as Uint8Array[];
}

export function saturatingAdd(
  left: bigint,
  right: bigint,
  max: bigint,
): bigint {
  const res = left + right;
  return res > max ? max : res;
}

export function checkBigIntDiff(diff: bigint) {
  if (diff === 0n) {
    return 0;
  } else {
    return diff > 0n ? 1 : -1;
  }
}

function getEnumVariant<T extends Record<string, unknown>>(
  obj: T | string,
): string {
  return typeof obj === 'string' ? obj : Object.keys(obj)[0];
}

export function compareUInt8Array(
  array1: Uint8Array,
  array2: Uint8Array,
): number {
  if (array1.length !== array2.length) return array1.length - array2.length;
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return array1[i] > array2[i] ? 1 : -1;
    }
  }
  return 0;
}

export function compareEnumObjects<T extends Record<string, unknown>>(
  xcmVersion: XcmVersion,
  obj1: T | string,
  obj2: T | string,
  order: Map<XcmVersion, Map<string, number>>,
  objectName: string,
) {
  const [typeA, typeB] = [getEnumVariant(obj1), getEnumVariant(obj2)];
  if (typeA !== typeB) {
    const typeAName = order.get(xcmVersion)!.get(typeA),
      typeBName = order.get(xcmVersion)!.get(typeB);
    if (typeAName === undefined || typeBName === undefined) {
      throw new Error(`compareObjectTypes: unknown ${objectName} type`);
    }
    return typeAName - typeBName;
  }
  return 0;
}
