import type { Address } from "viem";

import { accountCoreAbi, erc20MetadataAbi } from "../generated";
import type { KuruClientConfig, WriteOverrides } from "../types";
import { executeWrite, readContract, requireConfiguredAddress } from "../utils";
import {
  buildApproveBuilderRequest,
  buildApproveErc20Request,
  buildAuthorizeAccountSignerBySigRequest,
  buildAuthorizeAccountSignerRequest,
  buildClaimBuilderFeesRequest,
  buildDepositForAccountRequest,
  buildDepositRequest,
  buildRevokeAccountSignerBySigRequest,
  buildRevokeAccountSignerRequest,
  buildRevokeBuilderRequest,
  buildSetPostFillHookAccessRequest,
  buildTransferBetweenAccountsRequest,
  buildWithdrawFromAccountRequest,
  buildWithdrawRequest
} from "./requests";
import type {
  AccountCoreOverride,
  AccountReadParams,
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
  SetPostFillHookAccessParams,
  TransferBetweenAccountsParams,
  WithdrawFromAccountParams,
  WithdrawParams
} from "./types";

function resolveAccountCore(config: KuruClientConfig, override?: Address): Address {
  return requireConfiguredAddress(config.addresses, "accountCore", override);
}

function simulateOnly(params: { simulate?: boolean }): WriteOverrides {
  return params.simulate === undefined ? {} : { simulate: params.simulate };
}

export function createAccountClient(config: KuruClientConfig) {
  return {
    buildDepositRequest: (params: DepositParams) =>
      buildDepositRequest({
        ...params,
        accountCore: resolveAccountCore(config, params.accountCore)
      }),
    buildDepositForAccountRequest: (params: DepositForAccountParams) =>
      buildDepositForAccountRequest({
        ...params,
        accountCore: resolveAccountCore(config, params.accountCore)
      }),
    buildWithdrawRequest: (params: WithdrawParams) =>
      buildWithdrawRequest({
        ...params,
        accountCore: resolveAccountCore(config, params.accountCore)
      }),
    buildWithdrawFromAccountRequest: (params: WithdrawFromAccountParams) =>
      buildWithdrawFromAccountRequest({
        ...params,
        accountCore: resolveAccountCore(config, params.accountCore)
      }),
    buildApproveErc20Request,
    buildSetPostFillHookAccessRequest: (params: SetPostFillHookAccessParams) =>
      buildSetPostFillHookAccessRequest({
        ...params,
        accountCore: resolveAccountCore(config, params.accountCore)
      }),

    getBalance: (params: AccountReadParams) =>
      readContract<bigint>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "getBalance",
        args: [params.user, params.token]
      }),
    getSpotReservedBalance: (params: AccountReadParams) =>
      readContract<bigint>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "getSpotReservedBalance",
        args: [params.user, params.token]
      }),
    getAccountId: (params: AccountCoreOverride & { user: Address }) =>
      readContract<bigint>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "userRegistry",
        args: [params.user]
      }),
    getAccountOwner: (params: AccountCoreOverride & { account: Address }) =>
      readContract<Address>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "getAccountOwner",
        args: [params.account]
      }),
    getSubaccounts: (params: AccountCoreOverride & { rootAccount: Address }) =>
      readContract<readonly Address[]>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "getSubaccounts",
        args: [params.rootAccount]
      }),
    getSignerAuthorizationNonce: (params: AccountCoreOverride & { account: Address }) =>
      readContract<bigint>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "accountSignerAuthorizationNonces",
        args: [params.account]
      }),
    isAuthorizedAccountSigner: (
      params: AccountCoreOverride & { account: Address; signer: Address; permission: number }
    ) =>
      readContract<boolean>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "isAuthorizedAccountSigner",
        args: [params.account, params.signer, params.permission]
      }),
    getBuilderApproval: (
      params: AccountCoreOverride & { rootAccount: Address; builder: Address }
    ) =>
      readContract(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "getBuilderApproval",
        args: [params.rootAccount, params.builder]
      }),
    getClaimableBuilderFees: (params: AccountCoreOverride & { builder: Address; asset: Address }) =>
      readContract<bigint>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "getClaimableBuilderFees",
        args: [params.builder, params.asset]
      }),
    getPostFillHookAccess: (params: AccountCoreOverride & { accountId: bigint }) =>
      readContract<boolean>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "postFillHookAccess",
        args: [params.accountId]
      }),
    allowance: (params: { token: Address; owner: Address; spender: Address }) =>
      readContract<bigint>(config, {
        address: params.token,
        abi: erc20MetadataAbi,
        functionName: "allowance",
        args: [params.owner, params.spender]
      }),

    deposit: (params: DepositParams) =>
      executeWrite({
        config,
        request: buildDepositRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: params
      }),
    depositForAccount: (params: DepositForAccountParams) =>
      executeWrite({
        config,
        request: buildDepositForAccountRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: simulateOnly(params)
      }),
    withdraw: (params: WithdrawParams) =>
      executeWrite({
        config,
        request: buildWithdrawRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: params
      }),
    withdrawFromAccount: (params: WithdrawFromAccountParams) =>
      executeWrite({
        config,
        request: buildWithdrawFromAccountRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: simulateOnly(params)
      }),
    transferBetweenAccounts: (params: TransferBetweenAccountsParams) =>
      executeWrite({
        config,
        request: buildTransferBetweenAccountsRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: params
      }),
    authorizeAccountSigner: (params: AuthorizeAccountSignerParams) =>
      executeWrite({
        config,
        request: buildAuthorizeAccountSignerRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: simulateOnly(params)
      }),
    authorizeAccountSignerBySig: (params: AuthorizeAccountSignerBySigParams) =>
      executeWrite({
        config,
        request: buildAuthorizeAccountSignerBySigRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: simulateOnly(params)
      }),
    revokeAccountSigner: (params: RevokeAccountSignerParams) =>
      executeWrite({
        config,
        request: buildRevokeAccountSignerRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: simulateOnly(params)
      }),
    revokeAccountSignerBySig: (params: RevokeAccountSignerBySigParams) =>
      executeWrite({
        config,
        request: buildRevokeAccountSignerBySigRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: simulateOnly(params)
      }),
    approveBuilder: (params: BuilderApprovalParams) =>
      executeWrite({
        config,
        request: buildApproveBuilderRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: params
      }),
    revokeBuilder: (params: BuilderAddressParams) =>
      executeWrite({
        config,
        request: buildRevokeBuilderRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: params
      }),
    claimBuilderFees: (params: ClaimBuilderFeesParams) =>
      executeWrite({
        config,
        request: buildClaimBuilderFeesRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: params
      }),
    setPostFillHookAccess: (params: SetPostFillHookAccessParams) =>
      executeWrite({
        config,
        request: buildSetPostFillHookAccessRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: params
      }),
    approveErc20: (params: Erc20AddressParams & WriteOverrides) =>
      executeWrite({
        config,
        request: buildApproveErc20Request(params),
        overrides: params
      })
  };
}
