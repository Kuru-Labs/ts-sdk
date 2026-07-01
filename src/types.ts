import type { Account, Address, Hex, PublicClient, WalletClient } from "viem";

export type { Account, Address, Hex, PublicClient, WalletClient };

export type WalletAccount = Account | Address;

export interface KuruContractAddresses {
  accountCore?: Address;
  spotRouter?: Address;
  spotEngine?: Address;
  spotPeriphery?: Address;
  intentExecutor?: Address;
}

export interface KuruClientConfig {
  publicClient: PublicClient;
  walletClient?: WalletClient;
  account?: WalletAccount;
  addresses?: KuruContractAddresses;
  simulateWrites?: boolean;
}

export interface WriteOverrides {
  account?: WalletAccount;
  simulate?: boolean;
}

export interface BuilderConfig {
  builder: Address;
  feePps: number;
}

export interface ClientOrderOptions {
  clientOrderId?: Hex;
}
