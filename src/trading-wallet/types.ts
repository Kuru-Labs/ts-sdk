import type { Address, Hex, TypedDataDomain } from "viem";

import type { NativeOrder, NativeOrderInput } from "../spot";

export type WalletUintInput = bigint | number | string;

export interface WalletIntentHeaderInput {
  accountId: WalletUintInput;
  market: Address;
  authNonce: WalletUintInput;
  nonce: WalletUintInput;
  deadline: WalletUintInput;
  clientOrderId: Hex;
  builder?: Address;
  builderFeePps?: WalletUintInput;
}

export interface WalletIntentHeader {
  accountId: bigint;
  market: Address;
  authNonce: bigint;
  nonce: bigint;
  deadline: bigint;
  clientOrderId: Hex;
  builder: Address;
  builderFeePps: number;
}

export interface WalletDomainInput {
  chainId: number;
  wallet: Address;
}

export interface ReplaceBySlotIntentInput extends WalletDomainInput {
  header: WalletIntentHeaderInput;
  packedOps: Hex;
  expectedOrderIds: readonly WalletUintInput[];
}

export interface BatchIntentInput extends WalletDomainInput {
  header: WalletIntentHeaderInput;
  orders: readonly NativeOrderInput[];
  cancelSlotIdxs: readonly WalletUintInput[];
  expectedOrderIds: readonly WalletUintInput[];
}

export interface CreateReplaceTriggerIntentInput extends ReplaceBySlotIntentInput {
  triggerExpiry: WalletUintInput;
  conditionHash: Hex;
}

export interface CreateBatchTriggerIntentInput extends BatchIntentInput {
  triggerExpiry: WalletUintInput;
  conditionHash: Hex;
}

export interface CancelTriggerIntentInput extends WalletDomainInput {
  accountId: WalletUintInput;
  authNonce: WalletUintInput;
  nonce: WalletUintInput;
  deadline: WalletUintInput;
  triggerId: Hex;
}

export interface WalletTypedDataField {
  readonly name: string;
  readonly type: string;
}

export interface WalletTypedDataDefinition {
  readonly domain: TypedDataDomain;
  readonly primaryType:
    | "ReplaceBySlotIntent"
    | "BatchIntent"
    | "CreateReplaceTriggerIntent"
    | "CreateBatchTriggerIntent"
    | "CancelTriggerIntent";
  readonly types: Readonly<Record<string, readonly WalletTypedDataField[]>>;
  readonly message: Readonly<Record<string, unknown>>;
}

export interface PreparedReplaceBySlotIntent {
  readonly kind: "replaceBySlot";
  readonly wallet: Address;
  readonly header: WalletIntentHeader;
  readonly packedOps: Hex;
  readonly expectedOrderIds: readonly bigint[];
  readonly packedOpsHash: Hex;
  readonly expectedOrderIdsHash: Hex;
  readonly typedData: WalletTypedDataDefinition;
  readonly digest: Hex;
}

export interface PreparedBatchIntent {
  readonly kind: "batch";
  readonly wallet: Address;
  readonly header: WalletIntentHeader;
  readonly orders: readonly NativeOrder[];
  readonly cancelSlotIdxs: readonly number[];
  readonly expectedOrderIds: readonly bigint[];
  readonly ordersHash: Hex;
  readonly cancelSlotIdxsHash: Hex;
  readonly expectedOrderIdsHash: Hex;
  readonly typedData: WalletTypedDataDefinition;
  readonly digest: Hex;
}

export interface PreparedCreateReplaceTriggerIntent extends Omit<
  PreparedReplaceBySlotIntent,
  "kind" | "typedData" | "digest"
> {
  readonly kind: "createReplaceTrigger";
  readonly triggerExpiry: bigint;
  readonly conditionHash: Hex;
  readonly typedData: WalletTypedDataDefinition;
  readonly digest: Hex;
}

export interface PreparedCreateBatchTriggerIntent extends Omit<
  PreparedBatchIntent,
  "kind" | "typedData" | "digest"
> {
  readonly kind: "createBatchTrigger";
  readonly triggerExpiry: bigint;
  readonly conditionHash: Hex;
  readonly typedData: WalletTypedDataDefinition;
  readonly digest: Hex;
}

export interface PreparedCancelTriggerIntent {
  readonly kind: "cancelTrigger";
  readonly wallet: Address;
  readonly accountId: bigint;
  readonly authNonce: bigint;
  readonly nonce: bigint;
  readonly deadline: bigint;
  readonly triggerId: Hex;
  readonly typedData: WalletTypedDataDefinition;
  readonly digest: Hex;
}

export type PreparedWalletIntent =
  | PreparedReplaceBySlotIntent
  | PreparedBatchIntent
  | PreparedCreateReplaceTriggerIntent
  | PreparedCreateBatchTriggerIntent
  | PreparedCancelTriggerIntent;

export type SignedWalletIntent<TIntent extends PreparedWalletIntent = PreparedWalletIntent> =
  TIntent & {
    readonly signature: Hex;
  };

export interface WalletIntentSigner {
  readonly address?: Address;
  signTypedData(typedData: WalletTypedDataDefinition): Promise<Hex>;
}

export interface Eip7702AuthorizationRequest {
  readonly authority: Address;
  readonly chainId: number;
  readonly delegate: Address;
  readonly nonce: bigint;
}

export interface Eip7702AuthorizationSignature {
  readonly r: Hex;
  readonly s: Hex;
  readonly yParity: number;
}

export interface Eip7702AuthorizationSigner {
  readonly address?: Address;
  signAuthorization(
    authorization: Eip7702AuthorizationRequest
  ): Promise<Eip7702AuthorizationSignature>;
}

export interface AuthorizationNonceClient {
  getTransactionCount(parameters: { address: Address; blockTag: "pending" }): Promise<number>;
}

export type AuthorizationNonceResolver = (authority: Address) => Promise<WalletUintInput>;

export interface SignEip7702AuthorizationParams {
  authority: Address;
  chainId: number;
  delegate: Address;
  nonce?: WalletUintInput;
  publicClient?: AuthorizationNonceClient;
  nonceResolver?: AuthorizationNonceResolver;
  signer: Eip7702AuthorizationSigner;
}

export interface SignedEip7702Authorization extends Eip7702AuthorizationRequest {
  readonly digest: Hex;
  readonly r: Hex;
  readonly s: Hex;
  readonly yParity: number;
}
