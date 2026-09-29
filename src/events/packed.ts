import { hexToBytes, type Hex } from "viem";

import { KuruSdkError } from "../errors";

export enum OperationOutcome {
  NONE = 0,
  FILLED = 1,
  RESTED = 2,
  COMPLETED_NO_REST = 3,
  IOC_PARTIAL = 4,
  IOC_UNFILLED = 5,
  POST_ONLY_NOT_PLACED = 6,
  CANCELLED = 7,
  PROTOCOL_CANCELLED = 8,
  CANCEL_NOOP = 9,
  DUST_REMAINDER_DISCARDED = 10
}

export interface PackedTrade {
  makerId: bigint;
  slotIdx: number;
  makerFlags: number;
  makerIsBuy: boolean;
  makerIsPassive: boolean;
  isMatchEnd: boolean;
  outcome: OperationOutcome;
  /** Per-call operation index; absent on untagged records (including swaps). */
  operationIndex: number | undefined;
  /** Caller-selected replacement slot; absent for native orders and untagged records. */
  replacementSlot: number | undefined;
  price: bigint;
  fillSize: bigint;
  orderId: bigint;
  updatedSize: bigint;
  makerFeePps: number;
  tradeId: bigint;
}

export interface PackedBookUpdate {
  makerId: bigint;
  slotIdx: number;
  bookFlags: number;
  isLive: boolean;
  outcome: OperationOutcome;
  operationIndex: number | undefined;
  /** An operation receipt with no book mutation. Never apply it to L2/L3. */
  isSentinel: boolean;
  makerIsBuy: boolean;
  price: bigint;
  size: bigint;
  orderId: bigint;
  minSizeAfterBlock: bigint;
  makerFeePps: number;
}

function bytesToBigInt(bytes: Uint8Array, start: number, length: number): bigint {
  let value = 0n;
  for (let i = 0; i < length; i++) {
    value = (value << 8n) | BigInt(bytes[start + i] ?? 0);
  }
  return value;
}

function assertPackedLength(bytes: Uint8Array, recordSize: number, label: string): void {
  if (bytes.length % recordSize !== 0) {
    throw new KuruSdkError(
      "INVALID_BYTES_LENGTH",
      `${label} length must be a multiple of ${recordSize} bytes.`
    );
  }
}

function decodeFirstPackedWord(bytes: Uint8Array, offset: number) {
  const word = bytesToBigInt(bytes, offset, 32);
  const makerFlags = Number((word >> 200n) & 0xffn);
  return {
    makerId: (word >> 216n) & ((1n << 40n) - 1n),
    slotIdx: Number((word >> 208n) & 0xffn),
    makerFlags,
    makerIsBuy: (makerFlags & 1) === 1,
    price: (word >> 168n) & ((1n << 32n) - 1n),
    fillSize: (word >> 72n) & ((1n << 96n) - 1n),
    orderId: (word >> 8n) & ((1n << 64n) - 1n),
    operationIndex: Number(word & 0xffn)
  };
}

function decodeTradeRecord(bytes: Uint8Array, offset: number): PackedTrade {
  const firstWord = decodeFirstPackedWord(bytes, offset);
  const secondWord = bytesToBigInt(bytes, offset + 32, 32);
  const outcome: OperationOutcome = (firstWord.makerFlags >> 3) & 0x1f;
  const replacementSlot = Number((secondWord >> 128n) & 0xffn);
  return {
    ...firstWord,
    outcome,
    operationIndex: outcome === OperationOutcome.NONE ? undefined : firstWord.operationIndex,
    replacementSlot:
      outcome === OperationOutcome.NONE || replacementSlot === 0xff ? undefined : replacementSlot,
    makerIsPassive: (firstWord.makerFlags & 2) !== 0,
    isMatchEnd: (firstWord.makerFlags & 4) !== 0,
    updatedSize: (secondWord >> 160n) & ((1n << 96n) - 1n),
    makerFeePps: Number((secondWord >> 136n) & ((1n << 24n) - 1n)),
    tradeId: secondWord & ((1n << 64n) - 1n)
  };
}

export function decodeTradesPacked(packedTrades: Hex): PackedTrade[] {
  const bytes = hexToBytes(packedTrades);
  assertPackedLength(bytes, 64, "TradesPacked.packedTrades");
  const records: PackedTrade[] = [];
  for (let offset = 0; offset < bytes.length; offset += 64) {
    records.push(decodeTradeRecord(bytes, offset));
  }
  return records;
}

export function decodeBookUpdatesPacked(packedUpdates: Hex): PackedBookUpdate[] {
  const bytes = hexToBytes(packedUpdates);
  assertPackedLength(bytes, 39, "BookUpdatesPacked.packedUpdates");
  const records: PackedBookUpdate[] = [];
  for (let offset = 0; offset < bytes.length; offset += 39) {
    const update = decodeFirstPackedWord(bytes, offset);
    const outcome: OperationOutcome = (update.makerFlags >> 1) & 0x1f;
    const isLive = (update.makerFlags & 0x80) !== 0;
    records.push({
      makerId: update.makerId,
      slotIdx: update.slotIdx,
      bookFlags: update.makerFlags,
      isLive,
      outcome,
      operationIndex: outcome === OperationOutcome.NONE ? undefined : update.operationIndex,
      isSentinel:
        !isLive &&
        outcome !== OperationOutcome.NONE &&
        update.makerId === 0n &&
        update.price === 0n &&
        update.fillSize === 0n &&
        update.orderId === 0n,
      makerIsBuy: update.makerIsBuy,
      price: update.price,
      size: update.fillSize,
      orderId: update.orderId,
      minSizeAfterBlock: bytesToBigInt(bytes, offset + 32, 4),
      makerFeePps: Number(bytesToBigInt(bytes, offset + 36, 3))
    });
  }
  return records;
}
