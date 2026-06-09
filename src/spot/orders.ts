import { concatHex, numberToHex, type Hex } from "viem";

import { KuruSdkError } from "../errors";
import { assertUint, assertUintNumber } from "../utils";
import {
  NativeExecInstruction,
  NativeSide,
  NativeTif,
  type NativeExecInstructionInput,
  type NativeOrder,
  type NativeOrderInput,
  type NativeSideInput,
  type NativeTifInput,
  type PackedReplaceOpInput
} from "./types";

const PACKED_REPLACE_FLAG_BUY = 0x01;
const PACKED_REPLACE_FLAG_ALO = 0x08;

export function normalizeNativeSide(side: NativeSideInput): number {
  if (side === NativeSide.BUY || side === "buy" || side === "BUY") return NativeSide.BUY;
  if (side === NativeSide.SELL || side === "sell" || side === "SELL") return NativeSide.SELL;
  throw new KuruSdkError("INVALID_UINT", `Invalid native side: ${String(side)}.`);
}

export function normalizeNativeTif(tif: NativeTifInput): number {
  if (tif === NativeTif.GTC || tif === "gtc" || tif === "GTC") return NativeTif.GTC;
  if (tif === NativeTif.IOC || tif === "ioc" || tif === "IOC") return NativeTif.IOC;
  if (tif === NativeTif.FOK || tif === "fok" || tif === "FOK") return NativeTif.FOK;
  throw new KuruSdkError("INVALID_UINT", `Invalid native tif: ${String(tif)}.`);
}

export function normalizeNativeExecInstruction(
  executionInstruction: NativeExecInstructionInput | undefined
): number {
  if (
    executionInstruction === undefined ||
    executionInstruction === NativeExecInstruction.NONE ||
    executionInstruction === "none" ||
    executionInstruction === "NONE"
  ) {
    return NativeExecInstruction.NONE;
  }
  if (
    executionInstruction === NativeExecInstruction.POST_ONLY ||
    executionInstruction === "postOnly" ||
    executionInstruction === "POST_ONLY"
  ) {
    return NativeExecInstruction.POST_ONLY;
  }
  throw new KuruSdkError("INVALID_UINT", `Invalid native execution instruction.`);
}

export function normalizeNativeOrder(order: NativeOrderInput): NativeOrder {
  return {
    side: normalizeNativeSide(order.side),
    quantity: assertUint(order.quantity, 96, "quantity"),
    price: assertUint(order.price, 32, "price"),
    tif: normalizeNativeTif(order.tif),
    executionInstruction: normalizeNativeExecInstruction(order.executionInstruction),
    minSizeAfterBlock: assertUint(order.minSizeAfterBlock ?? 0n, 32, "minSizeAfterBlock")
  };
}

export function normalizeNativeOrders(orders: readonly NativeOrderInput[]): NativeOrder[] {
  return orders.map(normalizeNativeOrder);
}

export function encodePackedReplaceOp(op: PackedReplaceOpInput): Hex {
  const slotIdx = assertUintNumber(op.slotIdx, 8, "slotIdx");
  const price = assertUint(op.price ?? 0n, 32, "price");
  const size = assertUint(op.size ?? 0n, 96, "size");
  const minSizeAfterBlock = assertUint(op.minSizeAfterBlock ?? 0n, 32, "minSizeAfterBlock");
  const side = normalizeNativeSide(op.side ?? NativeSide.SELL);

  let flags = side === NativeSide.BUY ? PACKED_REPLACE_FLAG_BUY : 0;
  if (op.postOnly) flags |= PACKED_REPLACE_FLAG_ALO;

  const isCancel = price === 0n && size === 0n;
  if (isCancel && (flags !== 0 || minSizeAfterBlock !== 0n)) {
    throw new KuruSdkError(
      "INVALID_UINT",
      "Packed cancel operations must have zero price, size, flags, and minSizeAfterBlock."
    );
  }

  const word =
    BigInt(slotIdx) |
    (BigInt(flags) << 8n) |
    (price << 16n) |
    (size << 48n) |
    (minSizeAfterBlock << 144n);

  return numberToHex(word, { size: 32 });
}

export function encodePackedReplaceOps(ops: readonly PackedReplaceOpInput[]): Hex {
  if (ops.length === 0) return "0x";
  return concatHex(ops.map(encodePackedReplaceOp));
}

export function encodePackedCancelOp(slotIdx: number): Hex {
  return encodePackedReplaceOp({ slotIdx });
}
