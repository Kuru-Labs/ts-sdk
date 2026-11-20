import { encodeFunctionData, type Address } from "viem";

import { NATIVE_TOKEN_ADDRESS } from "../constants";
import { accountCoreAbi, erc20MetadataAbi } from "../generated";
import type { KuruClientConfig } from "../types";
import type { KuruContractRequest } from "../utils";
import type {
  AuthorizeAccountSignerBySigParams,
  AuthorizeAccountSignerParams,
  BuilderAddressParams,
  BuilderApprovalParams,
  CreateSubaccountParams,
  CreateSubaccountBySigParams,
  DepositCallParams,
  DepositToOwnerParams,
  DepositParams,
  EncodedDepositCall,
  Erc20AddressParams,
  PreparedTransactionRequest,
  PrepareTokenApprovalParams,
  RevokeAccountSignerBySigParams,
  RevokeAccountSignerParams,
  SetPostFillHookAccessParams,
  TransferBetweenAccountsParams,
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
    [params.rootAccountId, params.token, params.amount],
    isNativeToken(params.token) ? params.amount : undefined
  );
}

export function buildDepositToOwnerRequest(
  params: DepositToOwnerParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(
    params.accountCore,
    "deposit",
    [params.rootOwner, params.token, params.amount],
    isNativeToken(params.token) ? params.amount : undefined
  );
}

export function encodeDepositCall(
  params: DepositCallParams & { accountCore: Address }
): EncodedDepositCall {
  return {
    toContractAddress: params.accountCore,
    toContractCallData: encodeFunctionData({
      abi: accountCoreAbi,
      functionName: "deposit",
      args: [params.owner, params.token, params.amount]
    })
  };
}

export async function prepareTokenApproval(
  config: Pick<KuruClientConfig, "publicClient">,
  { owner, token, spender, amount }: PrepareTokenApprovalParams
): Promise<PreparedTransactionRequest> {
  await config.publicClient.simulateContract({
    address: token,
    abi: erc20MetadataAbi,
    functionName: "approve",
    args: [spender, amount],
    account: owner
  });
  return {
    to: token,
    data: encodeFunctionData({
      abi: erc20MetadataAbi,
      functionName: "approve",
      args: [spender, amount]
    }),
    value: 0n
  };
}

export async function prepareDeposit(
  config: Pick<KuruClientConfig, "publicClient">,
  { owner, token, amount, accountCore }: DepositCallParams & { accountCore: Address }
): Promise<PreparedTransactionRequest> {
  const request = buildDepositToOwnerRequest({
    accountCore,
    rootOwner: owner,
    token,
    amount
  });
  await config.publicClient.simulateContract({ ...request, account: owner } as any);
  return {
    to: request.address,
    data: encodeDepositCall({ owner, token, amount, accountCore }).toContractCallData,
    value: request.value ?? 0n
  };
}

export function buildWithdrawRequest(
  params: WithdrawParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "withdraw", [
    params.rootAccountId,
    params.token,
    params.amount,
    params.recipient
  ]);
}

export function buildTransferBetweenAccountsRequest(
  params: TransferBetweenAccountsParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "transferBetweenAccounts", [
    params.fromAccountId,
    params.toAccountId,
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

export function buildCreateSubaccountRequest(
  params: CreateSubaccountParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "createSubaccount", [params.rootOwner]);
}

export function buildCreateSubaccountBySigRequest(
  params: CreateSubaccountBySigParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "createSubaccountBySig", [
    params.rootOwner,
    params.authorizer,
    params.subaccountSeq,
    params.authNonce,
    params.deadline,
    params.signature
  ]);
}

export function buildSetPostFillHookAccessRequest(
  params: SetPostFillHookAccessParams & { accountCore: Address }
): KuruContractRequest<typeof accountCoreAbi> {
  return accountCoreRequest(params.accountCore, "setPostFillHookAccess", [
    params.accountId,
    params.allowed
  ]);
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
