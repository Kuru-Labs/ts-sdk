import type { Address, Hex, TypedDataDomain } from "viem";

import { KuruSdkError } from "../errors";
import type { WalletIntentHeader, WalletTypedDataDefinition } from "./types";
import { assertUint } from "../utils";
import {
  normalizeAddress,
  normalizeBytes32,
  normalizeChainId,
  normalizeWalletIntentHeader
} from "./validation";

const headerFields = [
  { name: "accountId", type: "uint40" },
  { name: "market", type: "address" },
  { name: "authNonce", type: "uint256" },
  { name: "nonce", type: "uint64" },
  { name: "deadline", type: "uint64" },
  { name: "clientOrderId", type: "bytes32" },
  { name: "builder", type: "address" },
  { name: "builderFeePps", type: "uint32" }
] as const;

export function tradingWalletDomain(wallet: Address, chainId: number): TypedDataDomain {
  return {
    name: "KuruTradingWallet",
    version: "1",
    chainId: normalizeChainId(chainId),
    verifyingContract: normalizeAddress(wallet, "wallet")
  };
}

export function buildReplaceBySlotTypedData(parameters: {
  wallet: Address;
  chainId: number;
  header: WalletIntentHeader;
  packedOpsHash: Hex;
  expectedOrderIdsHash: Hex;
}): WalletTypedDataDefinition {
  const header = normalizeWalletIntentHeader(parameters.header);
  return {
    domain: tradingWalletDomain(parameters.wallet, parameters.chainId),
    primaryType: "ReplaceBySlotIntent",
    types: {
      ReplaceBySlotIntent: [
        ...headerFields,
        { name: "packedOpsHash", type: "bytes32" },
        { name: "expectedOrderIdsHash", type: "bytes32" }
      ]
    },
    message: {
      ...header,
      packedOpsHash: normalizeBytes32(parameters.packedOpsHash, "packedOpsHash"),
      expectedOrderIdsHash: normalizeBytes32(
        parameters.expectedOrderIdsHash,
        "expectedOrderIdsHash"
      )
    }
  };
}

export function buildBatchTypedData(parameters: {
  wallet: Address;
  chainId: number;
  header: WalletIntentHeader;
  ordersHash: Hex;
  cancelSlotIdxsHash: Hex;
  expectedOrderIdsHash: Hex;
}): WalletTypedDataDefinition {
  const header = normalizeWalletIntentHeader(parameters.header);
  return {
    domain: tradingWalletDomain(parameters.wallet, parameters.chainId),
    primaryType: "BatchIntent",
    types: {
      BatchIntent: [
        ...headerFields,
        { name: "ordersHash", type: "bytes32" },
        { name: "cancelSlotIdxsHash", type: "bytes32" },
        { name: "expectedOrderIdsHash", type: "bytes32" }
      ]
    },
    message: {
      ...header,
      ordersHash: normalizeBytes32(parameters.ordersHash, "ordersHash"),
      cancelSlotIdxsHash: normalizeBytes32(parameters.cancelSlotIdxsHash, "cancelSlotIdxsHash"),
      expectedOrderIdsHash: normalizeBytes32(
        parameters.expectedOrderIdsHash,
        "expectedOrderIdsHash"
      )
    }
  };
}

export function buildCreateReplaceTriggerTypedData(parameters: {
  wallet: Address;
  chainId: number;
  header: WalletIntentHeader;
  triggerExpiry: bigint;
  conditionHash: Hex;
  packedOpsHash: Hex;
  expectedOrderIdsHash: Hex;
}): WalletTypedDataDefinition {
  const header = normalizeWalletIntentHeader(parameters.header);
  const triggerExpiry = assertUint(parameters.triggerExpiry, 64, "triggerExpiry");
  if (triggerExpiry === 0n) {
    throw new KuruSdkError("INVALID_WALLET_INTENT", "triggerExpiry must not be zero.");
  }
  return {
    domain: tradingWalletDomain(parameters.wallet, parameters.chainId),
    primaryType: "CreateReplaceTriggerIntent",
    types: {
      CreateReplaceTriggerIntent: [
        { name: "accountId", type: "uint40" },
        { name: "market", type: "address" },
        { name: "authNonce", type: "uint256" },
        { name: "nonce", type: "uint64" },
        { name: "deadline", type: "uint64" },
        { name: "triggerExpiry", type: "uint64" },
        { name: "clientOrderId", type: "bytes32" },
        { name: "builder", type: "address" },
        { name: "builderFeePps", type: "uint32" },
        { name: "conditionHash", type: "bytes32" },
        { name: "packedOpsHash", type: "bytes32" },
        { name: "expectedOrderIdsHash", type: "bytes32" }
      ]
    },
    message: {
      accountId: header.accountId,
      market: header.market,
      authNonce: header.authNonce,
      nonce: header.nonce,
      deadline: header.deadline,
      triggerExpiry,
      clientOrderId: header.clientOrderId,
      builder: header.builder,
      builderFeePps: header.builderFeePps,
      conditionHash: normalizeBytes32(parameters.conditionHash, "conditionHash"),
      packedOpsHash: normalizeBytes32(parameters.packedOpsHash, "packedOpsHash"),
      expectedOrderIdsHash: normalizeBytes32(
        parameters.expectedOrderIdsHash,
        "expectedOrderIdsHash"
      )
    }
  };
}

