import { describe, expect, it } from "vitest";

import { KuruSdkError } from "../src/errors";
import {
  decodeBboFrame,
  decodeExchangeWsFrame,
  decodeExchangeWsMessage,
  decodeL2BookFrame,
  decodeMarketTradesFrame,
  decodeUserBalancesFrame,
  decodeUserOrdersFrame,
  decodeUserTradesFrame
} from "../src/exchange-ws";

const MARKET_A = `0x${"11".repeat(20)}`;
const MARKET_B = `0x${"22".repeat(20)}`;
const TOKEN = `0x${"33".repeat(20)}`;
const BLOCK = `0x${"44".repeat(32)}`;
const PARENT = `0x${"55".repeat(32)}`;
const REPLACEMENT = `0x${"66".repeat(32)}`;
const CLIENT_ORDER_ID = `0x${"77".repeat(32)}`;
const TX_HASH = `0x${"aa".repeat(32)}`;
const FEED_EPOCH = (1n << 60n) + 7n;

class FixtureWriter {
  readonly bytes: number[] = [];

  u8(value: number): this {
    this.bytes.push(value);
    return this;
  }

  u16(value: number): this {
    return this.unsigned(BigInt(value), 2);
  }

  u32(value: number): this {
    return this.unsigned(BigInt(value), 4);
  }

  u64(value: bigint): this {
    return this.unsigned(value, 8);
  }

  i64(value: bigint): this {
    return this.signed(value, 8);
  }

  u128(value: bigint): this {
    return this.unsigned(value, 16);
  }

  i128(value: bigint): this {
    return this.signed(value, 16);
  }

  hex(value: string): this {
    for (let index = 2; index < value.length; index += 2) {
      this.bytes.push(Number.parseInt(value.slice(index, index + 2), 16));
    }
    return this;
  }

  zeros(length: number): this {
    for (let index = 0; index < length; index++) this.bytes.push(0);
    return this;
  }

  finish(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }

  private signed(value: bigint, width: number): this {
    const bits = BigInt(width * 8);
    return this.unsigned(value < 0n ? (1n << bits) + value : value, width);
  }

  private unsigned(value: bigint, width: number): this {
    for (let shift = width - 1; shift >= 0; shift--) {
      this.bytes.push(Number((value >> BigInt(shift * 8)) & 0xffn));
    }
    return this;
  }
}

function frame(
  kind: number,
  view: number,
  flags: number,
  payload: (writer: FixtureWriter) => void
) {
  const writer = new FixtureWriter()
    .hex("0x4b584d44")
    .u8(1)
    .u8(kind)
    .u8(view)
    .u8(flags)
    .u64(FEED_EPOCH);
  payload(writer);
  return writer.finish();
}

function marketContext(writer: FixtureWriter) {
  writer.hex(MARKET_A).u64(9n).u64(10n);
}

function blockContext(writer: FixtureWriter) {
  writer.u64(12n).hex(BLOCK);
}

function userContext(writer: FixtureWriter) {
  writer.u64(7n).u64(8n).u64(10n).u64(6n);
}

function userOrderSource(writer: FixtureWriter) {
  writer.hex(TX_HASH).u32(2).u32(3).u16(4);
}

function lifecycleBody(
  writer: FixtureWriter,
  action: number,
  drop = false,
  parentOverride?: string
) {
  const parent = parentOverride ?? (action === 2 || action === 3 ? `0x${"00".repeat(32)}` : PARENT);
  writer
    .u8(action)
    .zeros(3)
    .u64(12n)
    .hex(BLOCK)
    .hex(parent)
    .u8(drop ? 1 : 0)
    .u8(drop ? 1 : 0)
    .zeros(2)
    .hex(drop ? REPLACEMENT : `0x${"00".repeat(32)}`);
}

