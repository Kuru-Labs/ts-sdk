import type { Address } from "viem";

import { NATIVE_TOKEN_ADDRESS } from "../constants";
import { accountCoreAbi, erc20MetadataAbi, kuruTradingWalletAbi } from "../generated";
import type { KuruClientConfig, WriteOverrides } from "../types";
import { executeWrite, readContract, requireConfiguredAddress } from "../utils";
import {
  buildApproveBuilderRequest,
  buildApproveErc20Request,
  buildAuthorizeAccountSignerBySigRequest,
  buildAuthorizeAccountSignerRequest,
  buildCreateSubaccountRequest,
  buildCreateSubaccountBySigRequest,
  buildDepositToOwnerRequest,
  buildDepositRequest,
  buildRevokeAccountSignerBySigRequest,
  buildRevokeAccountSignerRequest,
  buildRevokeBuilderRequest,
  buildSetPostFillHookAccessRequest,
  buildTransferBetweenAccountsRequest,
  buildWithdrawRequest,
  encodeDepositCall,
  prepareDeposit,
  prepareTokenApproval
} from "./requests";
import type {
  AccountCoreOverride,
  AccountReadParams,
  AssetBalanceParams,
  AuthorizeAccountSignerBySigParams,
  AuthorizeAccountSignerParams,
  BuilderAddressParams,
  BuilderApprovalParams,
  CreateSubaccountParams,
  CreateSubaccountBySigParams,
  DelegationState,
  DelegationStateParams,
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
  TradingWalletNonceParams,
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
    buildDepositToOwnerRequest: (params: DepositToOwnerParams) =>
      buildDepositToOwnerRequest({
        ...params,
        accountCore: resolveAccountCore(config, params.accountCore)
      }),
    buildWithdrawRequest: (params: WithdrawParams) =>
      buildWithdrawRequest({
        ...params,
        accountCore: resolveAccountCore(config, params.accountCore)
      }),
    buildApproveErc20Request,
    encodeDepositCall: (params: DepositCallParams): EncodedDepositCall =>
      encodeDepositCall({ ...params, accountCore: resolveAccountCore(config) }),
    prepareTokenApproval: (
      params: PrepareTokenApprovalParams
    ): Promise<PreparedTransactionRequest> => prepareTokenApproval(config, params),
    prepareDeposit: (params: DepositCallParams): Promise<PreparedTransactionRequest> =>
      prepareDeposit(config, { ...params, accountCore: resolveAccountCore(config) }),
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
        args: [params.accountId, params.token]
      }),
    getAssetBalance: ({ owner, token }: AssetBalanceParams): Promise<bigint> =>
      token.toLowerCase() === NATIVE_TOKEN_ADDRESS
        ? config.publicClient.getBalance({ address: owner })
        : readContract<bigint>(config, {
            address: token,
            abi: erc20MetadataAbi,
            functionName: "balanceOf",
            args: [owner]
          }),
    getLastSeenOrderNonce: ({ wallet }: TradingWalletNonceParams): Promise<bigint> =>
      readContract<bigint>(config, {
        address: wallet,
        abi: kuruTradingWalletAbi,
        functionName: "lastSeenOrderNonce",
        args: []
      }),
    getDelegationState: async ({
      authority,
      delegate
    }: DelegationStateParams): Promise<DelegationState> => {
      const code = await config.publicClient.getCode({ address: authority });
      if (code?.toLowerCase() === `0xef0100${delegate.slice(2).toLowerCase()}`) {
        return { isDelegated: true };
      }
      const pendingNonce = await config.publicClient.getTransactionCount({
        address: authority,
        blockTag: "pending"
      });
      return { isDelegated: false, pendingNonce: BigInt(pendingNonce) };
    },
    getSpotReservedBalance: (params: AccountReadParams) =>
      readContract<bigint>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "getSpotReservedBalance",
        args: [params.accountId, params.token]
      }),
    getRootAccountId: (params: AccountCoreOverride & { rootOwner: Address }) =>
      readContract<number>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "rootAccountIdOf",
        args: [params.rootOwner]
      }).then(BigInt),
    getAccountOwner: (params: AccountCoreOverride & { accountId: bigint }) =>
      readContract<Address>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "getAccountOwner",
        args: [params.accountId]
      }),
    getSubaccounts: (params: AccountCoreOverride & { rootAccountId: bigint }) =>
      readContract<readonly number[]>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "getSubaccounts",
        args: [params.rootAccountId]
      }).then((ids) => ids.map(BigInt)),
    getSignerAuthorizationNonce: (params: AccountCoreOverride & { account: Address }) =>
      readContract<bigint>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "accountSignerAuthorizationNonces",
        args: [params.account]
      }),
    isAuthorizedAccountSignerById: (
      params: AccountCoreOverride & { accountId: bigint; signer: Address; permission: number }
    ) =>
      readContract<boolean>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "isAuthorizedAccountSignerById",
        args: [params.accountId, params.signer, params.permission]
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
    getAccountAuthorizationEpoch: (params: AccountCoreOverride & { accountId: bigint }) =>
      readContract<bigint>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "accountAuthorizationEpoch",
        args: [params.accountId]
      }),
    getAccountRootId: (params: AccountCoreOverride & { accountId: bigint }) =>
      readContract<number>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "getAccountRootId",
        args: [params.accountId]
      }).then(BigInt),
    getAccountSubaccountSeq: (params: AccountCoreOverride & { accountId: bigint }) =>
      readContract<number>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "getAccountSubaccountSeq",
        args: [params.accountId]
      }),
    getWithdrawalLimiter: (params: AccountCoreOverride = {}) =>
      readContract<Address>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "withdrawalLimiter",
        args: []
      }),
    getApprovedWithdrawalNonce: (params: AccountCoreOverride & { rootOwner: Address }) =>
      readContract<bigint>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "approvedWithdrawalNonces",
        args: [params.rootOwner]
      }),
    getWithdrawalAuthorityEpoch: (params: AccountCoreOverride = {}) =>
      readContract<bigint>(config, {
        address: resolveAccountCore(config, params.accountCore),
        abi: accountCoreAbi,
        functionName: "withdrawalAuthorityEpoch",
        args: []
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
    depositToOwner: (params: DepositToOwnerParams) =>
      executeWrite({
        config,
        request: buildDepositToOwnerRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: params
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
    createSubaccount: (params: CreateSubaccountParams) =>
      executeWrite({
        config,
        request: buildCreateSubaccountRequest({
          ...params,
          accountCore: resolveAccountCore(config, params.accountCore)
        }),
        overrides: params
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
    createSubaccountBySig: (params: CreateSubaccountBySigParams) =>
      executeWrite({
        config,
        request: buildCreateSubaccountBySigRequest({
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
