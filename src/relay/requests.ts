import { isAddressEqual, isHex, keccak256, size, type Address, type Hex } from "viem";

import { NativeExecInstruction, NativeSide, NativeTif, type NativeOrder } from "../spot";
import type { SignedEip7702Authorization, WalletIntentHeader } from "../trading-wallet";
import {
  assertArraySize,
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
  type AnyRelayRequest,
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

const relayMethods = new Set<string>(Object.values(RelayMethod));

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

/** Revalidates and canonicalizes a relay envelope, including JSON-restored queued requests. */
export function validateRelayRequest(request: AnyRelayRequest): AnyRelayRequest {
  return buildSafely(() => {
    const object = requireObject(request, "request");
    assertExactKeys(object, ["requestId", "method", "wallet", "payload", "authorization7702"]);
    const requestId = assertRelayRequestId(requireString(object.requestId, "requestId"));
    const methodValue = requireString(object.method, "method");
    if (!relayMethods.has(methodValue)) {
      throw relayInputError("INVALID_RELAY_METHOD", "method is not a supported Relay method.");
    }
    const method = methodValue as RelayMethod;
    const wallet = normalizeAddress(requireString(object.wallet, "wallet") as Address, "wallet");
    const authorization7702 = validateAuthorization7702Wire(object.authorization7702, wallet);

    let payload: RelayRequestEnvelope["payload"];
    switch (method) {
      case RelayMethod.EXECUTE_REPLACE_BY_SLOT_PACKED:
        payload = validateReplacePayload(object.payload, false);
        break;
      case RelayMethod.EXECUTE_BATCH:
        payload = validateBatchPayload(object.payload, false);
        break;
      case RelayMethod.CREATE_REPLACE_TRIGGER:
        payload = validateReplacePayload(object.payload, true);
        break;
      case RelayMethod.CREATE_BATCH_TRIGGER:
        payload = validateBatchPayload(object.payload, true);
        break;
      case RelayMethod.CANCEL_TRIGGER:
        payload = validateCancelPayload(object.payload);
        break;
      case RelayMethod.AUTHORIZE_ACCOUNT_SIGNER:
        payload = validateAccountAuthorizationPayload(object.payload, wallet);
        break;
    }

    return { requestId, method, wallet, payload, authorization7702 } as AnyRelayRequest;
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
  const triggerExpiry = assertUint(expiryInput, 64, "triggerExpiry");
  if (triggerExpiry === 0n) {
    throw relayInputError("INVALID_TRIGGER_CONDITION", "triggerExpiry must not be zero.");
  }
  return {
    triggerExpiry: decimal(triggerExpiry),
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

function validateAuthorization7702Wire(
  value: unknown,
  expectedWallet: Address
): RelayAuthorization7702Wire | null {
  if (value === null) return null;
  const object = requireObject(value, "authorization7702");
  assertExactKeys(object, ["authority", "chainId", "delegate", "nonce", "yParity", "r", "s"]);
  const authority = normalizeAddress(
    requireString(object.authority, "authorization7702.authority") as Address,
    "authorization7702.authority"
  );
  if (!isAddressEqual(authority, expectedWallet)) {
    throw relayInputError(
      "AUTHORIZATION_AUTHORITY_MISMATCH",
      "The EIP-7702 authority must equal the relay wallet."
    );
  }
  const chainId = canonicalUint(object.chainId, 256, "authorization7702.chainId");
  if (chainId === 0n) {
    throw relayInputError("INVALID_7702_CHAIN", "authorization7702.chainId must not be zero.");
  }
  const nonce = canonicalUint(object.nonce, 64, "authorization7702.nonce");
  if (nonce >= (1n << 64n) - 1n) {
    throw relayInputError(
      "INVALID_7702_NONCE",
      "authorization7702.nonce must be below uint64.max."
    );
  }
  const yParityText = requireString(object.yParity, "authorization7702.yParity");
  if (yParityText !== "0" && yParityText !== "1") {
    throw relayInputError("INVALID_SIGNATURE", "authorization7702.yParity must be 0 or 1.");
  }
  const signature = normalizeAuthorizationSignature({
    r: requireString(object.r, "authorization7702.r") as Hex,
    s: requireString(object.s, "authorization7702.s") as Hex,
    yParity: Number(yParityText)
  });
  return {
    authority,
    chainId: decimal(chainId),
    delegate: normalizeAddress(
      requireString(object.delegate, "authorization7702.delegate") as Address,
      "authorization7702.delegate"
    ),
    nonce: decimal(nonce),
    yParity: yParityText,
    r: signature.r,
    s: signature.s
  };
}

function validateReplacePayload(value: unknown, trigger: false): RelayExecuteReplaceBySlotPayload;
function validateReplacePayload(value: unknown, trigger: true): RelayCreateReplaceTriggerPayload;
function validateReplacePayload(
  value: unknown,
  trigger: boolean
): RelayExecuteReplaceBySlotPayload | RelayCreateReplaceTriggerPayload {
  const object = requireObject(value, "payload");
  assertExactKeys(
    object,
    trigger
      ? [
          "header",
          "triggerExpiry",
          "conditionSchema",
          "condition",
          "conditionHash",
          "packedOps",
          "expectedOrderIds",
          "signature"
        ]
      : ["header", "packedOps", "expectedOrderIds", "signature"]
  );
  const header = validateHeaderWire(object.header, !trigger);
  const { packedOps, operationCount } = normalizePackedOperations(
    requireString(object.packedOps, "payload.packedOps") as Hex
  );
  const expectedOrderIds = validateUintArray(
    object.expectedOrderIds,
    64,
    "payload.expectedOrderIds"
  );
  if (expectedOrderIds.length !== operationCount) {
    throw relayInputError(
      "INVALID_ORDER_BINDINGS",
      "expectedOrderIds length must equal the packed operation count."
    );
  }
  const base: RelayExecuteReplaceBySlotPayload = {
    header,
    packedOps,
    expectedOrderIds: expectedOrderIds.map(decimal),
    signature: normalizeWalletSignature(requireString(object.signature, "payload.signature") as Hex)
  };
  if (!trigger) return base;
  return {
    ...base,
    ...serializeCondition(
      requireString(object.triggerExpiry, "payload.triggerExpiry"),
      requireString(object.conditionSchema, "payload.conditionSchema"),
      requireString(object.condition, "payload.condition") as Hex,
      requireString(object.conditionHash, "payload.conditionHash") as Hex
    )
  };
}

function validateBatchPayload(value: unknown, trigger: false): RelayExecuteBatchPayload;
function validateBatchPayload(value: unknown, trigger: true): RelayCreateBatchTriggerPayload;
function validateBatchPayload(
  value: unknown,
  trigger: boolean
): RelayExecuteBatchPayload | RelayCreateBatchTriggerPayload {
  const object = requireObject(value, "payload");
  assertExactKeys(
    object,
    trigger
      ? [
          "header",
          "triggerExpiry",
          "conditionSchema",
          "condition",
          "conditionHash",
          "orders",
          "cancelSlotIdxs",
          "expectedOrderIds",
          "signature"
        ]
      : ["header", "orders", "cancelSlotIdxs", "expectedOrderIds", "signature"]
  );
  const header = validateHeaderWire(object.header, !trigger);
  const orderValues = requireArray(object.orders, "payload.orders");
  assertArraySize(orderValues.length, "payload.orders");
  const orders = orderValues.map((order, index) => validateOrderWire(order, index));
  const cancelSlotIdxs = normalizeCancelSlotIndexes(
    validateUintArray(object.cancelSlotIdxs, 8, "payload.cancelSlotIdxs")
  );
  if (orders.length + cancelSlotIdxs.length === 0) {
    throw relayInputError("EMPTY_BATCH", "A batch must contain an order or cancellation.");
  }
  const expectedOrderIds = validateUintArray(
    object.expectedOrderIds,
    64,
    "payload.expectedOrderIds"
  );
  if (expectedOrderIds.length !== cancelSlotIdxs.length) {
    throw relayInputError(
      "INVALID_ORDER_BINDINGS",
      "expectedOrderIds length must equal cancelSlotIdxs length."
    );
  }
  const base: RelayExecuteBatchPayload = {
    header,
    orders,
    cancelSlotIdxs: cancelSlotIdxs.map(decimal),
    expectedOrderIds: expectedOrderIds.map(decimal),
    signature: normalizeWalletSignature(requireString(object.signature, "payload.signature") as Hex)
  };
  if (!trigger) return base;
  return {
    ...base,
    ...serializeCondition(
      requireString(object.triggerExpiry, "payload.triggerExpiry"),
      requireString(object.conditionSchema, "payload.conditionSchema"),
      requireString(object.condition, "payload.condition") as Hex,
      requireString(object.conditionHash, "payload.conditionHash") as Hex
    )
  };
}

function validateCancelPayload(value: unknown): RelayCancelTriggerPayload {
  const object = requireObject(value, "payload");
  assertExactKeys(object, [
    "accountId",
    "authNonce",
    "nonce",
    "deadline",
    "triggerId",
    "signature"
  ]);
  const accountId = canonicalUint(object.accountId, 40, "payload.accountId");
  if (accountId === 0n) {
    throw relayInputError("INVALID_CANCEL_TRIGGER", "accountId must not be zero.");
  }
  const deadline = canonicalUint(object.deadline, 64, "payload.deadline");
  if (deadline === 0n) {
    throw relayInputError("INVALID_CANCEL_TRIGGER", "deadline must not be zero.");
  }
  return {
    accountId: decimal(accountId),
    authNonce: decimal(canonicalUint(object.authNonce, 256, "payload.authNonce")),
    nonce: decimal(canonicalUint(object.nonce, 64, "payload.nonce")),
    deadline: decimal(deadline),
    triggerId: normalizeBytes32(
      requireString(object.triggerId, "payload.triggerId") as Hex,
      "payload.triggerId",
      false
    ),
    signature: normalizeWalletSignature(requireString(object.signature, "payload.signature") as Hex)
  };
}

function validateAccountAuthorizationPayload(
  value: unknown,
  wallet: Address
): RelayAuthorizeAccountSignerPayload {
  const object = requireObject(value, "payload");
  assertExactKeys(object, [
    "account",
    "authorizer",
    "signer",
    "permissions",
    "expiry",
    "nonce",
    "deadline",
    "signature"
  ]);
  const signer = normalizeAddress(
    requireString(object.signer, "payload.signer") as Address,
    "payload.signer"
  );
  if (!isAddressEqual(wallet, signer)) {
    throw relayInputError(
      "WALLET_SIGNER_MISMATCH",
      "The AccountCore authorization signer must equal the relay wallet."
    );
  }
  const deadline = canonicalUint(object.deadline, 256, "payload.deadline");
  if (deadline === 0n) {
    throw relayInputError("INVALID_ACCOUNT_AUTHORIZATION", "deadline must not be zero.");
  }
  return {
    account: normalizeAddress(
      requireString(object.account, "payload.account") as Address,
      "payload.account"
    ),
    authorizer: normalizeAddress(
      requireString(object.authorizer, "payload.authorizer") as Address,
      "payload.authorizer"
    ),
    signer,
    permissions: decimal(canonicalUint(object.permissions, 32, "payload.permissions")),
    expiry: decimal(canonicalUint(object.expiry, 64, "payload.expiry")),
    nonce: decimal(canonicalUint(object.nonce, 256, "payload.nonce")),
    deadline: decimal(deadline),
    signature: normalizeOpaqueSignature(requireString(object.signature, "payload.signature") as Hex)
  };
}

function validateHeaderWire(value: unknown, immediate: boolean): RelayIntentHeaderWire {
  const object = requireObject(value, "payload.header");
  assertExactKeys(object, [
    "accountId",
    "market",
    "authNonce",
    "nonce",
    "deadline",
    "clientOrderId",
    "builder",
    "builderFeePps"
  ]);
  const header = normalizeWalletIntentHeader({
    accountId: canonicalUint(object.accountId, 40, "payload.header.accountId"),
    market: requireString(object.market, "payload.header.market") as Address,
    authNonce: canonicalUint(object.authNonce, 256, "payload.header.authNonce"),
    nonce: canonicalUint(object.nonce, 64, "payload.header.nonce"),
    deadline: canonicalUint(object.deadline, 64, "payload.header.deadline"),
    clientOrderId: requireString(object.clientOrderId, "payload.header.clientOrderId") as Hex,
    builder: requireString(object.builder, "payload.header.builder") as Address,
    builderFeePps: canonicalUint(object.builderFeePps, 32, "payload.header.builderFeePps")
  });
  if (immediate && header.nonce === 0n) {
    throw relayInputError("INVALID_WALLET_INTENT", "Immediate intent nonce must not be zero.");
  }
  return serializeHeader(header);
}

function validateOrderWire(value: unknown, index: number): RelayNativeOrderWire {
  const object = requireObject(value, `payload.orders[${index}]`);
  assertExactKeys(object, [
    "side",
    "quantity",
    "price",
    "tif",
    "executionInstruction",
    "minSizeAfterBlock"
  ]);
  const side = requireString(object.side, `payload.orders[${index}].side`);
  const tif = requireString(object.tif, `payload.orders[${index}].tif`);
  const executionInstruction = requireString(
    object.executionInstruction,
    `payload.orders[${index}].executionInstruction`
  );
  return serializeOrder({
    side: side === "BUY" ? NativeSide.BUY : side === "SELL" ? NativeSide.SELL : -1,
    quantity: canonicalUint(object.quantity, 96, `payload.orders[${index}].quantity`),
    price: canonicalUint(object.price, 32, `payload.orders[${index}].price`),
    tif:
      tif === "GTC"
        ? NativeTif.GTC
        : tif === "IOC"
          ? NativeTif.IOC
          : tif === "FOK"
            ? NativeTif.FOK
            : -1,
    executionInstruction:
      executionInstruction === "NONE"
        ? NativeExecInstruction.NONE
        : executionInstruction === "POST_ONLY"
          ? NativeExecInstruction.POST_ONLY
          : -1,
    minSizeAfterBlock: canonicalUint(
      object.minSizeAfterBlock,
      32,
      `payload.orders[${index}].minSizeAfterBlock`
    )
  });
}

function validateUintArray(value: unknown, bits: number, field: string): bigint[] {
  const values = requireArray(value, field);
  assertArraySize(values.length, field);
  return values.map((item, index) => canonicalUint(item, bits, `${field}[${index}]`));
}

function canonicalUint(value: unknown, bits: number, field: string): bigint {
  const text = requireString(value, field);
  if (!/^(0|[1-9][0-9]*)$/u.test(text)) {
    throw relayInputError("INVALID_DECIMAL", `${field} must be a canonical decimal string.`);
  }
  return assertUint(text, bits, field);
}

function requireObject(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw relayInputError("INVALID_RELAY_REQUEST", `${field} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, field: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw relayInputError("INVALID_RELAY_REQUEST", `${field} must be an array.`);
  }
  return value;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw relayInputError("INVALID_RELAY_REQUEST", `${field} must be a non-empty string.`);
  }
  return value;
}

function assertExactKeys(object: Record<string, unknown>, expected: readonly string[]): void {
  const actual = Object.keys(object);
  if (
    actual.length !== expected.length ||
    expected.some((key) => !Object.prototype.hasOwnProperty.call(object, key))
  ) {
    throw relayInputError("INVALID_RELAY_REQUEST", "Relay request fields are not canonical.");
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
