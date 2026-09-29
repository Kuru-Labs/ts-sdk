import type { Address, Hex } from "viem";
import { accountCoreAbi, withdrawalLimiterAbi } from "../generated";
import type { KuruContractRequest } from "../utils";
import { accountCoreDomain } from "./typed-data";

/** Signed by the root owner, submitted by the configured withdrawal authority. */
export interface ApprovedWithdrawal {
  account: Address;
  token: Address;
  recipient: Address;
  amount: bigint;
  nonce: bigint;
  deadline: bigint;
  authorityEpoch: bigint;
}
export function buildApprovedWithdrawalTypedData(params: {
  accountCore: Address;
  chainId: number;
  withdrawal: ApprovedWithdrawal;
}) {
  return {
    domain: accountCoreDomain(params.accountCore, params.chainId),
    primaryType: "ApprovedWithdrawal",
    types: {
      ApprovedWithdrawal: [
        { name: "account", type: "address" },
        { name: "token", type: "address" },
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "authorityEpoch", type: "uint64" }
      ]
    },
    message: { ...params.withdrawal }
  } as const;
}
export function buildFulfillApprovedWithdrawalRequest(params: {
  accountCore: Address;
  withdrawal: ApprovedWithdrawal;
  signature: Hex;
}): KuruContractRequest<typeof accountCoreAbi> {
  return {
    address: params.accountCore,
    abi: accountCoreAbi,
    functionName: "fulfillApprovedWithdrawal",
    args: [params.withdrawal, params.signature]
  };
}
export function buildInvalidateApprovedWithdrawalNonceRequest(params: {
  accountCore: Address;
  rootOwner: Address;
  nextNonce: bigint;
}): KuruContractRequest<typeof accountCoreAbi> {
  return {
    address: params.accountCore,
    abi: accountCoreAbi,
    functionName: "invalidateApprovedWithdrawalNonce",
    args: [params.rootOwner, params.nextNonce]
  };
}
/** Budget preview only: Core balance, permissions, freezes, and later state can still prevent withdrawal. */
export function buildPreviewWithdrawalRequest(params: {
  withdrawalLimiter: Address;
  token: Address;
  amount: bigint;
}): KuruContractRequest<typeof withdrawalLimiterAbi> {
  return {
    address: params.withdrawalLimiter,
    abi: withdrawalLimiterAbi,
    functionName: "previewWithdrawal",
    args: [params.token, params.amount]
  };
}
