import { hexToBytes, type Hex } from "viem";

import { KuruSdkError } from "../errors";

export interface PackedTrade {
  makerId: bigint;
  slotIdx: number;
  makerFlags: number;
  makerIsBuy: boolean;
  price: bigint;
  fillSize: bigint;
  orderId: bigint;
}

export interface PackedBookUpdate {
  makerId: bigint;
  slotIdx: number;
  bookFlags: number;
  isLive: boolean;
  makerIsBuy: boolean;
  price: bigint;
  size: bigint;
  orderId: bigint;
  minSizeAfterBlock: bigint;
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

function decodeTradeRecord(bytes: Uint8Array, offset: number): PackedTrade {
  const word = bytesToBigInt(bytes, offset, 32);
  const makerFlags = Number((word >> 200n) & 0xffn);
  return {
    makerId: (word >> 216n) & ((1n << 40n) - 1n),
    slotIdx: Number((word >> 208n) & 0xffn),
    makerFlags,
    makerIsBuy: (makerFlags & 1) === 1,
    price: (word >> 168n) & ((1n << 32n) - 1n),
    fillSize: (word >> 72n) & ((1n << 96n) - 1n),
    orderId: (word >> 8n) & ((1n << 64n) - 1n)
  };
}

export function decodeTradesPacked(packedTrades: Hex): PackedTrade[] {
  const bytes = hexToBytes(packedTrades);
  assertPackedLength(bytes, 32, "TradesPacked.packedTrades");
  const records: PackedTrade[] = [];
  for (let offset = 0; offset < bytes.length; offset += 32) {
    records.push(decodeTradeRecord(bytes, offset));
  }
  return records;
}

export function decodeBookUpdatesPacked(packedUpdates: Hex): PackedBookUpdate[] {
  const bytes = hexToBytes(packedUpdates);
  assertPackedLength(bytes, 36, "BookUpdatesPacked.packedUpdates");
  const records: PackedBookUpdate[] = [];
  for (let offset = 0; offset < bytes.length; offset += 36) {
    const trade = decodeTradeRecord(bytes, offset);
    records.push({
      makerId: trade.makerId,
      slotIdx: trade.slotIdx,
      bookFlags: trade.makerFlags,
      isLive: (trade.makerFlags & 0x80) !== 0,
      makerIsBuy: trade.makerIsBuy,
      price: trade.price,
      size: trade.fillSize,
      orderId: trade.orderId,
      minSizeAfterBlock: bytesToBigInt(bytes, offset + 32, 4)
    });
  }
  return records;
}
