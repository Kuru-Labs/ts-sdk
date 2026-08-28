import type { Address, Hex } from "viem";

import type { RelayFailureResponse } from "./types";

export type KuruRelayErrorKind =
  | "INPUT"
  | "AUTHENTICATION"
  | "HTTP"
  | "TRANSPORT"
  | "TIMEOUT"
  | "CANCELLED"
  | "RELAY_REJECTION"
  | "MALFORMED_RESPONSE";

export interface KuruRelayErrorOptions {
  readonly code: string;
  readonly httpStatus?: number;
  readonly retryable?: boolean;
  readonly retryAfterMs?: number | null;
  readonly response?: RelayFailureResponse;
}

/** A redacted relay-client failure. Signed payloads and credentials are never included. */
export class KuruRelayError extends Error {
  readonly kind: KuruRelayErrorKind;
  readonly code: string;
  readonly httpStatus: number | undefined;
  readonly retryable?: boolean;
  readonly retryAfterMs?: number | null;
  readonly requestId?: string | null;
  readonly candidateTxHash?: Hex | null;
  readonly sponsorAddress?: Address | null;
  readonly sponsorNonce?: string | null;
  readonly response: RelayFailureResponse | undefined;

  constructor(kind: KuruRelayErrorKind, message: string, options: KuruRelayErrorOptions) {
    super(message);
    this.name = "KuruRelayError";
    this.kind = kind;
    this.code = options.code;
    this.httpStatus = options.httpStatus;
    this.response = options.response;
    if (options.retryable !== undefined) this.retryable = options.retryable;
    if (options.retryAfterMs !== undefined) this.retryAfterMs = options.retryAfterMs;
    if (options.response) {
      this.retryable = options.response.retryable;
      this.retryAfterMs = options.response.retryAfterMs;
      this.requestId = options.response.requestId;
      this.candidateTxHash = options.response.candidateTxHash;
      this.sponsorAddress = options.response.sponsorAddress;
      this.sponsorNonce = options.response.sponsorNonce;
    }
  }
}

export function relayInputError(code: string, message: string): KuruRelayError {
  return new KuruRelayError("INPUT", message, { code });
}
