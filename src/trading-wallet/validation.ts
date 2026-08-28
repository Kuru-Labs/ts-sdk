import {
  getAddress,
  hexToBigInt,
  isAddress,
  isAddressEqual,
  isHex,
  size,
  zeroAddress,
  type Address,
  type Hex
} from "viem";

import { KuruSdkError } from "../errors";
import {
  NativeExecInstruction,
  NativeTif,
  normalizeNativeOrders,
  type NativeOrder,
  type NativeOrderInput
} from "../spot";
import { assertUint, assertUintNumber } from "../utils";
import type {
  Eip7702AuthorizationSignature,
  WalletIntentHeader,
  WalletIntentHeaderInput,
  WalletUintInput
} from "./types";

export const MAX_WALLET_ARRAY_ITEMS = 4096;
export const MAX_PACKED_OPERATIONS_BYTES = 64 << 10;
export const MAX_WALLET_SLOTS = 62;

const SECP256K1_ORDER = BigInt(
  "0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"
);
const SECP256K1_HALF_ORDER = SECP256K1_ORDER >> 1n;

export function normalizeAddress(value: Address, fieldName: string, allowZero = false): Address {
  if (!isAddress(value, { strict: false })) {
    throw new KuruSdkError("INVALID_ADDRESS", `${fieldName} must be a valid address.`);
  }
  const normalized = getAddress(value).toLowerCase() as Address;
  if (!allowZero && isAddressEqual(normalized, zeroAddress)) {
    throw new KuruSdkError("INVALID_ADDRESS", `${fieldName} must not be the zero address.`);
  }
  return normalized;
}

export function normalizeChainId(chainId: number): number {
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new KuruSdkError("INVALID_UINT", "chainId must be a positive safe integer.");
  }
  return chainId;
}

export function normalizeBytes32(value: Hex, fieldName: string, allowZero = true): Hex {
  if (!isHex(value, { strict: true }) || size(value) !== 32) {
    throw new KuruSdkError("INVALID_BYTES_LENGTH", `${fieldName} must be exactly 32 bytes.`);
  }
  if (!allowZero && hexToBigInt(value) === 0n) {
    throw new KuruSdkError("INVALID_HEX", `${fieldName} must not be zero.`);
  }
  return value.toLowerCase() as Hex;
}

export function normalizeWalletIntentHeader(header: WalletIntentHeaderInput): WalletIntentHeader {
  const accountId = assertUint(header.accountId, 40, "header.accountId");
  if (accountId === 0n) {
    throw new KuruSdkError("INVALID_WALLET_INTENT", "header.accountId must not be zero.");
  }

  const builderFeePps = assertUintNumber(header.builderFeePps ?? 0, 32, "header.builderFeePps");
  const builder = normalizeAddress(header.builder ?? zeroAddress, "header.builder", true);
  const hasBuilder = !isAddressEqual(builder, zeroAddress);
  if ((builderFeePps === 0) !== !hasBuilder) {
    throw new KuruSdkError(
      "INVALID_WALLET_INTENT",
      "header.builder and header.builderFeePps must either both be set or both be zero."
    );
  }

  return {
    accountId,
    market: normalizeAddress(header.market, "header.market"),
    authNonce: assertUint(header.authNonce, 256, "header.authNonce"),
    nonce: assertUint(header.nonce, 64, "header.nonce"),
    deadline: assertUint(header.deadline, 64, "header.deadline"),
    clientOrderId: normalizeBytes32(header.clientOrderId, "header.clientOrderId"),
    builder,
    builderFeePps
  };
}

export function normalizeExpectedOrderIds(values: readonly WalletUintInput[]): readonly bigint[] {
  assertArraySize(values.length, "expectedOrderIds");
  return values.map((value, index) => assertUint(value, 64, `expectedOrderIds[${index}]`));
}

export function normalizeCancelSlotIndexes(values: readonly WalletUintInput[]): readonly number[] {
  assertArraySize(values.length, "cancelSlotIdxs");
  const normalized = values.map((value, index) =>
    assertUintNumber(value, 8, `cancelSlotIdxs[${index}]`)
  );
  assertUniqueSlots(normalized, "cancelSlotIdxs");
  return normalized;
}

export function normalizeAndValidateOrders(
  values: readonly NativeOrderInput[]
): readonly NativeOrder[] {
  assertArraySize(values.length, "orders");
  const orders = normalizeNativeOrders(values);
  orders.forEach((order, index) => {
    if (order.quantity === 0n) {
      throw new KuruSdkError(
        "INVALID_WALLET_INTENT",
        `orders[${index}].quantity must not be zero.`
      );
    }
    if (order.price === 0n) {
      throw new KuruSdkError("INVALID_WALLET_INTENT", `orders[${index}].price must not be zero.`);
    }
    if (order.price === 0xffff_ffffn) {
      throw new KuruSdkError(
        "INVALID_WALLET_INTENT",
        `orders[${index}].price must be below uint32.max.`
      );
    }
    if (
      order.executionInstruction === NativeExecInstruction.POST_ONLY &&
      order.tif !== NativeTif.GTC
    ) {
      throw new KuruSdkError(
        "INVALID_WALLET_INTENT",
        `orders[${index}] POST_ONLY orders must use GTC.`
      );
    }
    if (order.tif !== NativeTif.GTC && order.minSizeAfterBlock !== 0n) {
      throw new KuruSdkError(
        "INVALID_WALLET_INTENT",
        `orders[${index}].minSizeAfterBlock must be zero for IOC/FOK orders.`
      );
    }
  });
  return orders;
}

