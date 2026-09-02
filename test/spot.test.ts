import { encodeFunctionData, numberToHex } from "viem";
import { describe, expect, it } from "vitest";

import { KuruSdkError } from "../src/errors";
import {
  NativeExecInstruction,
  NativeSide,
  NativeTif,
  buildBatchRequest,
  buildBatchMintPassiveLiquidityRequest,
  buildBurnPassiveLiquidityRequest,
  buildClaimPassiveFeesRequest,
  buildMintPassiveLiquidityRequest,
  buildReplaceBySlotPackedRequest,
  buildSetPostFillHookGasLimitRequest,
  buildSetPostFillHookMinQuoteNotionalRequest,
  buildSetPostFillHookRequest,
  encodePackedCancelOp,
  encodePackedReplaceOp,
  encodePackedReplaceOps,
  normalizeNativeOrder,
  packPostFillNoop,
  packPostFillQuote,
  packPostFillReplenishOnly,
  packPostFillReplaceOnly,
  packPostFillRequotePair,
  postFillHookAbi
} from "../src/spot";

describe("spot order helpers", () => {
  it("normalizes native order inputs", () => {
    expect(
      normalizeNativeOrder({
        side: "buy",
        quantity: 100n,
        price: 50n,
        tif: "gtc",
        executionInstruction: "postOnly"
      })
    ).toEqual({
      side: NativeSide.BUY,
      quantity: 100n,
      price: 50n,
      tif: NativeTif.GTC,
      executionInstruction: NativeExecInstruction.POST_ONLY,
      minSizeAfterBlock: 0n
    });
  });

  it("encodes packed replacement ops using the contract bit layout", () => {
    const slotIdx = 2n;
    const flags = 1n | 8n;
    const price = 50_000_000n;
    const size = 100_000_000n;
    const minSizeAfterBlock = 123n;
    const expected =
      slotIdx | (flags << 8n) | (price << 16n) | (size << 48n) | (minSizeAfterBlock << 144n);

    expect(
      encodePackedReplaceOp({
        slotIdx: Number(slotIdx),
        side: "buy",
        price,
        size,
        postOnly: true,
        minSizeAfterBlock
      })
    ).toBe(numberToHex(expected, { size: 32 }));
  });

  it("encodes packed cancels and concatenates multiple ops", () => {
    expect(encodePackedCancelOp(3)).toBe(numberToHex(3n, { size: 32 }));
    expect(encodePackedReplaceOps([{ slotIdx: 0 }, { slotIdx: 1 }])).toBe(
      `${numberToHex(0n, { size: 32 })}${numberToHex(1n, { size: 32 }).slice(2)}`
    );
  });

  it("rejects non-strict packed cancel flags", () => {
    expect(() =>
      encodePackedReplaceOp({
        slotIdx: 0,
        side: "buy",
        price: 0n,
        size: 0n
      })
    ).toThrow(KuruSdkError);
  });

  it("uses fully qualified signatures for overloaded write helpers", () => {
    const market = "0x0000000000000000000000000000000000000001";
    const clientOrderId = `0x${"11".repeat(32)}` as const;

    const batch = buildBatchRequest({
      market,
      userId: 4n,
      orders: [
        {
          side: "buy",
          quantity: 100n,
          price: 50n,
          tif: "gtc",
          executionInstruction: "postOnly"
        }
      ],
      cancelSlotIdxs: [0],
      clientOrderId
    });

    expect(batch.functionName).toBe("batch");
    expect(batch.abi).toHaveLength(1);
    const batchFragment = batch.abi[0] as {
      type: string;
      inputs: readonly { type: string }[];
    };
    expect(batchFragment.type).toBe("function");
    expect(batchFragment.inputs.map((input) => input.type)).toEqual([
      "uint40",
      "tuple[]",
      "uint8[]",
      "bytes32"
    ]);
    expect(() => encodeFunctionData(batch as any)).not.toThrow();

    const replace = buildReplaceBySlotPackedRequest({
      market,
      userId: 4n,
      packedOps: encodePackedReplaceOps([
        { slotIdx: 0, side: "sell", price: 51n, size: 100n, postOnly: true }
      ]),
      clientOrderId
    });

    expect(replace.functionName).toBe("replaceBySlotPacked");
    expect(replace.abi).toHaveLength(1);
    const replaceFragment = replace.abi[0] as {
      type: string;
      inputs: readonly { type: string }[];
    };
    expect(replaceFragment.type).toBe("function");
    expect(replaceFragment.inputs.map((input) => input.type)).toEqual([
      "uint40",
      "bytes",
      "bytes32"
    ]);
    expect(() => encodeFunctionData(replace as any)).not.toThrow();
  });

  it("builds latest passive liquidity calldata", () => {
    const market = "0x0000000000000000000000000000000000000001";

    const mint = buildMintPassiveLiquidityRequest({
      market,
      userId: 4n,
      lowPrice: 10n,
      baseAmount: 100n,
      quoteAmount: 1_000n
    });
    expect(mint.args).toHaveLength(4);
    expect(() => encodeFunctionData(mint as any)).not.toThrow();

    const mintWithSlippage = buildMintPassiveLiquidityRequest({
      market,
      userId: 4n,
      lowPrice: 10n,
      baseAmount: 100n,
      quoteAmount: 1_000n,
      minSharesOut: 90n,
      deadline: 123n
    });
    expect(mintWithSlippage.args).toHaveLength(6);
    expect(() => encodeFunctionData(mintWithSlippage as any)).not.toThrow();

    const batchMint = buildBatchMintPassiveLiquidityRequest({
      market,
      userId: 4n,
      mints: [{ lowPrice: 10n, baseAmount: 100n, quoteAmount: 1_000n, minSharesOut: 90n }],
      deadline: 123n
    });
    expect(batchMint.args).toHaveLength(3);
    expect(() => encodeFunctionData(batchMint as any)).not.toThrow();

    const burn = buildBurnPassiveLiquidityRequest({
      market,
      userId: 4n,
      positionId: 1n,
      sharesToBurn: 50n
    });
    expect(burn.args).toHaveLength(3);
    expect(() => encodeFunctionData(burn as any)).not.toThrow();

    const claim = buildClaimPassiveFeesRequest({
      market,
      userId: 4n,
      positionId: 1n
    });
    expect(claim.args).toHaveLength(2);
    expect(() => encodeFunctionData(claim as any)).not.toThrow();
  });

  it("builds maker and governance post-fill-hook calldata", () => {
    const market = "0x0000000000000000000000000000000000000001";
    const hook = "0x0000000000000000000000000000000000000002";
    const requests = [
      buildSetPostFillHookRequest({ market, userId: 4n, hook }),
      buildSetPostFillHookGasLimitRequest({ market, gasLimit: 500_000n }),
      buildSetPostFillHookMinQuoteNotionalRequest({ market, minQuoteNotional: 60_000_000n })
    ];

    expect(requests.map((request) => request.args)).toEqual([
      [4n, hook],
      [500_000n],
      [60_000_000n]
    ]);
    for (const request of requests) {
      expect(() => encodeFunctionData(request as any)).not.toThrow();
    }
  });

  it("matches the Solidity post-fill-hook codec layout", () => {
    const slotIdx = 7n;
    const orderId = 42n;
    const price = 50_000n;
    const size = 3_000_000n;
    const minSizeAfterBlock = 123n;

    expect(packPostFillNoop()).toBe(0n);
    expect(packPostFillReplenishOnly()).toBe(2n);
    expect(packPostFillRequotePair(slotIdx, orderId)).toBe(1n | (slotIdx << 8n) | (orderId << 16n));
    expect(packPostFillReplaceOnly(slotIdx, orderId)).toBe(3n | (slotIdx << 8n) | (orderId << 16n));
    expect(packPostFillQuote(price, size, minSizeAfterBlock)).toBe(
      price | (size << 32n) | (minSizeAfterBlock << 128n)
    );
  });

  it("rejects post-fill-hook codec values outside contract widths", () => {
    expect(() => packPostFillRequotePair(256, 1n)).toThrow(KuruSdkError);
    expect(() => packPostFillReplaceOnly(0, 1n << 64n)).toThrow(KuruSdkError);
    expect(() => packPostFillQuote(1n << 32n, 1n)).toThrow(KuruSdkError);
    expect(() => packPostFillQuote(1n, 1n << 96n)).toThrow(KuruSdkError);
    expect(() => packPostFillQuote(1n, 1n, 1n << 32n)).toThrow(KuruSdkError);
  });

  it("exports the pinned IPostFillHook call ABI", () => {
    expect(() =>
      encodeFunctionData({
        abi: postFillHookAbi,
        functionName: "postFill",
        args: [
          {
            userId: 4,
            filledSlotIdx: 0,
            filledOrderId: 9n,
            takerId: 5,
            fillPrice: 50_000,
            filledSize: 1_000_000n,
            remainingBaseSize: 2_000_000n,
            bestBid: 49_900,
            bestAsk: 50_100,
            filledOrderIsBuy: true
          }
        ]
      })
    ).not.toThrow();
  });
});