export function buildCreateBatchTriggerTypedData(parameters: {
  wallet: Address;
  chainId: number;
  header: WalletIntentHeader;
  triggerExpiry: bigint;
  conditionHash: Hex;
  ordersHash: Hex;
  cancelSlotIdxsHash: Hex;
  expectedOrderIdsHash: Hex;
}): WalletTypedDataDefinition {
  const header = normalizeWalletIntentHeader(parameters.header);
  const triggerExpiry = assertUint(parameters.triggerExpiry, 64, "triggerExpiry");
  if (triggerExpiry === 0n) {
    throw new KuruSdkError("INVALID_WALLET_INTENT", "triggerExpiry must not be zero.");
  }
  return {
    domain: tradingWalletDomain(parameters.wallet, parameters.chainId),
    primaryType: "CreateBatchTriggerIntent",
    types: {
      CreateBatchTriggerIntent: [
        { name: "accountId", type: "uint40" },
        { name: "market", type: "address" },
        { name: "authNonce", type: "uint256" },
        { name: "nonce", type: "uint64" },
        { name: "deadline", type: "uint64" },
        { name: "triggerExpiry", type: "uint64" },
        { name: "clientOrderId", type: "bytes32" },
        { name: "builder", type: "address" },
        { name: "builderFeePps", type: "uint32" },
        { name: "conditionHash", type: "bytes32" },
        { name: "ordersHash", type: "bytes32" },
        { name: "cancelSlotIdxsHash", type: "bytes32" },
        { name: "expectedOrderIdsHash", type: "bytes32" }
      ]
    },
    message: {
      accountId: header.accountId,
      market: header.market,
      authNonce: header.authNonce,
      nonce: header.nonce,
      deadline: header.deadline,
      triggerExpiry,
      clientOrderId: header.clientOrderId,
      builder: header.builder,
      builderFeePps: header.builderFeePps,
      conditionHash: normalizeBytes32(parameters.conditionHash, "conditionHash"),
      ordersHash: normalizeBytes32(parameters.ordersHash, "ordersHash"),
      cancelSlotIdxsHash: normalizeBytes32(parameters.cancelSlotIdxsHash, "cancelSlotIdxsHash"),
      expectedOrderIdsHash: normalizeBytes32(
        parameters.expectedOrderIdsHash,
        "expectedOrderIdsHash"
      )
    }
  };
}

export function buildCancelTriggerTypedData(parameters: {
  wallet: Address;
  chainId: number;
  accountId: bigint;
  authNonce: bigint;
  nonce: bigint;
  deadline: bigint;
  triggerId: Hex;
}): WalletTypedDataDefinition {
  const accountId = assertUint(parameters.accountId, 40, "accountId");
  if (accountId === 0n) {
    throw new KuruSdkError("INVALID_WALLET_INTENT", "accountId must not be zero.");
  }
  const authNonce = assertUint(parameters.authNonce, 256, "authNonce");
  const nonce = assertUint(parameters.nonce, 64, "nonce");
  const deadline = assertUint(parameters.deadline, 64, "deadline");
  if (deadline === 0n) {
    throw new KuruSdkError("INVALID_WALLET_INTENT", "deadline must not be zero.");
  }
  return {
    domain: tradingWalletDomain(parameters.wallet, parameters.chainId),
    primaryType: "CancelTriggerIntent",
    types: {
      CancelTriggerIntent: [
        { name: "accountId", type: "uint40" },
        { name: "authNonce", type: "uint256" },
        { name: "nonce", type: "uint64" },
        { name: "deadline", type: "uint64" },
        { name: "triggerId", type: "bytes32" }
      ]
    },
    message: {
      accountId,
      authNonce,
      nonce,
      deadline,
      triggerId: normalizeBytes32(parameters.triggerId, "triggerId", false)
    }
  };
}
