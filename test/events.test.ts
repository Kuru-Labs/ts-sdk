import { concatHex, numberToHex, type Hex } from "viem";
import { describe, expect, it } from "vitest";

import { KuruSdkError } from "../src/errors";
import { decodeBookUpdatesPacked, decodeTradesPacked } from "../src/events";

function tradeRecord({
  makerId,
  slotIdx,
  makerFlags,
  price,
  fillSize,
  orderId,
  updatedSize = 0n,
  makerFeePps = 0n,
  tradeId = 0n
}: {
  makerId: bigint;
  slotIdx: bigint;
  makerFlags: bigint;
  price: bigint;
  fillSize: bigint;
  orderId: bigint;
  updatedSize?: bigint;
  makerFeePps?: bigint;
  tradeId?: bigint;
}): Hex {
  const word0 =
    (makerId << 216n) |
    (slotIdx << 208n) |
    (makerFlags << 200n) |
    (price << 168n) |
    (fillSize << 72n) |
    (orderId << 8n);
  const word1 = (updatedSize << 160n) | (makerFeePps << 136n) | tradeId;

  return concatHex([numberToHex(word0, { size: 32 }), numberToHex(word1, { size: 32 })]);
}

function bookRecord({
  makerId,
  slotIdx,
  bookFlags,
  price,
  size,
  orderId,
  minSizeAfterBlock,
  makerFeePps
}: {
  makerId: bigint;
  slotIdx: bigint;
  bookFlags: bigint;
  price: bigint;
  size: bigint;
  orderId: bigint;
  minSizeAfterBlock: bigint;
  makerFeePps: bigint;
}): Hex {
  const word0 =
    (makerId << 216n) |
    (slotIdx << 208n) |
    (bookFlags << 200n) |
    (price << 168n) |
    (size << 72n) |
    (orderId << 8n);

  return concatHex([
    numberToHex(word0, { size: 32 }),
    numberToHex(minSizeAfterBlock, { size: 4 }),
    numberToHex(makerFeePps, { size: 3 })
  ]);
}

describe("packed event decoders", () => {
  it("decodes TradesPacked records", () => {
    const packed = tradeRecord({
      makerId: 123n,
      slotIdx: 7n,
      makerFlags: 1n,
      price: 50_000_000n,
      fillSize: 100_000_000n,
      orderId: 42n,
      updatedSize: 75_000_000n,
      makerFeePps: 300n,
      tradeId: 555n
    });

    expect(decodeTradesPacked(packed)).toEqual([
      {
        makerId: 123n,
        slotIdx: 7,
        makerFlags: 1,
        makerIsBuy: true,
        makerIsPassive: false,
        isMatchEnd: false,
        price: 50_000_000n,
        fillSize: 100_000_000n,
        orderId: 42n,
        updatedSize: 75_000_000n,
        makerFeePps: 300,
        tradeId: 555n
      }
    ]);
  });

  it("decodes BookUpdatesPacked records", () => {
    const packed = bookRecord({
      makerId: 9n,
      slotIdx: 1n,
      bookFlags: 0x80n,
      price: 10n,
      size: 20n,
      orderId: 30n,
      minSizeAfterBlock: 99n,
      makerFeePps: 250n
    });

    expect(decodeBookUpdatesPacked(packed)).toEqual([
      {
        makerId: 9n,
        slotIdx: 1,
        bookFlags: 0x80,
        isLive: true,
        makerIsBuy: false,
        price: 10n,
        size: 20n,
        orderId: 30n,
        minSizeAfterBlock: 99n,
        makerFeePps: 250
      }
    ]);
  });

  it("rejects malformed packed byte lengths", () => {
    expect(() => decodeTradesPacked("0x1234")).toThrow(KuruSdkError);
    expect(() => decodeBookUpdatesPacked("0x1234")).toThrow(KuruSdkError);
  });
});
