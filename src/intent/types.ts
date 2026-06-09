import type { Address, Hex } from "viem";

import type { BuilderConfig, WriteOverrides } from "../types";
import type { NativeOrderInput } from "../spot";

export interface IntentHeaderInput {
  accountId: bigint;
  market: Address;
  signer: Address;
  nonce: bigint;
  deadline: bigint;
  clientOrderId?: Hex;
  builderConfig?: BuilderConfig;
}

export interface IntentHeader {
  accountId: bigint;
  market: Address;
  signer: Address;
  nonce: bigint;
  deadline: bigint;
  clientOrderId: Hex;
  builder: Address;
  builderFeeBps: number;
}

export interface IntentDomainParams {
  intentExecutor: Address;
  chainId: number;
}

export interface ReplaceBySlotIntentTypedDataParams extends IntentDomainParams {
  header: IntentHeaderInput;
  packedOps: Hex;
}

export interface BatchIntentTypedDataParams extends IntentDomainParams {
  header: IntentHeaderInput;
  orders: readonly NativeOrderInput[];
  cancelSlotIdxs?: readonly number[];
}

export interface ExecuteReplaceBySlotPackedParams extends WriteOverrides {
  intentExecutor: Address;
  header: IntentHeaderInput;
  packedOps: Hex;
  signature: Hex;
}

export interface ExecuteBatchParams extends WriteOverrides {
  intentExecutor: Address;
  header: IntentHeaderInput;
  orders: readonly NativeOrderInput[];
  cancelSlotIdxs?: readonly number[];
  signature: Hex;
}
