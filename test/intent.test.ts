import { encodeAbiParameters, keccak256, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

import {
  buildBatchIntentTypedData,
  buildReplaceBySlotIntentTypedData,
  encodePackedCancelOp,
  hashCancelSlotIdxs,
  hashNativeOrders,
  normalizeNativeOrders
} from "../src";

const intentExecutor = "0x0000000000000000000000000000000000000001";
const market = "0x0000000000000000000000000000000000000002";
const signer = "0x0000000000000000000000000000000000000003";

describe("intent typed data", () => {
  it("builds replace intent typed data with packed ops hash", () => {
    const packedOps = encodePackedCancelOp(0);
    const typedData = buildReplaceBySlotIntentTypedData({
      intentExecutor,
      chainId: 31337,
      header: {
        accountId: 1n,
        market,
        signer,
        nonce: 1000n,
        deadline: 2000n
      },
      packedOps
    });

    expect(typedData.domain).toEqual({
      name: "KuruIntentExecutor",
      version: "1",
      chainId: 31337,
      verifyingContract: intentExecutor
    });
    expect(typedData.message.builder).toBe(zeroAddress);
    expect(typedData.message.builderFeeBps).toBe(0);
    expect(typedData.message.packedOpsHash).toBe(keccak256(packedOps));
  });

  it("hashes batch intent arrays like abi.encode", () => {
    const orders = [
      {
        side: "sell",
        quantity: 2n,
        price: 3n,
        tif: "ioc",
        executionInstruction: "none"
      }
    ] as const;
    const normalized = normalizeNativeOrders(orders);

    expect(hashNativeOrders(orders)).toBe(
      keccak256(
        encodeAbiParameters(
          [
            {
              type: "tuple[]",
              components: [
                { name: "side", type: "uint8" },
                { name: "quantity", type: "uint96" },
                { name: "price", type: "uint32" },
                { name: "tif", type: "uint8" },
                { name: "executionInstruction", type: "uint8" },
                { name: "minSizeAfterBlock", type: "uint32" }
              ]
            }
          ],
          [normalized as any]
        )
      )
    );
    expect(hashCancelSlotIdxs([1, 2])).toBe(
      keccak256(encodeAbiParameters([{ type: "uint8[]" }], [[1, 2]]))
    );

    const typedData = buildBatchIntentTypedData({
      intentExecutor,
      chainId: 31337,
      header: {
        accountId: 1n,
        market,
        signer,
        nonce: 1000n,
        deadline: 2000n
      },
      orders,
      cancelSlotIdxs: [1, 2]
    });

    expect(typedData.primaryType).toBe("BatchIntent");
    expect(typedData.message.ordersHash).toBe(hashNativeOrders(orders));
    expect(typedData.message.cancelSlotIdxsHash).toBe(hashCancelSlotIdxs([1, 2]));
  });
});