export function normalizePackedOperations(value: Hex): {
  packedOps: Hex;
  operationCount: number;
} {
  if (!isHex(value, { strict: true })) {
    throw new KuruSdkError("INVALID_HEX", "packedOps must be strict hexadecimal bytes.");
  }
  const byteLength = size(value);
  if (byteLength === 0 || byteLength % 32 !== 0) {
    throw new KuruSdkError(
      "INVALID_BYTES_LENGTH",
      "packedOps must contain one or more 32-byte operations."
    );
  }
  if (byteLength > MAX_PACKED_OPERATIONS_BYTES) {
    throw new KuruSdkError("INVALID_BYTES_LENGTH", "packedOps exceeds 64 KiB.");
  }

  const operationCount = byteLength / 32;
  assertArraySize(operationCount, "packedOps");
  const slots: number[] = [];
  for (let index = 0; index < operationCount; index += 1) {
    const start = 2 + index * 64;
    const word = BigInt(`0x${value.slice(start, start + 64)}`);
    const slot = Number(word & 0xffn);
    const flags = Number((word >> 8n) & 0xffn);
    const price = (word >> 16n) & 0xffff_ffffn;
    const quantity = (word >> 48n) & ((1n << 96n) - 1n);
    const minSizeAfterBlock = (word >> 144n) & 0xffff_ffffn;
    const reserved = word >> 176n;

    if (slot >= MAX_WALLET_SLOTS) {
      throw new KuruSdkError(
        "INVALID_WALLET_INTENT",
        `packedOps[${index}] uses slot ${slot}; wallet slots must be below ${MAX_WALLET_SLOTS}.`
      );
    }
    if ((flags & ~0x09) !== 0 || reserved !== 0n) {
      throw new KuruSdkError(
        "INVALID_WALLET_INTENT",
        `packedOps[${index}] contains unsupported flag or reserved bits.`
      );
    }
    const isCancel = price === 0n && quantity === 0n;
    if (isCancel && (flags !== 0 || minSizeAfterBlock !== 0n)) {
      throw new KuruSdkError(
        "INVALID_WALLET_INTENT",
        `packedOps[${index}] is not a strict cancel operation.`
      );
    }
    if (!isCancel && (price === 0n || quantity === 0n)) {
      throw new KuruSdkError(
        "INVALID_WALLET_INTENT",
        `packedOps[${index}] must set both price and quantity.`
      );
    }
    if (!isCancel && price === 0xffff_ffffn) {
      throw new KuruSdkError(
        "INVALID_WALLET_INTENT",
        `packedOps[${index}].price must be below uint32.max.`
      );
    }
    slots.push(slot);
  }
  assertUniqueSlots(slots, "packedOps");
  return { packedOps: value.toLowerCase() as Hex, operationCount };
}

export function normalizeAuthorizationSignature(
  signature: Eip7702AuthorizationSignature
): Eip7702AuthorizationSignature {
  const r = normalizeBytes32(signature.r, "authorization.r", false);
  const s = normalizeBytes32(signature.s, "authorization.s", false);
  if (signature.yParity !== 0 && signature.yParity !== 1) {
    throw new KuruSdkError("INVALID_SIGNATURE", "authorization.yParity must be 0 or 1.");
  }
  assertCanonicalSignatureScalars(r, s);
  return { r, s, yParity: signature.yParity };
}

export function normalizeWalletSignature(signature: Hex): Hex {
  if (!isHex(signature, { strict: true }) || size(signature) !== 65) {
    throw new KuruSdkError("INVALID_SIGNATURE", "Wallet signatures must be 65 bytes.");
  }
  const r: Hex = `0x${signature.slice(2, 66)}`;
  const s: Hex = `0x${signature.slice(66, 130)}`;
  const parity = Number.parseInt(signature.slice(130, 132), 16);
  const yParity = parity === 27 || parity === 28 ? parity - 27 : parity;
  if (yParity !== 0 && yParity !== 1) {
    throw new KuruSdkError("INVALID_SIGNATURE", "Wallet signature parity must be 0/1 or 27/28.");
  }
  assertCanonicalSignatureScalars(r, s);
  const normalized: Hex = `${r}${s.slice(2)}${yParity === 0 ? "1b" : "1c"}`;
  return normalized;
}

export function assertArraySize(length: number, fieldName: string): void {
  if (!Number.isSafeInteger(length) || length < 0 || length > MAX_WALLET_ARRAY_ITEMS) {
    throw new KuruSdkError(
      "INVALID_WALLET_INTENT",
      `${fieldName} exceeds ${MAX_WALLET_ARRAY_ITEMS} items.`
    );
  }
}

function assertUniqueSlots(slots: readonly number[], fieldName: string): void {
  const seen = new Set<number>();
  slots.forEach((slot, index) => {
    if (slot >= MAX_WALLET_SLOTS) {
      throw new KuruSdkError(
        "INVALID_WALLET_INTENT",
        `${fieldName}[${index}] must be below ${MAX_WALLET_SLOTS}.`
      );
    }
    if (seen.has(slot)) {
      throw new KuruSdkError(
        "INVALID_WALLET_INTENT",
        `${fieldName} contains duplicate slot ${slot}.`
      );
    }
    seen.add(slot);
  });
}

function assertCanonicalSignatureScalars(r: Hex, s: Hex): void {
  const rValue = hexToBigInt(r);
  const sValue = hexToBigInt(s);
  if (
    rValue === 0n ||
    rValue >= SECP256K1_ORDER ||
    sValue === 0n ||
    sValue > SECP256K1_HALF_ORDER
  ) {
    throw new KuruSdkError(
      "INVALID_SIGNATURE",
      "Signature must contain valid r and canonical low-s values."
    );
  }
}
