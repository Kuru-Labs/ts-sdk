import { hashTypedData, type Hex } from "viem";

import { KuruSdkError } from "../errors";
import {
  hashCancelSlotIndexes,
  hashExpectedOrderIds,
  hashNativeOrders,
  hashPackedOperations,
  normalizeAndHashNativeOrders
} from "./hashes";
import {
  buildBatchTypedData,
  buildCancelTriggerTypedData,
  buildCreateBatchTriggerTypedData,
  buildCreateReplaceTriggerTypedData,
  buildReplaceBySlotTypedData
} from "./typed-data";
import type {
  BatchIntentInput,
  CancelTriggerIntentInput,
  CreateBatchTriggerIntentInput,
  CreateReplaceTriggerIntentInput,
  PreparedBatchIntent,
  PreparedCancelTriggerIntent,
  PreparedCreateBatchTriggerIntent,
  PreparedCreateReplaceTriggerIntent,
  PreparedReplaceBySlotIntent,
  ReplaceBySlotIntentInput,
  WalletTypedDataDefinition
} from "./types";
import {
  normalizeAddress,
  normalizeBytes32,
  normalizeCancelSlotIndexes,
  normalizeChainId,
  normalizeExpectedOrderIds,
  normalizePackedOperations,
  normalizeWalletIntentHeader
} from "./validation";
import { assertUint } from "../utils";

export function prepareReplaceBySlotIntent(
  input: ReplaceBySlotIntentInput
): PreparedReplaceBySlotIntent {
  return prepareReplaceBySlotIntentInternal(input, true);
}

function prepareReplaceBySlotIntentInternal(
  input: ReplaceBySlotIntentInput,
  immediate: boolean
): PreparedReplaceBySlotIntent {
  const wallet = normalizeAddress(input.wallet, "wallet");
  const chainId = normalizeChainId(input.chainId);
  const header = normalizeWalletIntentHeader(input.header);
  if (immediate && header.nonce === 0n) {
    throw new KuruSdkError("INVALID_WALLET_INTENT", "Immediate intent nonce must not be zero.");
  }
  const { packedOps, operationCount } = normalizePackedOperations(input.packedOps);
  const expectedOrderIds = normalizeExpectedOrderIds(input.expectedOrderIds);
  if (expectedOrderIds.length !== operationCount) {
    throw new KuruSdkError(
      "INVALID_WALLET_INTENT",
      "expectedOrderIds length must equal the packed operation count."
    );
  }
  const packedOpsHash = hashPackedOperations(packedOps);
  const expectedOrderIdsHash = hashExpectedOrderIds(expectedOrderIds);
  const typedData = buildReplaceBySlotTypedData({
    wallet,
    chainId,
    header,
    packedOpsHash,
    expectedOrderIdsHash
  });
  return {
    kind: "replaceBySlot",
    wallet,
    header,
    packedOps,
    expectedOrderIds,
    packedOpsHash,
    expectedOrderIdsHash,
    typedData,
    digest: digest(typedData)
  };
}

export function prepareBatchIntent(input: BatchIntentInput): PreparedBatchIntent {
  return prepareBatchIntentInternal(input, true);
}

function prepareBatchIntentInternal(
  input: BatchIntentInput,
  immediate: boolean
): PreparedBatchIntent {
  const wallet = normalizeAddress(input.wallet, "wallet");
  const chainId = normalizeChainId(input.chainId);
  const header = normalizeWalletIntentHeader(input.header);
  if (immediate && header.nonce === 0n) {
    throw new KuruSdkError("INVALID_WALLET_INTENT", "Immediate intent nonce must not be zero.");
  }
  const { orders, hash: ordersHash } = normalizeAndHashNativeOrders(input.orders);
  const cancelSlotIdxs = normalizeCancelSlotIndexes(input.cancelSlotIdxs);
  if (orders.length + cancelSlotIdxs.length === 0) {
    throw new KuruSdkError(
      "INVALID_WALLET_INTENT",
      "A batch must contain at least one order or cancellation."
    );
  }
  const expectedOrderIds = normalizeExpectedOrderIds(input.expectedOrderIds);
  if (expectedOrderIds.length !== cancelSlotIdxs.length) {
    throw new KuruSdkError(
      "INVALID_WALLET_INTENT",
      "expectedOrderIds length must equal cancelSlotIdxs length."
    );
  }
  const cancelSlotIdxsHash = hashCancelSlotIndexes(cancelSlotIdxs);
  const expectedOrderIdsHash = hashExpectedOrderIds(expectedOrderIds);
  const typedData = buildBatchTypedData({
    wallet,
    chainId,
    header,
    ordersHash,
    cancelSlotIdxsHash,
    expectedOrderIdsHash
  });
  return {
    kind: "batch",
    wallet,
    header,
    orders,
    cancelSlotIdxs,
    expectedOrderIds,
    ordersHash,
    cancelSlotIdxsHash,
    expectedOrderIdsHash,
    typedData,
    digest: digest(typedData)
  };
}

