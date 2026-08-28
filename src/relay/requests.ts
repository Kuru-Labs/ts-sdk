import { isAddressEqual, isHex, keccak256, size, type Address, type Hex } from "viem";

import { NativeExecInstruction, NativeSide, NativeTif, type NativeOrder } from "../spot";
import type { SignedEip7702Authorization, WalletIntentHeader } from "../trading-wallet";
import {
  normalizeAddress,
  normalizeAuthorizationSignature,
  normalizeBytes32,
  normalizeCancelSlotIndexes,
  normalizeExpectedOrderIds,
  normalizePackedOperations,
  normalizeWalletSignature,
  normalizeWalletIntentHeader
} from "../trading-wallet/validation";
import { assertUint } from "../utils";
import { KuruRelayError, relayInputError } from "./errors";
import { assertRelayRequestId } from "./request-id";
import {
  RelayMethod,
  type BuildAuthorizeAccountSignerRelayRequest,
  type BuildCancelTriggerRelayRequest,
  type BuildCreateBatchTriggerRelayRequest,
  type BuildCreateReplaceTriggerRelayRequest,
  type BuildExecuteBatchRelayRequest,
  type BuildExecuteReplaceBySlotRelayRequest,
  type RelayAuthorization7702Wire,
  type RelayAuthorizeAccountSignerPayload,
  type RelayCancelTriggerPayload,
  type RelayCreateBatchTriggerPayload,
  type RelayCreateReplaceTriggerPayload,
  type RelayExecuteBatchPayload,
  type RelayExecuteReplaceBySlotPayload,
  type RelayIntentHeaderWire,
  type RelayNativeOrderWire,
  type RelayRequestEnvelope
} from "./types";

export function buildExecuteReplaceBySlotRelayRequest(
  parameters: BuildExecuteReplaceBySlotRelayRequest
): RelayRequestEnvelope<typeof RelayMethod.EXECUTE_REPLACE_BY_SLOT_PACKED> {
  return buildSafely(() => {
    requireIntentKind(parameters.intent.kind, "replaceBySlot");
    const { header, packedOps, expectedOrderIds } = validateReplaceIntent(parameters.intent);
    const payload: RelayExecuteReplaceBySlotPayload = {
      header: serializeHeader(header),
      packedOps,
      expectedOrderIds: expectedOrderIds.map(decimal),
      signature: normalizeWalletSignature(parameters.intent.signature)
    };
    return envelope(
      parameters.requestId,
      RelayMethod.EXECUTE_REPLACE_BY_SLOT_PACKED,
      parameters.intent.wallet,
      payload,
      parameters.authorization7702
    );
  });
}

export function buildExecuteBatchRelayRequest(
  parameters: BuildExecuteBatchRelayRequest
): RelayRequestEnvelope<typeof RelayMethod.EXECUTE_BATCH> {
  return buildSafely(() => {
    requireIntentKind(parameters.intent.kind, "batch");
    const { header, orders, cancelSlotIdxs, expectedOrderIds } = validateBatchIntent(
      parameters.intent
    );
    const payload: RelayExecuteBatchPayload = {
      header: serializeHeader(header),
      orders: orders.map(serializeOrder),
      cancelSlotIdxs: cancelSlotIdxs.map(decimal),
      expectedOrderIds: expectedOrderIds.map(decimal),
      signature: normalizeWalletSignature(parameters.intent.signature)
    };
    return envelope(
      parameters.requestId,
      RelayMethod.EXECUTE_BATCH,
      parameters.intent.wallet,
      payload,
      parameters.authorization7702
    );
  });
}

export function buildCreateReplaceTriggerRelayRequest(
  parameters: BuildCreateReplaceTriggerRelayRequest
): RelayRequestEnvelope<typeof RelayMethod.CREATE_REPLACE_TRIGGER> {
  return buildSafely(() => {
    requireIntentKind(parameters.intent.kind, "createReplaceTrigger");
    const condition = serializeCondition(
      parameters.intent.triggerExpiry,
      parameters.conditionSchema,
      parameters.condition,
      parameters.intent.conditionHash
    );
    const { header, packedOps, expectedOrderIds } = validateReplaceIntent(parameters.intent);
    const payload: RelayCreateReplaceTriggerPayload = {
      header: serializeHeader(header),
      ...condition,
      packedOps,
      expectedOrderIds: expectedOrderIds.map(decimal),
      signature: normalizeWalletSignature(parameters.intent.signature)
    };
    return envelope(
      parameters.requestId,
      RelayMethod.CREATE_REPLACE_TRIGGER,
      parameters.intent.wallet,
      payload,
      parameters.authorization7702
    );
  });
}

