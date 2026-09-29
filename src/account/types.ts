import type { Address, Hex } from "viem";

import type { WriteOverrides } from "../types";

export interface AccountCoreOverride {
  accountCore?: Address;
}

export interface AccountReadParams extends AccountCoreOverride {
  accountId: bigint;
  token: Address;
}

export interface DepositParams extends AccountCoreOverride, WriteOverrides {
  rootAccountId: bigint;
  token: Address;
  amount: bigint;
}

export interface DepositToOwnerParams extends Omit<DepositParams, "rootAccountId"> {
  rootOwner: Address;
}

export interface WithdrawParams extends AccountCoreOverride, WriteOverrides {
  rootAccountId: bigint;
  recipient: Address;
  token: Address;
  amount: bigint;
}

export interface TransferBetweenAccountsParams extends AccountCoreOverride, WriteOverrides {
  fromAccountId: bigint;
  toAccountId: bigint;
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

export interface CreateSubaccountParams extends AccountCoreOverride, WriteOverrides {
  rootOwner: Address;
}

export interface CreateSubaccountBySigParams extends CreateSubaccountParams {
  authorizer: Address;
  subaccountSeq: number;
  authNonce: bigint;
  deadline: bigint;
  signature: Hex;
}

/** Governance-controlled protocol-wide post-fill-hook access for an account. */
export interface SetPostFillHookAccessParams extends AccountCoreOverride, WriteOverrides {
  accountId: bigint;
  allowed: boolean;
}

export interface Erc20AddressParams extends WriteOverrides {
  token: Address;
  spender: Address;
  amount: bigint;
}