export function prepareCreateReplaceTriggerIntent(
  input: CreateReplaceTriggerIntentInput
): PreparedCreateReplaceTriggerIntent {
  const immediate = prepareReplaceBySlotIntentInternal(input, false);
  const triggerExpiry = assertUint(input.triggerExpiry, 64, "triggerExpiry");
  const conditionHash = normalizeBytes32(input.conditionHash, "conditionHash");
  const chainId = normalizeChainId(input.chainId);
  const typedData = buildCreateReplaceTriggerTypedData({
    wallet: immediate.wallet,
    chainId,
    header: immediate.header,
    triggerExpiry,
    conditionHash,
    packedOpsHash: immediate.packedOpsHash,
    expectedOrderIdsHash: immediate.expectedOrderIdsHash
  });
  return {
    kind: "createReplaceTrigger",
    wallet: immediate.wallet,
    header: immediate.header,
    packedOps: immediate.packedOps,
    expectedOrderIds: immediate.expectedOrderIds,
    packedOpsHash: immediate.packedOpsHash,
    expectedOrderIdsHash: immediate.expectedOrderIdsHash,
    triggerExpiry,
    conditionHash,
    typedData,
    digest: digest(typedData)
  };
}

export function prepareCreateBatchTriggerIntent(
  input: CreateBatchTriggerIntentInput
): PreparedCreateBatchTriggerIntent {
  const immediate = prepareBatchIntentInternal(input, false);
  const triggerExpiry = assertUint(input.triggerExpiry, 64, "triggerExpiry");
  const conditionHash = normalizeBytes32(input.conditionHash, "conditionHash");
  const chainId = normalizeChainId(input.chainId);
  const typedData = buildCreateBatchTriggerTypedData({
    wallet: immediate.wallet,
    chainId,
    header: immediate.header,
    triggerExpiry,
    conditionHash,
    ordersHash: immediate.ordersHash,
    cancelSlotIdxsHash: immediate.cancelSlotIdxsHash,
    expectedOrderIdsHash: immediate.expectedOrderIdsHash
  });
  return {
    kind: "createBatchTrigger",
    wallet: immediate.wallet,
    header: immediate.header,
    orders: immediate.orders,
    cancelSlotIdxs: immediate.cancelSlotIdxs,
    expectedOrderIds: immediate.expectedOrderIds,
    ordersHash: immediate.ordersHash,
    cancelSlotIdxsHash: immediate.cancelSlotIdxsHash,
    expectedOrderIdsHash: immediate.expectedOrderIdsHash,
    triggerExpiry,
    conditionHash,
    typedData,
    digest: digest(typedData)
  };
}

export function prepareCancelTriggerIntent(
  input: CancelTriggerIntentInput
): PreparedCancelTriggerIntent {
  const wallet = normalizeAddress(input.wallet, "wallet");
  const chainId = normalizeChainId(input.chainId);
  const accountId = assertUint(input.accountId, 40, "accountId");
  if (accountId === 0n) {
    throw new KuruSdkError("INVALID_WALLET_INTENT", "accountId must not be zero.");
  }
  const authNonce = assertUint(input.authNonce, 256, "authNonce");
  const nonce = assertUint(input.nonce, 64, "nonce");
  const deadline = assertUint(input.deadline, 64, "deadline");
  if (deadline === 0n) {
    throw new KuruSdkError("INVALID_WALLET_INTENT", "deadline must not be zero.");
  }
  const triggerId = normalizeBytes32(input.triggerId, "triggerId", false);
  const typedData = buildCancelTriggerTypedData({
    wallet,
    chainId,
    accountId,
    authNonce,
    nonce,
    deadline,
    triggerId
  });
  return {
    kind: "cancelTrigger",
    wallet,
    accountId,
    authNonce,
    nonce,
    deadline,
    triggerId,
    typedData,
    digest: digest(typedData)
  };
}

function digest(typedData: WalletTypedDataDefinition): Hex {
  return hashTypedData(typedData as Parameters<typeof hashTypedData>[0]);
}

// Retained as an explicit export for callers that have already normalized orders.
export { hashNativeOrders };