export function buildCreateBatchTriggerRelayRequest(
  parameters: BuildCreateBatchTriggerRelayRequest
): RelayRequestEnvelope<typeof RelayMethod.CREATE_BATCH_TRIGGER> {
  return buildSafely(() => {
    requireIntentKind(parameters.intent.kind, "createBatchTrigger");
    const condition = serializeCondition(
      parameters.intent.triggerExpiry,
      parameters.conditionSchema,
      parameters.condition,
      parameters.intent.conditionHash
    );
    const { header, orders, cancelSlotIdxs, expectedOrderIds } = validateBatchIntent(
      parameters.intent
    );
    const payload: RelayCreateBatchTriggerPayload = {
      header: serializeHeader(header),
      ...condition,
      orders: orders.map(serializeOrder),
      cancelSlotIdxs: cancelSlotIdxs.map(decimal),
      expectedOrderIds: expectedOrderIds.map(decimal),
      signature: normalizeWalletSignature(parameters.intent.signature)
    };
    return envelope(
      parameters.requestId,
      RelayMethod.CREATE_BATCH_TRIGGER,
      parameters.intent.wallet,
      payload,
      parameters.authorization7702
    );
  });
}

export function buildCancelTriggerRelayRequest(
  parameters: BuildCancelTriggerRelayRequest
): RelayRequestEnvelope<typeof RelayMethod.CANCEL_TRIGGER> {
  return buildSafely(() => {
    requireIntentKind(parameters.intent.kind, "cancelTrigger");
    const accountId = assertUint(parameters.intent.accountId, 40, "accountId");
    if (accountId === 0n) {
      throw relayInputError("INVALID_CANCEL_TRIGGER", "accountId must not be zero.");
    }
    const payload: RelayCancelTriggerPayload = {
      accountId: decimal(accountId),
      authNonce: decimal(parameters.intent.authNonce),
      nonce: decimal(parameters.intent.nonce),
      deadline: decimal(parameters.intent.deadline),
      triggerId: normalizeBytes32(parameters.intent.triggerId, "triggerId", false),
      signature: normalizeWalletSignature(parameters.intent.signature)
    };
    return envelope(
      parameters.requestId,
      RelayMethod.CANCEL_TRIGGER,
      parameters.intent.wallet,
      payload,
      parameters.authorization7702
    );
  });
}

export function buildAuthorizeAccountSignerRelayRequest(
  parameters: BuildAuthorizeAccountSignerRelayRequest
): RelayRequestEnvelope<typeof RelayMethod.AUTHORIZE_ACCOUNT_SIGNER> {
  return buildSafely(() => {
    const wallet = normalizeAddress(parameters.wallet, "wallet");
    const authorization = parameters.authorization;
    const signer = normalizeAddress(authorization.signer, "authorization.signer");
    if (!isAddressEqual(wallet, signer)) {
      throw relayInputError(
        "WALLET_SIGNER_MISMATCH",
        "The AccountCore authorization signer must equal the relay wallet."
      );
    }
    const payload: RelayAuthorizeAccountSignerPayload = {
      account: normalizeAddress(authorization.account, "authorization.account"),
      authorizer: normalizeAddress(authorization.authorizer, "authorization.authorizer"),
      signer,
      permissions: decimal(assertUint(authorization.permissions, 32, "authorization.permissions")),
      expiry: decimal(assertUint(authorization.expiry, 64, "authorization.expiry")),
      nonce: decimal(assertUint(authorization.nonce, 256, "authorization.nonce")),
      deadline: decimal(assertUint(authorization.deadline, 256, "authorization.deadline")),
      signature: normalizeOpaqueSignature(authorization.signature)
    };
    return envelope(
      parameters.requestId,
      RelayMethod.AUTHORIZE_ACCOUNT_SIGNER,
      wallet,
      payload,
      parameters.authorization7702
    );
  });
}

function envelope<TMethod extends RelayMethod>(
  requestId: string,
  method: TMethod,
  walletValue: Address,
  payload: RelayRequestEnvelope<TMethod>["payload"],
  authorization?: SignedEip7702Authorization
): RelayRequestEnvelope<TMethod> {
  const wallet = normalizeAddress(walletValue, "wallet");
  return {
    requestId: assertRelayRequestId(requestId),
    method,
    wallet,
    payload,
    authorization7702: authorization ? serializeAuthorization7702(authorization, wallet) : null
  };
}

