import type { Address, Hex } from "viem";

import type { WriteOverrides } from "../types";

export interface AccountCoreOverride {
  accountCore?: Address;
}

export interface AccountReadParams extends AccountCoreOverride {
  user: Address;
  token: Address;
}

export interface DepositParams extends AccountCoreOverride, WriteOverrides {
  token: Address;
  amount: bigint;
}

export interface DepositForAccountParams extends DepositParams {
  account: Address;
}

export interface WithdrawParams extends AccountCoreOverride, WriteOverrides {
  token: Address;
  amount: bigint;
}

export interface WithdrawFromAccountParams extends WithdrawParams {
  account: Address;
}

export interface TransferBetweenAccountsParams extends AccountCoreOverride, WriteOverrides {
  fromAccount: Address;
  toAccount: Address;
  token: Address;
  amount: bigint;
}

export interface AuthorizeAccountSignerParams extends AccountCoreOverride, WriteOverrides {
  account: Address;
  signer: Address;
  permissions: number;
  expiry: bigint;
}

export interface AuthorizeAccountSignerBySigParams extends AuthorizeAccountSignerParams {
  authorizer: Address;
  nonce: bigint;
  deadline: bigint;
  signature: Hex;
}

export interface BuilderApprovalParams extends AccountCoreOverride, WriteOverrides {
  builder: Address;
  maxFeePps: number;
  expiry: bigint;
}

export interface RevokeAccountSignerParams extends AccountCoreOverride, WriteOverrides {
  account: Address;
  signer: Address;
}

export interface RevokeAccountSignerBySigParams extends RevokeAccountSignerParams {
  authorizer: Address;
  nonce: bigint;
  deadline: bigint;
  signature: Hex;
}

export interface BuilderAddressParams extends AccountCoreOverride, WriteOverrides {
  builder: Address;
}

export interface ClaimBuilderFeesParams extends AccountCoreOverride, WriteOverrides {
  asset: Address;
}

export interface Erc20AddressParams extends WriteOverrides {
  token: Address;
  spender: Address;
  amount: bigint;
}
