import type { Address, Hex, LocalAccount, WalletClient } from "viem";

import type { AuthorizeAccountSignerBySigParams } from "../account";
import type {
  SignedEip7702Authorization,
  SignedWalletIntent,
  PreparedBatchIntent,
  PreparedCancelTriggerIntent,
  PreparedCreateBatchTriggerIntent,
  PreparedCreateReplaceTriggerIntent,
  PreparedReplaceBySlotIntent
} from "../trading-wallet";

export const RelayMethod = {
  AUTHORIZE_ACCOUNT_SIGNER: "account_core.authorize_account_signer_by_sig",
  EXECUTE_BATCH: "wallet.execute_batch",
  EXECUTE_REPLACE_BY_SLOT_PACKED: "wallet.execute_replace_by_slot_packed",
  CREATE_REPLACE_TRIGGER: "wallet.create_replace_trigger",
  CREATE_BATCH_TRIGGER: "wallet.create_batch_trigger",
  CANCEL_TRIGGER: "wallet.cancel_trigger"
} as const;

export type RelayMethod = (typeof RelayMethod)[keyof typeof RelayMethod];
export type RelayTransactionType = "DYNAMIC_FEE" | "SET_CODE";

export interface RelayPersonalMessageSigner {
  readonly address?: Address;
  signMessage(message: string): Promise<Hex>;
}

export type RelayFetch = typeof globalThis.fetch;

export interface RelayChallenge {
  readonly challengeId: string;
  readonly message: string;
  readonly expiresAt: Date;
}

export interface RelayAccessToken {
  readonly accessToken: string;
  readonly tokenType: "Bearer";
  readonly expiresAt: Date;
  readonly wallet: Address;
}

export type RelayTokenValue = string | RelayAccessToken;
export type RelayTokenProvider = () => RelayTokenValue | Promise<RelayTokenValue>;

export interface RelayRequestOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

export interface RelaySubmitOptions extends RelayRequestOptions {
  readonly accessToken?: RelayTokenValue;
}

export interface RelayAuthenticationOptions extends RelayRequestOptions {
  readonly wallet?: Address;
  readonly signer?: RelayPersonalMessageSigner;
  readonly retainToken?: boolean;
}

export interface KuruRelayClientConfig {
  readonly baseUrl: string;
  readonly fetch?: RelayFetch;
  readonly signer?: RelayPersonalMessageSigner;
  readonly accessToken?: RelayTokenValue;
  readonly tokenProvider?: RelayTokenProvider;
  readonly timeoutMs?: number;
  readonly requestIdSource?: () => string;
  readonly now?: () => Date;
}

export interface RelayIntentHeaderWire {
  readonly accountId: string;
  readonly market: Address;
  readonly authNonce: string;
  readonly nonce: string;
  readonly deadline: string;
  readonly clientOrderId: Hex;
  readonly builder: Address;
  readonly builderFeePps: string;
}

export interface RelayNativeOrderWire {
  readonly side: "BUY" | "SELL";
  readonly quantity: string;
  readonly price: string;
  readonly tif: "GTC" | "IOC" | "FOK";
  readonly executionInstruction: "NONE" | "POST_ONLY";
  readonly minSizeAfterBlock: string;
}

export interface RelayAuthorization7702Wire {
  readonly authority: Address;
  readonly chainId: string;
  readonly delegate: Address;
  readonly nonce: string;
  readonly yParity: string;
  readonly r: Hex;
  readonly s: Hex;
}

export interface RelayExecuteReplaceBySlotPayload {
  readonly header: RelayIntentHeaderWire;
  readonly packedOps: Hex;
  readonly expectedOrderIds: readonly string[];
  readonly signature: Hex;
}

export interface RelayExecuteBatchPayload {
  readonly header: RelayIntentHeaderWire;
  readonly orders: readonly RelayNativeOrderWire[];
  readonly cancelSlotIdxs: readonly string[];
  readonly expectedOrderIds: readonly string[];
  readonly signature: Hex;
}

export interface RelayTriggerConditionWire {
  readonly triggerExpiry: string;
  readonly conditionSchema: string;
  readonly condition: Hex;
  readonly conditionHash: Hex;
}

export type RelayCreateReplaceTriggerPayload = RelayExecuteReplaceBySlotPayload &
  RelayTriggerConditionWire;
