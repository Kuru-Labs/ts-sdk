import {
  encodeAbiParameters,
  keccak256,
  zeroAddress,
  type Address,
  type Hex,
  type TypedDataDomain
} from "viem";

import { normalizeClientOrderId } from "../utils";
import { normalizeNativeOrders, type NativeOrderInput } from "../spot";
import type {
  BatchIntentTypedDataParams,
  IntentDomainParams,
  IntentHeader,
  IntentHeaderInput,
  ReplaceBySlotIntentTypedDataParams
} from "./types";

const nativeOrderArrayAbiParameter = {
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

const cancelSlotIdxsAbiParameter = { type: "uint8[]" } as const;

export function intentExecutorDomain(
  intentExecutor: Address,
  chainId: number
): TypedDataDomain {
  return {
    name: "KuruIntentExecutor",
    version: "1",
    chainId,
    verifyingContract: intentExecutor
  };
}

export function normalizeIntentHeader(header: IntentHeaderInput): IntentHeader {
  return {
    accountId: header.accountId,
    market: header.market,
    signer: header.signer,
    nonce: header.nonce,
    deadline: header.deadline,
    clientOrderId: normalizeClientOrderId(header.clientOrderId),
    builder: header.builderConfig?.builder ?? zeroAddress,
    builderFeeBps: header.builderConfig?.feeBps ?? 0
  };
}

export function hashPackedOps(packedOps: Hex): Hex {
  return keccak256(packedOps);
}

export function hashNativeOrders(orders: readonly NativeOrderInput[]): Hex {
  return keccak256(
    encodeAbiParameters([nativeOrderArrayAbiParameter], [normalizeNativeOrders(orders) as any])
  );
}

export function hashCancelSlotIdxs(cancelSlotIdxs: readonly number[] = []): Hex {
  return keccak256(encodeAbiParameters([cancelSlotIdxsAbiParameter], [[...cancelSlotIdxs]]));
}

function intentBaseMessage(header: IntentHeader) {
  return {
    accountId: header.accountId,
    market: header.market,
    signer: header.signer,
    nonce: header.nonce,
    deadline: header.deadline,
    clientOrderId: header.clientOrderId,
    builder: header.builder,
    builderFeeBps: header.builderFeeBps
  };
}

export function buildReplaceBySlotIntentTypedData(params: ReplaceBySlotIntentTypedDataParams) {
  const header = normalizeIntentHeader(params.header);
  return {
    domain: intentExecutorDomain(params.intentExecutor, params.chainId),
    primaryType: "ReplaceBySlotIntent",
    types: {
      ReplaceBySlotIntent: [
        { name: "accountId", type: "uint40" },
        { name: "market", type: "address" },
        { name: "signer", type: "address" },
        { name: "nonce", type: "uint64" },
        { name: "deadline", type: "uint64" },
        { name: "clientOrderId", type: "bytes32" },
        { name: "builder", type: "address" },
        { name: "builderFeeBps", type: "uint16" },
        { name: "packedOpsHash", type: "bytes32" }
      ]
    },
    message: {
      ...intentBaseMessage(header),
      packedOpsHash: hashPackedOps(params.packedOps)
    }
  } as const;
}

export function buildBatchIntentTypedData(params: BatchIntentTypedDataParams) {
  const header = normalizeIntentHeader(params.header);
  return {
    domain: intentExecutorDomain(params.intentExecutor, params.chainId),
    primaryType: "BatchIntent",
    types: {
      BatchIntent: [
        { name: "accountId", type: "uint40" },
        { name: "market", type: "address" },
        { name: "signer", type: "address" },
        { name: "nonce", type: "uint64" },
        { name: "deadline", type: "uint64" },
        { name: "clientOrderId", type: "bytes32" },
        { name: "builder", type: "address" },
        { name: "builderFeeBps", type: "uint16" },
        { name: "ordersHash", type: "bytes32" },
        { name: "cancelSlotIdxsHash", type: "bytes32" }
      ]
    },
    message: {
      ...intentBaseMessage(header),
      ordersHash: hashNativeOrders(params.orders),
      cancelSlotIdxsHash: hashCancelSlotIdxs(params.cancelSlotIdxs)
    }
  } as const;
}

export function buildDefaultIntentHeader(
  header: Omit<IntentHeaderInput, "nonce" | "deadline"> & {
    nonce?: bigint;
    deadline: bigint;
  }
): IntentHeaderInput {
  return {
    ...header,
    nonce: header.nonce ?? BigInt(Date.now())
  };
}

export type { IntentDomainParams };
