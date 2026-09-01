import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  decodeExchangeWsFrame,
  decodeLifecycleFrame,
  decodeMarketTradesFrame,
  decodeUserBalancesFrame,
  decodeUserOrdersFrame,
  decodeUserTradesFrame
} from "../src/exchange-ws";

const FEED_EPOCH = (1n << 60n) + 7n;
const FIXTURES = [
  ["l2-book-compact.bin", "l2Book"],
  ["l2-book-extended.bin", "l2Book"],
  ["l2-delta.bin", "l2Delta"],
  ["trades.bin", "trades"],
  ["lifecycle-market.bin", "lifecycle"],
  ["lifecycle-user.bin", "lifecycle"],
  ["bbo.bin", "bbo"],
  ["all-mids.bin", "allMids"],
  ["user-orders-snapshot.bin", "userOrders"],
  ["user-orders-delta.bin", "userOrders"],
  ["user-orders-trade.bin", "userOrders"],
  ["user-orders-cancelled.bin", "userOrders"],
  ["user-orders-rab-reduced.bin", "userOrders"],
  ["user-balances-snapshot.bin", "userBalances"],
  ["user-balances-delta.bin", "userBalances"],
  ["user-trades.bin", "userTrades"],
  ["user-trades-passive.bin", "userTrades"]
] as const;

function fixture(name: string): Uint8Array {
  return readFileSync(new URL(`fixtures/exchange-ws-v1/${name}`, import.meta.url));
}

function userOrderEvents(name: string) {
  const frame = decodeUserOrdersFrame(fixture(name));
  if (frame.snapshot) throw new Error(`${name} must be a user-order delta fixture`);
  return frame.events;
}

