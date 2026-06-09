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
  orderId
}: {
  makerId: bigint;
  slotIdx: bigint;
  makerFlags: bigint;
  price: bigint;
  fillSize: bigint;
  orderId: bigint;
}): Hex {
  const word =
    (makerId << 216n) |
    (slotIdx << 208n) |
    (makerFlags << 200n) |
    (price << 168n) |
    (fillSize << 72n) |
    (orderId << 8n);

  return numberToHex(word, { size: 32 });
}

describe("packed event decoders", () => {
  it("decodes TradesPacked records", () => {
    const packed = tradeRecord({
      makerId: 123n,
      slotIdx: 7n,
      makerFlags: 1n,
      price: 50_000_000n,
      fillSize: 100_000_000n,
      orderId: 42n
    });

    expect(decodeTradesPacked(packed)).toEqual([
      {
        makerId: 123n,
        slotIdx: 7,
        makerFlags: 1,
        makerIsBuy: true,
        price: 50_000_000n,
        fillSize: 100_000_000n,
        orderId: 42n
      }
    ]);
  });

  it("decodes BookUpdatesPacked records", () => {
    const packed = concatHex([
      tradeRecord({
        makerId: 9n,
        slotIdx: 1n,
        makerFlags: 0x80n,
        price: 10n,
        fillSize: 20n,
        orderId: 30n
      }),
      numberToHex(99n, { size: 4 })
    ]);

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
        minSizeAfterBlock: 99n
      }
    ]);
  });

  it("rejects malformed packed byte lengths", () => {
    expect(() => decodeTradesPacked("0x1234")).toThrow(KuruSdkError);
    expect(() => decodeBookUpdatesPacked("0x1234")).toThrow(KuruSdkError);
  });
});
