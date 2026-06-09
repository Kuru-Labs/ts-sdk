import type { Abi, Address, Hash } from "viem";

import type { KuruClientConfig, WalletAccount, WriteOverrides } from "../types";
import { KuruSdkError } from "../errors";

export interface KuruContractRequest<
  TAbi extends Abi = Abi,
  TFunctionName extends string = string
> {
  address: Address;
  abi: TAbi;
  functionName: TFunctionName;
  args?: readonly unknown[];
  value?: bigint;
}

export interface ExecuteWriteParams<TAbi extends Abi = Abi> {
  config: Pick<KuruClientConfig, "publicClient" | "walletClient" | "account" | "simulateWrites">;
  request: KuruContractRequest<TAbi>;
  overrides?: WriteOverrides;
}

export async function executeWrite<TAbi extends Abi>({
  config,
  request,
  overrides
}: ExecuteWriteParams<TAbi>): Promise<Hash> {
  if (!config.walletClient) {
    throw new KuruSdkError(
      "MISSING_WALLET_CLIENT",
      "A walletClient is required to submit transactions."
    );
  }

  const account = overrides?.account ?? config.account;
  const simulate = overrides?.simulate ?? config.simulateWrites ?? true;
  const requestWithAccount = account ? { ...request, account } : request;

  if (simulate) {
    const simulation = await config.publicClient.simulateContract(requestWithAccount as any);
    return config.walletClient.writeContract({
      ...simulation.request,
      account: account ?? simulation.request.account
    } as any);
  }

  return config.walletClient.writeContract(requestWithAccount as any);
}

export async function readContract<T = unknown>(
  config: Pick<KuruClientConfig, "publicClient">,
  request: KuruContractRequest
): Promise<T> {
  return config.publicClient.readContract(request) as Promise<T>;
}

export function withValue<TAbi extends Abi>(
  request: KuruContractRequest<TAbi>,
  value: bigint
): KuruContractRequest<TAbi> {
  return value === 0n ? request : { ...request, value };
}

export function resolveWritableAccount(
  override: WalletAccount | undefined,
  fallback: WalletAccount | undefined
): WalletAccount | undefined {
  return override ?? fallback;
}