describe("Exchange WebSocket binary decoder", () => {
  it("decodes compact and extended L2 book frames with signed x18 prices", () => {
    const compact = frame(1, 3, 1, (writer) => {
      marketContext(writer);
      blockContext(writer);
      writer
        .u64(300n)
        .u32(50)
        .u8(0)
        .u64(0n)
        .u8(0)
        .u8(0)
        .u16(0)
        .u32(1)
        .u32(1)
        .i128(-5n)
        .u128((1n << 100n) + 7n)
        .i128(6n)
        .u128(8n);
    });

    expect(decodeL2BookFrame(compact)).toEqual({
      wireVersion: 1,
      feedEpoch: FEED_EPOCH,
      kind: "l2Book",
      view: "finalized",
      marketAddress: MARKET_A,
      marketSeq: 9n,
      globalSeq: 10n,
      stateHead: { blockNumber: 12n, blockId: BLOCK },
      durationMs: 300n,
      maxDepthPerSide: 50,
      grouping: { kind: "none" },
      levelFormat: "compact",
      bids: [{ priceX18: -5n, totalBaseX18: (1n << 100n) + 7n }],
      asks: [{ priceX18: 6n, totalBaseX18: 8n }]
    });

    const extended = frame(1, 1, 2, (writer) => {
      marketContext(writer);
      blockContext(writer);
      writer
        .u64(500n)
        .u32(20)
        .u8(2)
        .u64(0n)
        .u8(4)
        .u8(5)
        .u16(0)
        .u32(1)
        .u32(0)
        .i128(100n)
        .u128(40n)
        .u128(30n)
        .u128(10n)
        .u32(3);
    });
    const decoded = decodeL2BookFrame(extended);
    expect(decoded.levelFormat).toBe("extended");
    if (decoded.levelFormat === "extended") {
      expect(decoded.grouping).toEqual({
        kind: "significantFigures",
        figures: 4,
        mantissa: 5
      });
      expect(decoded.bids[0]).toEqual({
        priceX18: 100n,
        totalBaseX18: 40n,
        activeBaseX18: 30n,
        passiveBaseX18: 10n,
        activeOrderCount: 3
      });
    }
  });

  it("decodes L2 deltas, market trades, BBO, and all mids", () => {
    const delta = frame(2, 1, 0, (writer) => {
      marketContext(writer);
      blockContext(writer);
      writer.u32(1).u8(2).i64(-10n).u128(0n).u128(2n).u128(3n).u32(4);
    });
    expect(decodeExchangeWsFrame(delta)).toMatchObject({
      kind: "l2Delta",
      view: "proposed",
      sourceBlock: { blockNumber: 12n, blockId: BLOCK },
      updates: [
        {
          side: "sell",
          priceTick: -10n,
          totalBaseAfter: 0n,
          activeBaseAfter: 2n,
          passiveBaseAfter: 3n,
          activeOrderCountAfter: 4
        }
      ]
    });

    const trades = frame(3, 2, 0, (writer) => {
      marketContext(writer);
      blockContext(writer);
      writer.u32(1).u64(99n).u16(7).u8(1).i64(123n).u128(456n);
    });
    expect(decodeMarketTradesFrame(trades).trades).toEqual([
      { tradeId: 99n, recordIndex: 7, takerSide: "buy", priceTick: 123n, baseFilled: 456n }
    ]);

    const bbo = frame(5, 3, 0, (writer) => {
      marketContext(writer);
      blockContext(writer);
      writer.u8(1).i128(100n).u128(20n).u8(0).i128(0n).u128(0n);
    });
    expect(decodeBboFrame(bbo)).toMatchObject({
      bid: { priceX18: 100n, totalBaseX18: 20n },
      ask: null
    });

    const mids = frame(6, 3, 0, (writer) => {
      writer.u32(2).hex(MARKET_A).i128(-1n).hex(MARKET_B).i128(2n);
    });
    expect(decodeExchangeWsFrame(mids)).toMatchObject({
      kind: "allMids",
      mids: [
        { marketAddress: MARKET_A, midpointX18: -1n },
        { marketAddress: MARKET_B, midpointX18: 2n }
      ]
    });
  });

  it("decodes user-order snapshots and causal deltas without losing identity", () => {
    const snapshot = frame(7, 3, 1, (writer) => {
      writer.u64(7n).u64(0n).u64(0n).u64(0n).u8(0).u64(0n).zeros(32).u32(1);
      writer
        .hex(MARKET_A)
        .u64(11n)
        .u8(2)
        .u8(1)
        .i64(42n)
        .u128(43n)
        .u8(1)
        .u64(44n)
        .u8(1)
        .hex(CLIENT_ORDER_ID)
        .u32(0);
    });
    expect(decodeUserOrdersFrame(snapshot)).toEqual({
      wireVersion: 1,
      feedEpoch: FEED_EPOCH,
      kind: "userOrders",
      view: "finalized",
      userId: 7n,
      globalUserSeq: null,
      globalSeq: null,
      previousGlobalUserSeq: null,
      snapshot: true,
      stateHead: null,
      orders: [
        {
          marketAddress: MARKET_A,
          orderId: 11n,
          slotIdx: 2,
          side: "buy",
          priceTick: 42n,
          remainingBase: 43n,
          minSizeAfterBlock: 44n,
          clientOrderId: CLIENT_ORDER_ID
        }
      ]
    });

    const delta = frame(7, 1, 0, (writer) => {
      userContext(writer);
      blockContext(writer);
      writer.u32(1).u8(3);
      userOrderSource(writer);
      writer.u64(7n).hex(MARKET_B).u64(12n).u8(7);
    });
    expect(decodeUserOrdersFrame(delta)).toEqual({
      wireVersion: 1,
      feedEpoch: FEED_EPOCH,
      kind: "userOrders",
      view: "proposed",
      userId: 7n,
      globalUserSeq: 8n,
      globalSeq: 10n,
      previousGlobalUserSeq: 6n,
      snapshot: false,
      sourceBlock: { blockNumber: 12n, blockId: BLOCK },
      events: [
        {
          kind: "cancelled",
          source: {
            txHash: TX_HASH,
            txIdx: 2,
            logIdx: 3,
            recordIdx: 4
          },
          makerId: 7n,
          marketAddress: MARKET_B,
          orderId: 12n,
          slotIdx: 7
        }
      ]
    });
  });

  it("rejects unknown and truncated user-order event tuples", () => {
    const unknown = frame(7, 3, 0, (writer) => {
      userContext(writer);
      blockContext(writer);
      writer.u32(1).u8(5);
      userOrderSource(writer);
      writer.u64(7n).hex(MARKET_A).u64(11n).u8(2);
    });
    expect(() => decodeUserOrdersFrame(unknown)).toThrow(/Unknown user-order event code 5/);

    const truncated = frame(7, 3, 0, (writer) => {
      userContext(writer);
      blockContext(writer);
      writer.u32(1).u8(2);
      userOrderSource(writer);
      writer.u64(7n).u64(8n).hex(MARKET_A).u8(0);
    });
    expect(() => decodeUserOrdersFrame(truncated)).toThrow(/truncated/);
  });

  it("decodes user balances from left-padded token addresses", () => {
    const balances = frame(8, 2, 0, (writer) => {
      userContext(writer);
      blockContext(writer);
      writer.u32(1).zeros(12).hex(TOKEN).u128(123n).u128(456n);
    });
    expect(decodeUserBalancesFrame(balances)).toMatchObject({
      snapshot: false,
      balances: [{ tokenAddress: TOKEN, freeBalance: 123n, reservedBalance: 456n }]
    });
  });

  it("decodes active and passive user-trade liquidity variants", () => {
    const trades = frame(9, 3, 0, (writer) => {
      userContext(writer);
      blockContext(writer);
      writer
        .u32(2)
        .hex(MARKET_A)
        .u64(1n)
        .u16(2)
        .u64(7n)
        .u64(8n)
        .u8(1)
        .i64(3n)
        .u128(4n)
        .u8(1)
        .u8(5)
        .u64(6n)
        .u8(2)
        .u128(7n)
        .hex(MARKET_B)
        .u64(8n)
        .u16(9)
        .u64(7n)
        .u64(0n)
        .u8(2)
        .i64(10n)
        .u128(11n)
        .u8(2)
        .i64(-12n)
        .u128(13n);
    });

    expect(decodeUserTradesFrame(trades).trades).toEqual([
      {
        marketAddress: MARKET_A,
        tradeId: 1n,
        recordIndex: 2,
        users: [7n, 8n],
        takerSide: "buy",
        priceTick: 3n,
        baseFilled: 4n,
        liquidity: {
          kind: "activeFifo",
          slotIndex: 5,
          orderId: 6n,
          makerSide: "sell",
          remainingBaseAfter: 7n
        }
      },
      {
        marketAddress: MARKET_B,
        tradeId: 8n,
        recordIndex: 9,
        users: [7n, 0n],
        takerSide: "sell",
        priceTick: 10n,
        baseFilled: 11n,
        liquidity: {
          kind: "passiveBand",
          lowPriceTick: -12n,
          passiveSideRemainingAfter: 13n
        }
      }
    ]);
  });

  it("distinguishes market and user lifecycle prefixes", () => {
    const marketLifecycle = frame(4, 2, 0, (writer) => {
      marketContext(writer);
      lifecycleBody(writer, 5, true);
    });
    expect(decodeExchangeWsFrame(marketLifecycle)).toMatchObject({
      kind: "lifecycle",
      scope: "market",
      event: {
        action: "branchDropped",
        dropReason: "competingBlock",
        replacementBlockId: REPLACEMENT
      }
    });

    const userLifecycle = frame(4, 3, 0, (writer) => {
      userContext(writer);
      lifecycleBody(writer, 3);
    });
    expect(decodeExchangeWsFrame(userLifecycle)).toMatchObject({
      kind: "lifecycle",
      scope: "user",
      userId: 7n,
      event: {
        action: "blockFinalized",
        parentBlockId: null,
        dropReason: null,
        replacementBlockId: null
      }
    });
  });

  it("accepts offset views and asynchronous Blob-like inputs", async () => {
    const payload = frame(6, 3, 0, (writer) => writer.u32(0));
    const wrapped = new Uint8Array(payload.length + 4);
    wrapped.set(payload, 2);
    const view = new Uint8Array(wrapped.buffer, 2, payload.length);
    expect(decodeExchangeWsFrame(view)).toMatchObject({ kind: "allMids", mids: [] });

    await expect(
      decodeExchangeWsMessage({
        arrayBuffer() {
          return Promise.resolve(
            payload.buffer.slice(
              payload.byteOffset,
              payload.byteOffset + payload.byteLength
            ) as ArrayBuffer
          );
        }
      })
    ).resolves.toMatchObject({ kind: "allMids" });
  });

  it("fails closed on malformed headers, fields, counts, and trailing data", () => {
    const valid = frame(6, 3, 0, (writer) => writer.u32(0));
    const invalidMagic = valid.slice();
    invalidMagic[0] = 0;
    expect(() => decodeExchangeWsFrame(invalidMagic)).toThrow(KuruSdkError);

    const unsupported = valid.slice();
    unsupported[4] = 2;
    try {
      decodeExchangeWsFrame(unsupported);
      throw new Error("expected unsupported version");
    } catch (error) {
      expect(error).toMatchObject({ code: "UNSUPPORTED_EXCHANGE_WS_VERSION" });
    }

    expect(() => decodeExchangeWsFrame(valid.subarray(0, valid.length - 1))).toThrow(/truncated/);

    const invalidCount = frame(6, 3, 0, (writer) => writer.u32(1));
    expect(() => decodeExchangeWsFrame(invalidCount)).toThrow(/count exceeds/);

    const trailing = Uint8Array.from([...valid, 1]);
    expect(() => decodeExchangeWsFrame(trailing)).toThrow(/trailing bytes/);

    expect(() => decodeBboFrame(valid)).toThrow(/Expected an bbo frame/);

    const invalidPadding = frame(8, 3, 0, (writer) => {
      userContext(writer);
      blockContext(writer);
      writer.u32(1).u8(1).zeros(11).hex(TOKEN).u128(1n).u128(2n);
    });
    expect(() => decodeExchangeWsFrame(invalidPadding)).toThrow(/left padding/);
  });

  it("rejects nonzero parents for voted and finalized lifecycle events", () => {
    for (const action of [2, 3]) {
      const invalidLifecycleParent = frame(4, 3, 0, (writer) => {
        userContext(writer);
        lifecycleBody(writer, action, false, PARENT);
      });
      expect(() => decodeExchangeWsFrame(invalidLifecycleParent)).toThrow(
        /must have a zero-filled parent block ID/
      );
    }
  });
});