export type RelayCreateBatchTriggerPayload = RelayExecuteBatchPayload & RelayTriggerConditionWire;

export interface RelayCancelTriggerPayload {
  readonly accountId: string;
  readonly authNonce: string;
  readonly nonce: string;
  readonly deadline: string;
  readonly triggerId: Hex;
  readonly signature: Hex;
}

export interface RelayAuthorizeAccountSignerPayload {
  readonly account: Address;
  readonly authorizer: Address;
  readonly signer: Address;
  readonly permissions: string;
  readonly expiry: string;
  readonly nonce: string;
  readonly deadline: string;
  readonly signature: Hex;
}

export interface RelayPayloadByMethod {
  readonly [RelayMethod.AUTHORIZE_ACCOUNT_SIGNER]: RelayAuthorizeAccountSignerPayload;
  readonly [RelayMethod.EXECUTE_BATCH]: RelayExecuteBatchPayload;
  readonly [RelayMethod.EXECUTE_REPLACE_BY_SLOT_PACKED]: RelayExecuteReplaceBySlotPayload;
  readonly [RelayMethod.CREATE_REPLACE_TRIGGER]: RelayCreateReplaceTriggerPayload;
  readonly [RelayMethod.CREATE_BATCH_TRIGGER]: RelayCreateBatchTriggerPayload;
  readonly [RelayMethod.CANCEL_TRIGGER]: RelayCancelTriggerPayload;
}

export interface RelayRequestEnvelope<TMethod extends RelayMethod = RelayMethod> {
  readonly requestId: string;
  readonly method: TMethod;
  readonly wallet: Address;
  readonly payload: RelayPayloadByMethod[TMethod];
  readonly authorization7702: RelayAuthorization7702Wire | null;
}

export type AnyRelayRequest = {
  [TMethod in RelayMethod]: RelayRequestEnvelope<TMethod>;
}[RelayMethod];

export interface RelayBroadcastResponse {
  readonly requestId: string;
  readonly status: "BROADCAST";
  readonly txHash: Hex;
  readonly sponsorAddress: Address;
  readonly sponsorNonce: string;
  readonly transactionType: RelayTransactionType;
}

export interface RelayFailureResponse {
  readonly requestId: string | null;
  readonly status: "REJECTED" | "UNKNOWN";
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
  readonly retryAfterMs: number | null;
  readonly candidateTxHash: Hex | null;
  readonly sponsorAddress: Address | null;
  readonly sponsorNonce: string | null;
}

export interface RelayAuthenticationFailureResponse {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

export interface RelayRequestBuilderBase {
  readonly requestId: string;
  readonly authorization7702?: SignedEip7702Authorization;
}

export interface BuildExecuteReplaceBySlotRelayRequest extends RelayRequestBuilderBase {
  readonly intent: SignedWalletIntent<PreparedReplaceBySlotIntent>;
}

export interface BuildExecuteBatchRelayRequest extends RelayRequestBuilderBase {
  readonly intent: SignedWalletIntent<PreparedBatchIntent>;
}

export interface BuildCreateReplaceTriggerRelayRequest extends RelayRequestBuilderBase {
  readonly intent: SignedWalletIntent<PreparedCreateReplaceTriggerIntent>;
  readonly conditionSchema: bigint | number | string;
  readonly condition: Hex;
}

export interface BuildCreateBatchTriggerRelayRequest extends RelayRequestBuilderBase {
  readonly intent: SignedWalletIntent<PreparedCreateBatchTriggerIntent>;
  readonly conditionSchema: bigint | number | string;
  readonly condition: Hex;
}

export interface BuildCancelTriggerRelayRequest extends RelayRequestBuilderBase {
  readonly intent: SignedWalletIntent<PreparedCancelTriggerIntent>;
}

export interface BuildAuthorizeAccountSignerRelayRequest extends RelayRequestBuilderBase {
  readonly wallet: Address;
  readonly authorization: AuthorizeAccountSignerBySigParams;
}

export type RelaySubmitBuilderParams<T extends RelayRequestBuilderBase> = Omit<T, "requestId"> & {
  readonly requestId?: string;
};

export type LocalMessageAccount = Pick<LocalAccount, "address" | "signMessage">;
export type MessageWalletClient = Pick<WalletClient, "signMessage">;
