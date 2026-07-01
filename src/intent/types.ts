import type { Address, Hex } from "viem";

import type { BuilderConfig, WriteOverrides } from "../types";
import type { NativeOrderInput } from "../spot";

export interface IntentHeaderInput {
  accountId: bigint;
  market: Address;
  signer: Address;
  authNonce: bigint;
  nonce: bigint;
  deadline: bigint;
  clientOrderId?: Hex;
  builderConfig?: BuilderConfig;
}

export interface IntentHeader {
  accountId: bigint;
  market: Address;
  signer: Address;
  authNonce: bigint;
  nonce: bigint;
  deadline: bigint;
  clientOrderId: Hex;
  builder: Address;
  builderFeePps: number;
}

export interface IntentDomainParams {
  intentExecutor: Address;
  chainId: number;
}

export interface ReplaceBySlotIntentTypedDataParams extends IntentDomainParams {
  header: IntentHeaderInput;
  packedOps: Hex;
  expectedOrderIds?: readonly bigint[];
}

export interface BatchIntentTypedDataParams extends IntentDomainParams {
  header: IntentHeaderInput;
  orders: readonly NativeOrderInput[];
  cancelSlotIdxs?: readonly number[];
  expectedOrderIds?: readonly bigint[];
}

export interface ExecuteReplaceBySlotPackedParams extends WriteOverrides {
  intentExecutor: Address;
  header: IntentHeaderInput;
  packedOps: Hex;
  expectedOrderIds?: readonly bigint[];
  signature: Hex;
}

export interface ExecuteBatchParams extends WriteOverrides {
  intentExecutor: Address;
  header: IntentHeaderInput;
  orders: readonly NativeOrderInput[];
  cancelSlotIdxs?: readonly number[];
  expectedOrderIds?: readonly bigint[];
  signature: Hex;
}
