import { encodeAbiParameters, isHex, keccak256, size, type Hex } from "viem";

import { KuruSdkError } from "../errors";
import type { NativeOrder } from "../spot";
import { assertUint, assertUintNumber } from "../utils";
import type { WalletUintInput } from "./types";
import {
  MAX_PACKED_OPERATIONS_BYTES,
  assertArraySize,
  normalizeAndValidateOrders,
  normalizeExpectedOrderIds
} from "./validation";

const nativeOrdersParameter = {
  type: "tuple[]",
  components: [
    { name: "side", type: "uint8" },
    { name: "quantity", type: "uint96" },
    { name: "price", type: "uint32" },
    { name: "tif", type: "uint8" },
    { name: "executionInstruction", type: "uint8" },
    { name: "minSizeAfterBlock", type: "uint32" }
  ]
} as const;

export function hashPackedOperations(packedOps: Hex): Hex {
  if (!isHex(packedOps, { strict: true })) {
    throw new KuruSdkError("INVALID_HEX", "packedOps must be strict hexadecimal bytes.");
  }
  if (size(packedOps) > MAX_PACKED_OPERATIONS_BYTES) {
    throw new KuruSdkError("INVALID_BYTES_LENGTH", "packedOps exceeds 64 KiB.");
  }
  return keccak256(packedOps);
}

export function hashExpectedOrderIds(values: readonly WalletUintInput[]): Hex {
  const normalized = normalizeExpectedOrderIds(values);
  return keccak256(encodeAbiParameters([{ type: "uint64[]" }], [normalized]));
}

export function hashCancelSlotIndexes(values: readonly WalletUintInput[]): Hex {
  assertArraySize(values.length, "cancelSlotIdxs");
  const normalized = values.map((value, index) =>
    assertUintNumber(value, 8, `cancelSlotIdxs[${index}]`)
  );
  return keccak256(encodeAbiParameters([{ type: "uint8[]" }], [normalized]));
}

export function hashNativeOrders(values: readonly NativeOrder[]): Hex {
  assertArraySize(values.length, "orders");
  return keccak256(
    encodeAbiParameters(
      [nativeOrdersParameter],
      [
        values.map((order) => ({
          side: assertUintNumber(order.side, 8, "orders.side"),
          quantity: assertUint(order.quantity, 96, "orders.quantity"),
          price: assertUintNumber(order.price, 32, "orders.price"),
          tif: assertUintNumber(order.tif, 8, "orders.tif"),
          executionInstruction: assertUintNumber(
            order.executionInstruction,
            8,
            "orders.executionInstruction"
          ),
          minSizeAfterBlock: assertUintNumber(
            order.minSizeAfterBlock,
            32,
            "orders.minSizeAfterBlock"
          )
        }))
      ]
    )
  );
}

export function normalizeAndHashNativeOrders(
  values: Parameters<typeof normalizeAndValidateOrders>[0]
): {
  orders: readonly NativeOrder[];
  hash: Hex;
} {
  const orders = normalizeAndValidateOrders(values);
  return { orders, hash: hashNativeOrders(orders) };
}
