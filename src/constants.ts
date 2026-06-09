import { zeroAddress } from "viem";

import { contractMetadata } from "./generated";

export const NATIVE_TOKEN_ADDRESS = zeroAddress;
export const ZERO_BYTES32 = `0x${"00".repeat(32)}` as const;

export const CONTRACTS_COMMIT = contractMetadata.contractsCommit;

export const AccountPermission = {
  TRADE: 1 << 0,
  INTERNAL_TRANSFER: 1 << 2,
  WITHDRAW: 1 << 3,
  ADMIN: 1 << 4
} as const;

export type AccountPermissionName = keyof typeof AccountPermission;
