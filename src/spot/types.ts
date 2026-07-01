import type { Address, Hex } from "viem";

import type { BuilderConfig, ClientOrderOptions, WriteOverrides } from "../types";

export const NativeSide = {
  BUY: 0,
  SELL: 1
} as const;

export const NativeTif = {
  GTC: 0,
  IOC: 1,
  FOK: 2
} as const;

export const NativeExecInstruction = {
  NONE: 0,
  POST_ONLY: 1
} as const;

export type NativeSideName = "buy" | "sell" | "BUY" | "SELL";
export type NativeTifName = "gtc" | "ioc" | "fok" | "GTC" | "IOC" | "FOK";
export type NativeExecInstructionName = "none" | "postOnly" | "NONE" | "POST_ONLY";

export type NativeSideInput = NativeSideName | (typeof NativeSide)[keyof typeof NativeSide];
export type NativeTifInput = NativeTifName | (typeof NativeTif)[keyof typeof NativeTif];
export type NativeExecInstructionInput =
  | NativeExecInstructionName
  | (typeof NativeExecInstruction)[keyof typeof NativeExecInstruction];

export interface NativeOrderInput {
  side: NativeSideInput;
  quantity: bigint;
  price: bigint;
  tif: NativeTifInput;
  executionInstruction?: NativeExecInstructionInput;
  minSizeAfterBlock?: bigint;
}

export interface NativeOrder {
  side: number;
  quantity: bigint;
  price: bigint;
  tif: number;
  executionInstruction: number;
  minSizeAfterBlock: bigint;
}

export interface MarketAddressParam {
  market: Address;
}

export interface UserMarketParams extends MarketAddressParam {
  userId: bigint;
}

export interface BatchParams extends UserMarketParams, ClientOrderOptions, WriteOverrides {
  orders: readonly NativeOrderInput[];
  cancelSlotIdxs?: readonly number[];
  builderConfig?: BuilderConfig;
}

export interface ReplaceBySlotPackedParams
  extends UserMarketParams, ClientOrderOptions, WriteOverrides {
  packedOps: Hex;
  builderConfig?: BuilderConfig;
}

export interface PackedReplaceOpInput {
  slotIdx: number;
  side?: NativeSideInput;
  price?: bigint;
  size?: bigint;
  postOnly?: boolean;
  minSizeAfterBlock?: bigint;
}

export interface SwapParams extends UserMarketParams, WriteOverrides {
  isBuy: boolean;
  amountIn: bigint;
  minAmountOut: bigint;
  deadline: bigint;
  builderConfig?: BuilderConfig;
}

export interface EstimateSwapParams extends MarketAddressParam {
  userId?: bigint;
  isBuy: boolean;
  amountIn: bigint;
  builderFeePps?: number;
}

export interface MintPassiveLiquidityParams
  extends UserMarketParams, ClientOrderOptions, WriteOverrides {
  lowPrice: bigint;
  baseAmount: bigint;
  quoteAmount: bigint;
  minSharesOut?: bigint;
  deadline?: bigint;
}

export interface PassiveMintInput {
  lowPrice: bigint;
  baseAmount: bigint;
  quoteAmount: bigint;
  minSharesOut: bigint;
}

export interface BatchMintPassiveLiquidityParams
  extends UserMarketParams, ClientOrderOptions, WriteOverrides {
  mints: readonly PassiveMintInput[];
  deadline: bigint;
}

export interface BurnPassiveLiquidityParams
  extends UserMarketParams, ClientOrderOptions, WriteOverrides {
  positionId: bigint;
  sharesToBurn: bigint;
}

export interface ClaimPassiveFeesParams
  extends UserMarketParams, ClientOrderOptions, WriteOverrides {
  positionId: bigint;
}