export function serializeAuthorization7702(
  authorization: SignedEip7702Authorization,
  expectedWallet?: Address
): RelayAuthorization7702Wire {
  const authority = normalizeAddress(authorization.authority, "authorization7702.authority");
  if (expectedWallet && !isAddressEqual(authority, expectedWallet)) {
    throw relayInputError(
      "AUTHORIZATION_AUTHORITY_MISMATCH",
      "The EIP-7702 authority must equal the relay wallet."
    );
  }
  const signature = normalizeAuthorizationSignature(authorization);
  const chainId = assertUint(authorization.chainId, 256, "authorization7702.chainId");
  if (chainId === 0n) {
    throw relayInputError("INVALID_7702_CHAIN", "authorization7702.chainId must not be zero.");
  }
  const nonce = assertUint(authorization.nonce, 64, "authorization7702.nonce");
  if (nonce >= (1n << 64n) - 1n) {
    throw relayInputError(
      "INVALID_7702_NONCE",
      "authorization7702.nonce must be below uint64.max."
    );
  }
  return {
    authority,
    chainId: decimal(chainId),
    delegate: normalizeAddress(authorization.delegate, "authorization7702.delegate"),
    nonce: decimal(nonce),
    yParity: String(signature.yParity),
    r: signature.r,
    s: signature.s
  };
}

function serializeHeader(header: WalletIntentHeader): RelayIntentHeaderWire {
  return {
    accountId: decimal(assertUint(header.accountId, 40, "header.accountId")),
    market: normalizeAddress(header.market, "header.market"),
    authNonce: decimal(assertUint(header.authNonce, 256, "header.authNonce")),
    nonce: decimal(assertUint(header.nonce, 64, "header.nonce")),
    deadline: decimal(assertUint(header.deadline, 64, "header.deadline")),
    clientOrderId: normalizeFixedHex(header.clientOrderId, 32, "header.clientOrderId"),
    builder: normalizeAddress(header.builder, "header.builder", true),
    builderFeePps: decimal(assertUint(header.builderFeePps, 32, "header.builderFeePps"))
  };
}

function validateReplaceIntent(intent: {
  header: WalletIntentHeader;
  packedOps: Hex;
  expectedOrderIds: readonly bigint[];
}) {
  const header = normalizeWalletIntentHeader(intent.header);
  const { packedOps, operationCount } = normalizePackedOperations(intent.packedOps);
  const expectedOrderIds = normalizeExpectedOrderIds(intent.expectedOrderIds);
  if (expectedOrderIds.length !== operationCount) {
    throw relayInputError(
      "INVALID_ORDER_BINDINGS",
      "expectedOrderIds length must equal the packed operation count."
    );
  }
  return { header, packedOps, expectedOrderIds };
}

function validateBatchIntent(intent: {
  header: WalletIntentHeader;
  orders: readonly NativeOrder[];
  cancelSlotIdxs: readonly number[];
  expectedOrderIds: readonly bigint[];
}) {
  const header = normalizeWalletIntentHeader(intent.header);
  const orders = intent.orders;
  const cancelSlotIdxs = normalizeCancelSlotIndexes(intent.cancelSlotIdxs);
  if (orders.length + cancelSlotIdxs.length === 0) {
    throw relayInputError("EMPTY_BATCH", "A batch must contain an order or cancellation.");
  }
  const expectedOrderIds = normalizeExpectedOrderIds(intent.expectedOrderIds);
  if (expectedOrderIds.length !== cancelSlotIdxs.length) {
    throw relayInputError(
      "INVALID_ORDER_BINDINGS",
      "expectedOrderIds length must equal cancelSlotIdxs length."
    );
  }
  return { header, orders, cancelSlotIdxs, expectedOrderIds };
}

