import type { Address } from "viem";

import { NATIVE_TOKEN_ADDRESS } from "../constants";
import { accountCoreAbi, erc20MetadataAbi } from "../generated";
import type { KuruContractRequest } from "../utils";
import type {
  AuthorizeAccountSignerBySigParams,
  AuthorizeAccountSignerParams,
  BuilderAddressParams,
  BuilderApprovalParams,
  ClaimBuilderFeesParams,
  DepositForAccountParams,
  DepositParams,
  Erc20AddressParams,
  RevokeAccountSignerBySigParams,
  RevokeAccountSignerParams,
  TransferBetweenAccountsParams,
  WithdrawFromAccountParams,
  WithdrawParams
} from "./types";

export function isNativeToken(token: Address): boolean {
  return token.toLowerCase() === NATIVE_TOKEN_ADDRESS;
}

function accountCoreRequest(
  accountCore: Address,
  functionName: string,
  args: readonly unknown[],
  value?: bigint
): KuruContractRequest<typeof accountCoreAbi> {
  const request = {
    address: accountCore,
    abi: accountCoreAbi,
    functionName,
    args
  } as KuruContractRequest<typeof accountCoreAbi>;

  return value === undefined || value === 0n ? request : { ...request, value };
}

export function buildDepositRequest(
  params: DepositParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(
    params.accountCore,
    "deposit",
    [params.token, params.amount],
    isNativeToken(params.token) ? params.amount : undefined
  );
}

export function buildDepositForAccountRequest(
  params: DepositForAccountParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(
    params.accountCore,
    "depositForAccount",
    [params.account, params.token, params.amount],
    isNativeToken(params.token) ? params.amount : undefined
  );
}

export function buildWithdrawRequest(
  params: WithdrawParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "withdraw", [params.token, params.amount]);
}

export function buildWithdrawFromAccountRequest(
  params: WithdrawFromAccountParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "withdrawFromAccount", [
    params.account,
    params.token,
    params.amount
  ]);
}

export function buildTransferBetweenAccountsRequest(
  params: TransferBetweenAccountsParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "transferBetweenAccounts", [
    params.fromAccount,
    params.toAccount,
    params.token,
    params.amount
  ]);
}

export function buildAuthorizeAccountSignerRequest(
  params: AuthorizeAccountSignerParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "authorizeAccountSigner", [
    params.account,
    params.signer,
    params.permissions,
    params.expiry
  ]);
}

export function buildAuthorizeAccountSignerBySigRequest(
  params: AuthorizeAccountSignerBySigParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "authorizeAccountSignerBySig", [
    params.account,
    params.authorizer,
    params.signer,
    params.permissions,
    params.expiry,
    params.nonce,
    params.deadline,
    params.signature
  ]);
}

export function buildApproveBuilderRequest(
  params: BuilderApprovalParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "approveBuilder", [
    params.builder,
    params.maxFeePps,
    params.expiry
  ]);
}

export function buildRevokeAccountSignerRequest(
  params: RevokeAccountSignerParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "revokeAccountSigner", [
    params.account,
    params.signer
  ]);
}

export function buildRevokeAccountSignerBySigRequest(
  params: RevokeAccountSignerBySigParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "revokeAccountSignerBySig", [
    params.account,
    params.authorizer,
    params.signer,
    params.nonce,
    params.deadline,
    params.signature
  ]);
}

export function buildRevokeBuilderRequest(
  params: BuilderAddressParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "revokeBuilder", [params.builder]);
}

export function buildClaimBuilderFeesRequest(
  params: ClaimBuilderFeesParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "claimBuilderFees", [params.asset]);
}

export function buildApproveErc20Request(
  params: Erc20AddressParams
): KuruContractRequest<typeof erc20MetadataAbi> {
  return {
    address: params.token,
    abi: erc20MetadataAbi,
    functionName: "approve",
    args: [params.spender, params.amount]
  };
}
