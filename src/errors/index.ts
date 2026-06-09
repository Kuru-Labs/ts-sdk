import { decodeErrorResult, type Abi, type Hex } from "viem";

import { kuruErrorAbi } from "../generated";

export type KuruSdkErrorCode =
  | "ADDRESS_REQUIRED"
  | "INVALID_BYTES_LENGTH"
  | "INVALID_UINT"
  | "MISSING_WALLET_CLIENT"
  | "CONTRACT_ERROR_DECODE_FAILED";

export class KuruSdkError extends Error {
  readonly code: KuruSdkErrorCode;
  readonly cause?: unknown;

  constructor(code: KuruSdkErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "KuruSdkError";
    this.code = code;
    this.cause = options?.cause;
  }
}

export interface DecodedContractError {
  errorName: string;
  args: readonly unknown[];
}

export function decodeKuruContractError(data: Hex, abi: Abi = kuruErrorAbi): DecodedContractError {
  try {
    const decoded = decodeErrorResult({ abi, data });
    return {
      errorName: decoded.errorName,
      args: decoded.args ?? []
    };
  } catch (cause) {
    throw new KuruSdkError("CONTRACT_ERROR_DECODE_FAILED", "Unable to decode contract error data.", {
      cause
    });
  }
}