function serializeOrder(order: {
  side: number;
  quantity: bigint;
  price: bigint;
  tif: number;
  executionInstruction: number;
  minSizeAfterBlock: bigint;
}): RelayNativeOrderWire {
  const side =
    order.side === NativeSide.BUY ? "BUY" : order.side === NativeSide.SELL ? "SELL" : null;
  const tif =
    order.tif === NativeTif.GTC
      ? "GTC"
      : order.tif === NativeTif.IOC
        ? "IOC"
        : order.tif === NativeTif.FOK
          ? "FOK"
          : null;
  const executionInstruction =
    order.executionInstruction === NativeExecInstruction.NONE
      ? "NONE"
      : order.executionInstruction === NativeExecInstruction.POST_ONLY
        ? "POST_ONLY"
        : null;
  if (!side || !tif || !executionInstruction) {
    throw relayInputError("INVALID_NATIVE_ORDER", "A native order contains an invalid enum value.");
  }
  const quantity = assertUint(order.quantity, 96, "order.quantity");
  const price = assertUint(order.price, 32, "order.price");
  const minSizeAfterBlock = assertUint(order.minSizeAfterBlock, 32, "order.minSizeAfterBlock");
  if (quantity === 0n || price === 0n || price === 0xffff_ffffn) {
    throw relayInputError(
      "INVALID_NATIVE_ORDER",
      "A native order requires nonzero quantity and a price below uint32.max."
    );
  }
  if (executionInstruction === "POST_ONLY" && tif !== "GTC") {
    throw relayInputError("INVALID_NATIVE_ORDER", "POST_ONLY orders must use GTC.");
  }
  if (tif !== "GTC" && minSizeAfterBlock !== 0n) {
    throw relayInputError(
      "INVALID_NATIVE_ORDER",
      "IOC and FOK orders require minSizeAfterBlock to be zero."
    );
  }
  return {
    side,
    quantity: decimal(quantity),
    price: decimal(price),
    tif,
    executionInstruction,
    minSizeAfterBlock: decimal(minSizeAfterBlock)
  };
}

function serializeCondition(
  expiryInput: bigint | number | string,
  schemaInput: bigint | number | string,
  conditionInput: Hex,
  declaredHashInput: Hex
) {
  const schema = assertUint(schemaInput, 32, "conditionSchema");
  if (schema === 0n) {
    throw relayInputError("INVALID_TRIGGER_CONDITION", "conditionSchema must not be zero.");
  }
  const condition = normalizeHex(conditionInput, "condition", false);
  if (size(condition) < 4) {
    throw relayInputError(
      "INVALID_TRIGGER_CONDITION",
      "condition must begin with its four-byte schema."
    );
  }
  const encodedSchema = BigInt(`0x${condition.slice(2, 10)}`);
  if (encodedSchema !== schema) {
    throw relayInputError(
      "INVALID_TRIGGER_CONDITION",
      "conditionSchema must equal the first four bytes of condition."
    );
  }
  const conditionHash = normalizeFixedHex(declaredHashInput, 32, "conditionHash");
  if (keccak256(condition) !== conditionHash) {
    throw relayInputError(
      "INVALID_TRIGGER_CONDITION",
      "conditionHash must equal keccak256(condition)."
    );
  }
  return {
    triggerExpiry: decimal(assertUint(expiryInput, 64, "triggerExpiry")),
    conditionSchema: decimal(schema),
    condition,
    conditionHash
  };
}

function decimal(value: bigint | number): string {
  return BigInt(value).toString(10);
}

function normalizeFixedHex(value: Hex, bytes: number, field: string): Hex {
  if (!isHex(value, { strict: true }) || size(value) !== bytes) {
    throw relayInputError("INVALID_HEX", `${field} must be exactly ${bytes} bytes.`);
  }
  return value.toLowerCase() as Hex;
}

function normalizeHex(value: Hex, field: string, allowEmpty: boolean): Hex {
  if (!isHex(value, { strict: true }) || (!allowEmpty && size(value) === 0)) {
    throw relayInputError("INVALID_HEX", `${field} must be non-empty strict hexadecimal bytes.`);
  }
  return value.toLowerCase() as Hex;
}

function normalizeOpaqueSignature(value: Hex): Hex {
  const signature = normalizeHex(value, "authorization.signature", false);
  if (size(signature) > 4096) {
    throw relayInputError("INVALID_SIGNATURE", "authorization.signature exceeds 4096 bytes.");
  }
  return signature;
}

function requireIntentKind(actual: string, expected: string): void {
  if (actual !== expected) {
    throw relayInputError("INTENT_KIND_MISMATCH", `Expected a ${expected} signed wallet intent.`);
  }
}

function buildSafely<T>(builder: () => T): T {
  try {
    return builder();
  } catch (cause) {
    if (cause instanceof KuruRelayError) throw cause;
    throw relayInputError("INVALID_RELAY_REQUEST", "Relay request input is invalid.");
  }
}
