import { keccak256, stringToHex, type Hex } from "viem";

import { ZERO_BYTES32 } from "../constants";

export function emptyClientOrderId(): Hex {
  return ZERO_BYTES32;
}

export function clientOrderIdFromString(value: string): Hex {
  return keccak256(stringToHex(value));
}

export function normalizeClientOrderId(value?: Hex): Hex {
  return value ?? ZERO_BYTES32;
}
