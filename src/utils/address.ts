import type { Address } from "viem";

import type { KuruContractAddresses } from "../types";
import { KuruSdkError } from "../errors";

export type AddressKey = keyof KuruContractAddresses;

export function requireConfiguredAddress(
  addresses: KuruContractAddresses | undefined,
  key: AddressKey,
  override?: Address
): Address {
  const value = override ?? addresses?.[key];
  if (!value) {
    throw new KuruSdkError("ADDRESS_REQUIRED", `Missing required contract address: ${key}.`);
  }
  return value;
}
