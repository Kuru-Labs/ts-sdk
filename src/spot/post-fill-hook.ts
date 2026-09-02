import type { Abi } from "viem";

import { assertUint } from "../utils";

type UintInput = bigint | number | string;

export const PostFillHookAction = {
  NOOP: 0,
  REQUOTE_PAIR: 1,
  REPLENISH_ONLY: 2,
  REPLACE_ONLY: 3
} as const;

export type PostFillHookAction = (typeof PostFillHookAction)[keyof typeof PostFillHookAction];

export interface PostFillHookContext {
  userId: bigint;
  filledSlotIdx: number;
  filledOrderId: bigint;
  takerId: bigint;
  fillPrice: number;
  filledSize: bigint;
  remainingBaseSize: bigint;
  bestBid: number;
  bestAsk: number;
  filledOrderIsBuy: boolean;
}

/** ABI for contracts implementing the pinned IPostFillHook interface. */
export const postFillHookAbi = [
  {
    type: "function",
    name: "postFill",
    inputs: [
      {
        name: "ctx",
        type: "tuple",
        internalType: "struct IPostFillHook.PostFillContext",
        components: [
          { name: "userId", type: "uint40", internalType: "uint40" },
          { name: "filledSlotIdx", type: "uint8", internalType: "uint8" },
          { name: "filledOrderId", type: "uint64", internalType: "uint64" },
          { name: "takerId", type: "uint40", internalType: "uint40" },
          { name: "fillPrice", type: "uint32", internalType: "uint32" },
          { name: "filledSize", type: "uint96", internalType: "uint96" },
          { name: "remainingBaseSize", type: "uint96", internalType: "uint96" },
          { name: "bestBid", type: "uint32", internalType: "uint32" },
          { name: "bestAsk", type: "uint32", internalType: "uint32" },
          { name: "filledOrderIsBuy", type: "bool", internalType: "bool" }
        ]
      }
    ],
    outputs: [
      { name: "header", type: "uint256", internalType: "uint256" },
      { name: "replenishWord", type: "uint256", internalType: "uint256" },
      { name: "replacementWord", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "nonpayable"
  }
] as const satisfies Abi;

export function packPostFillNoop(): bigint {
  return BigInt(PostFillHookAction.NOOP);
}

export function packPostFillRequotePair(
  replacementSlotIdx: UintInput,
  replacementExpectedOrderId: UintInput
): bigint {
  return packReplacementHeader(
    PostFillHookAction.REQUOTE_PAIR,
    replacementSlotIdx,
    replacementExpectedOrderId
  );
}

export function packPostFillReplenishOnly(): bigint {
  return BigInt(PostFillHookAction.REPLENISH_ONLY);
}

export function packPostFillReplaceOnly(
  replacementSlotIdx: UintInput,
  replacementExpectedOrderId: UintInput
): bigint {
  return packReplacementHeader(
    PostFillHookAction.REPLACE_ONLY,
    replacementSlotIdx,
    replacementExpectedOrderId
  );
}

export function packPostFillQuote(
  price: UintInput,
  size: UintInput,
  minSizeAfterBlock: UintInput = 0n
): bigint {
  const normalizedPrice = assertUint(price, 32, "price");
  const normalizedSize = assertUint(size, 96, "size");
  const normalizedMinSizeAfterBlock = assertUint(minSizeAfterBlock, 32, "minSizeAfterBlock");
  return normalizedPrice | (normalizedSize << 32n) | (normalizedMinSizeAfterBlock << 128n);
}

function packReplacementHeader(
  action: typeof PostFillHookAction.REQUOTE_PAIR | typeof PostFillHookAction.REPLACE_ONLY,
  replacementSlotIdx: UintInput,
  replacementExpectedOrderId: UintInput
): bigint {
  const slotIdx = assertUint(replacementSlotIdx, 8, "replacementSlotIdx");
  const expectedOrderId = assertUint(replacementExpectedOrderId, 64, "replacementExpectedOrderId");
  return BigInt(action) | (slotIdx << 8n) | (expectedOrderId << 16n);
}
