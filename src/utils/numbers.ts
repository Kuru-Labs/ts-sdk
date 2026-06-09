import { KuruSdkError } from "../errors";

export function toBigInt(value: bigint | number | string, fieldName = "value"): bigint {
  try {
    const result = BigInt(value);
    if (result < 0n) {
      throw new Error(`${fieldName} must be non-negative.`);
    }
    return result;
  } catch (cause) {
    throw new KuruSdkError("INVALID_UINT", `${fieldName} must be an unsigned integer.`, { cause });
  }
}

export function assertUint(value: bigint | number | string, bits: number, fieldName: string): bigint {
  const result = toBigInt(value, fieldName);
  const max = (1n << BigInt(bits)) - 1n;
  if (result > max) {
    throw new KuruSdkError("INVALID_UINT", `${fieldName} exceeds uint${bits}.`);
  }
  return result;
}

export function assertUintNumber(value: bigint | number | string, bits: number, fieldName: string): number {
  const result = assertUint(value, bits, fieldName);
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new KuruSdkError("INVALID_UINT", `${fieldName} exceeds Number.MAX_SAFE_INTEGER.`);
  }
  return Number(result);
}

export function unixSecondsNow(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

export function unixMillisecondsNow(): bigint {
  return BigInt(Date.now());
}

export function deadlineSeconds(secondsFromNow: bigint | number | string): bigint {
  return unixSecondsNow() + toBigInt(secondsFromNow, "secondsFromNow");
}