describe("Exchange WebSocket Rust golden frames", () => {
  it("decodes every authoritative frame kind and variant", () => {
    for (const [name, kind] of FIXTURES) {
      const frame = decodeExchangeWsFrame(fixture(name));
      expect(frame.kind, name).toBe(kind);
      expect(frame.wireVersion, name).toBe(1);
      expect(frame.feedEpoch, name).toBe(FEED_EPOCH);
    }

    const compact = decodeExchangeWsFrame(fixture("l2-book-compact.bin"));
    expect(compact).toMatchObject({
      kind: "l2Book",
      levelFormat: "compact",
      durationMs: 300n,
      grouping: { kind: "none" }
    });

    const extended = decodeExchangeWsFrame(fixture("l2-book-extended.bin"));
    expect(extended).toMatchObject({
      kind: "l2Book",
      levelFormat: "extended",
      durationMs: 500n,
      grouping: { kind: "significantFigures", figures: 5, mantissa: 5 }
    });

    expect(decodeUserOrdersFrame(fixture("user-orders-snapshot.bin")).snapshot).toBe(true);
    expect(decodeUserOrdersFrame(fixture("user-orders-delta.bin")).snapshot).toBe(false);
    expect(decodeUserBalancesFrame(fixture("user-balances-snapshot.bin")).snapshot).toBe(true);
    expect(decodeUserBalancesFrame(fixture("user-balances-delta.bin")).snapshot).toBe(false);
  });

  it("retains the stable market-fill identity emitted by Rust", () => {
    const frame = decodeMarketTradesFrame(fixture("trades.bin"));

    expect(frame.trades).toEqual([
      {
        tradeId: 99n,
        recordIndex: 0,
        takerSide: "buy",
        priceTick: 123n,
        baseFilled: 456n
      },
      {
        tradeId: 99n,
        recordIndex: 1,
        takerSide: "buy",
        priceTick: 124n,
        baseFilled: 457n
      }
    ]);
  });

  it("decodes authoritative user-order snapshots as complete orders", () => {
    const snapshot = decodeUserOrdersFrame(fixture("user-orders-snapshot.bin"));
    expect(snapshot.snapshot).toBe(true);
    if (!snapshot.snapshot) throw new Error("expected a user-order snapshot fixture");
    expect(snapshot.stateHead).toEqual({
      blockNumber: 12n,
      blockId: `0x${"44".repeat(32)}`
    });
    expect(snapshot.orders).toEqual([
      {
        marketAddress: `0x${"11".repeat(20)}`,
        orderId: 11n,
        slotIdx: 2,
        side: "buy",
        priceTick: 42n,
        remainingBase: 43n,
        minSizeAfterBlock: 44n,
        clientOrderId: `0x${"77".repeat(32)}`
      }
    ]);
  });

  it("decodes all four authoritative causal user-order event variants", () => {
    const source = {
      txHash: `0x${"aa".repeat(32)}`,
      txIdx: 2,
      logIdx: 3,
      recordIdx: 4
    };

    expect(userOrderEvents("user-orders-delta.bin")).toEqual([
      {
        kind: "created",
        source,
        makerId: 7n,
        marketAddress: `0x${"11".repeat(20)}`,
        orderId: 11n,
        slotIdx: 2,
        side: "buy",
        priceTick: 42n,
        remainingBase: 43n,
        minSizeAfterBlock: 44n,
        clientOrderId: `0x${"77".repeat(32)}`
      }
    ]);
    expect(userOrderEvents("user-orders-trade.bin")).toEqual([
      {
        kind: "trade",
        source,
        takerId: 8n,
        makerId: 7n,
        marketAddress: `0x${"11".repeat(20)}`,
        orderId: 11n,
        tradeId: 12n,
        slotIdx: 2,
        filledSize: 13n,
        updatedSize: 30n
      }
    ]);
    expect(userOrderEvents("user-orders-cancelled.bin")).toEqual([
      {
        kind: "cancelled",
        source,
        makerId: 7n,
        marketAddress: `0x${"22".repeat(20)}`,
        orderId: 12n,
        slotIdx: 7
      }
    ]);
    expect(userOrderEvents("user-orders-rab-reduced.bin")).toEqual([
      {
        kind: "rab-reduced",
        source,
        makerId: 7n,
        marketAddress: `0x${"11".repeat(20)}`,
        orderId: 11n,
        slotIdx: 2,
        updatedSize: 14n
      }
    ]);
  });

  it("rejects malformed and unknown authoritative user-order event codes", () => {
    for (const code of [0, 5]) {
      const bytes = fixture("user-orders-delta.bin").slice();
      bytes[92] = code;
      expect(() => decodeUserOrdersFrame(bytes)).toThrow(`Unknown user-order event code ${code}.`);
    }

    const truncatedSource = fixture("user-orders-delta.bin").subarray(0, 134);
    expect(() => decodeUserOrdersFrame(truncatedSource)).toThrow();
  });

  it("keeps authoritative user-trade batches scoped to one source record and market", () => {
    const active = decodeUserTradesFrame(fixture("user-trades.bin"));
    expect(active.trades).toEqual([
      {
        marketAddress: `0x${"11".repeat(20)}`,
        tradeId: 1n,
        recordIndex: 2,
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
      }
    ]);

    const passive = decodeUserTradesFrame(fixture("user-trades-passive.bin"));
    expect(passive.trades).toEqual([
      {
        marketAddress: `0x${"22".repeat(20)}`,
        tradeId: 8n,
        recordIndex: 9,
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

  it("represents lifecycle parents according to the bytes Rust actually carries", () => {
    const market = decodeLifecycleFrame(fixture("lifecycle-market.bin"));
    expect(market.event).toEqual({
      action: "branchDropped",
      blockNumber: 12n,
      blockId: `0x${"44".repeat(32)}`,
      parentBlockId: `0x${"55".repeat(32)}`,
      dropReason: "competingBlock",
      replacementBlockId: `0x${"66".repeat(32)}`
    });

    const user = decodeLifecycleFrame(fixture("lifecycle-user.bin"));
    expect(user.event).toEqual({
      action: "blockFinalized",
      blockNumber: 12n,
      blockId: `0x${"44".repeat(32)}`,
      parentBlockId: null,
      dropReason: null,
      replacementBlockId: null
    });
  });
});
