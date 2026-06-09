import { encodeFunctionData, numberToHex } from "viem";
import { describe, expect, it } from "vitest";

import { KuruSdkError } from "../src/errors";
import {
  NativeExecInstruction,
  NativeSide,
  NativeTif,
  buildBatchRequest,
  buildReplaceBySlotPackedRequest,
  encodePackedCancelOp,
  encodePackedReplaceOp,
  encodePackedReplaceOps,
  normalizeNativeOrder
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
});
