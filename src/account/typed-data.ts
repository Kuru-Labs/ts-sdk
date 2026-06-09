import type { Address, Hex, TypedDataDomain } from "viem";

export interface AuthorizeAccountSignerTypedDataParams {
  accountCore: Address;
  chainId: number;
  account: Address;
  signer: Address;
  permissions: number;
  expiry: bigint;
  nonce: bigint;
  deadline: bigint;
}

export interface CreateSubaccountTypedDataParams {
  accountCore: Address;
  chainId: number;
  root: Address;
  subaccount: Address;
  nonce: bigint;
  deadline: bigint;
}

export function accountCoreDomain(accountCore: Address, chainId: number): TypedDataDomain {
  return {
    name: "KuruAccountCore",
    version: "1",
    chainId,
    verifyingContract: accountCore
  };
}

export function buildAuthorizeAccountSignerTypedData(params: AuthorizeAccountSignerTypedDataParams) {
  return {
    domain: accountCoreDomain(params.accountCore, params.chainId),
    primaryType: "AuthorizeAccountSigner",
    types: {
      AuthorizeAccountSigner: [
        { name: "account", type: "address" },
        { name: "signer", type: "address" },
        { name: "permissions", type: "uint32" },
        { name: "expiry", type: "uint64" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    },
    message: {
      account: params.account,
      signer: params.signer,
      permissions: params.permissions,
      expiry: params.expiry,
      nonce: params.nonce,
      deadline: params.deadline
    }
  } as const;
}

export function buildCreateSubaccountTypedData(params: CreateSubaccountTypedDataParams) {
  return {
    domain: accountCoreDomain(params.accountCore, params.chainId),
    primaryType: "CreateSubaccount",
    types: {
      CreateSubaccount: [
        { name: "root", type: "address" },
        { name: "subaccount", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    },
    message: {
      root: params.root,
      subaccount: params.subaccount,
      nonce: params.nonce,
      deadline: params.deadline
    }
  } as const;
}

export function splitSignature(signature: Hex): { r: Hex; s: Hex; v: number } {
  if (signature.length !== 132) {
    throw new Error("Expected a 65-byte signature.");
  }

  const r = signature.slice(0, 66) as Hex;
  const s: Hex = `0x${signature.slice(66, 130)}`;
  const v = Number.parseInt(signature.slice(130, 132), 16);
  return { r, s, v };
}
