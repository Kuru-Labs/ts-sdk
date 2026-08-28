import { isAddressEqual, isHex, size, type Address, type Hex } from "viem";

import { normalizeAddress, normalizeWalletSignature } from "../trading-wallet/validation";
import { signRelayChallenge, resolveRelayAuthenticationWallet } from "./auth";
import { KuruRelayError, relayInputError } from "./errors";
import {
  buildAuthorizeAccountSignerRelayRequest,
  buildCancelTriggerRelayRequest,
  buildCreateBatchTriggerRelayRequest,
  buildCreateReplaceTriggerRelayRequest,
  buildExecuteBatchRelayRequest,
  buildExecuteReplaceBySlotRelayRequest,
  validateRelayRequest
} from "./requests";
import { assertRelayRequestId, createRelayRequestId } from "./request-id";
import type {
  AnyRelayRequest,
  BuildAuthorizeAccountSignerRelayRequest,
  BuildCancelTriggerRelayRequest,
  BuildCreateBatchTriggerRelayRequest,
  BuildCreateReplaceTriggerRelayRequest,
  BuildExecuteBatchRelayRequest,
  BuildExecuteReplaceBySlotRelayRequest,
  KuruRelayClientConfig,
  RelayAccessToken,
  RelayAuthenticationFailureResponse,
  RelayAuthenticationOptions,
  RelayBroadcastResponse,
  RelayChallenge,
  RelayFailureResponse,
  RelayFetch,
  RelayRequestOptions,
  RelaySubmitBuilderParams,
  RelaySubmitOptions,
  RelayTokenValue
} from "./types";

const DEFAULT_TIMEOUT_MS = 10_000;

export function createKuruRelayClient(config: KuruRelayClientConfig) {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const fetchImplementation = config.fetch ?? globalThis.fetch;
  if (!fetchImplementation) {
    throw relayInputError("FETCH_REQUIRED", "A fetch implementation is required.");
  }
  const timeoutMs = normalizeTimeout(config.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const now = config.now ?? (() => new Date());
  const requestIdSource = config.requestIdSource ?? (() => createRelayRequestId(now().getTime()));
  let retainedToken = config.accessToken;

  const nextRequestId = () => assertRelayRequestId(requestIdSource());

  async function requestChallenge(
    walletInput: Address,
    options: RelayRequestOptions = {}
  ): Promise<RelayChallenge> {
    const wallet = normalizeAddress(walletInput, "wallet");
    const result = await requestJson(
      fetchImplementation,
      `${baseUrl}/auth/challenge`,
      { wallet },
      undefined,
      options,
      timeoutMs
    );
    if (!result.response.ok) {
      throw authenticationFailure(result.response.status, result.body);
    }
    const challenge = parseServerResponse(() => parseChallenge(result.body));
    if (challenge.expiresAt.getTime() <= now().getTime()) {
      throw new KuruRelayError("AUTHENTICATION", "The relay challenge has expired.", {
        code: "CHALLENGE_EXPIRED",
        httpStatus: result.response.status
      });
    }
    return challenge;
  }

  async function exchangeToken(
    challengeId: string,
    signatureInput: Hex,
    options: RelayRequestOptions = {}
  ): Promise<RelayAccessToken> {
    let signature: Hex;
    try {
      signature = normalizeWalletSignature(signatureInput);
    } catch {
      throw relayInputError(
        "INVALID_CHALLENGE_SIGNATURE",
        "The relay challenge signature must be canonical 65-byte ECDSA."
      );
    }
    const normalizedChallengeId = normalizeChallengeId(challengeId);
    const result = await requestJson(
      fetchImplementation,
      `${baseUrl}/auth/token`,
      { challengeId: normalizedChallengeId, signature },
      undefined,
      options,
      timeoutMs
    );
    if (!result.response.ok) {
      throw authenticationFailure(result.response.status, result.body);
    }
    return parseServerResponse(() => parseAccessToken(result.body));
  }

  async function authenticate(options: RelayAuthenticationOptions = {}): Promise<RelayAccessToken> {
    const signer = options.signer ?? config.signer;
    if (!signer) {
      throw relayInputError("SIGNER_REQUIRED", "A personal-message signer is required.");
    }
    const wallet = resolveRelayAuthenticationWallet(options.wallet, signer);
    const requestOptions = requestOptionsFrom(options);
    const challenge = await requestChallenge(wallet, requestOptions);
    const rawSignature = await signRelayChallenge(challenge.message, signer);
    if (challenge.expiresAt.getTime() <= now().getTime()) {
      throw new KuruRelayError("AUTHENTICATION", "The relay challenge expired before exchange.", {
        code: "CHALLENGE_EXPIRED"
      });
    }
    const token = await exchangeToken(challenge.challengeId, rawSignature, requestOptions);
    if (!isAddressEqual(token.wallet, wallet)) {
      throw new KuruRelayError("MALFORMED_RESPONSE", "Relay token wallet did not match.", {
        code: "TOKEN_WALLET_MISMATCH"
      });
    }
    if (options.retainToken !== false) retainedToken = token;
    return token;
  }

  async function submit(
    request: AnyRelayRequest,
    options: RelaySubmitOptions = {}
  ): Promise<RelayBroadcastResponse> {
    const validatedRequest = validateRelayRequest(request);
    const token = await resolveAccessToken(
      options.accessToken ?? retainedToken,
      config.tokenProvider,
      validatedRequest.wallet,
      now
    );
    const result = await requestJson(
      fetchImplementation,
      `${baseUrl}/relay`,
      validatedRequest,
      token,
      options,
      timeoutMs
    );
    if (!result.response.ok) {
      const rejection = parseServerResponse(() => parseFailureResponse(result.body));
      if (rejection) {
        assertResponseRequestId(rejection.requestId, validatedRequest.requestId);
        throw new KuruRelayError("RELAY_REJECTION", "The relay rejected the request.", {
          code: rejection.code,
          httpStatus: result.response.status,
          response: rejection
        });
      }
      throw new KuruRelayError("HTTP", "The relay returned an HTTP error.", {
        code: "RELAY_HTTP_ERROR",
        httpStatus: result.response.status
      });
    }
    const rejection = parseServerResponse(() => parseFailureResponse(result.body));
    if (rejection) {
      assertResponseRequestId(rejection.requestId, validatedRequest.requestId);
      throw new KuruRelayError("RELAY_REJECTION", "The relay rejected the request.", {
        code: rejection.code,
        httpStatus: result.response.status,
        response: rejection
      });
    }
    const broadcast = parseServerResponse(() => parseBroadcastResponse(result.body));
    assertResponseRequestId(broadcast.requestId, validatedRequest.requestId);
    return broadcast;
  }

  function withRequestId<T extends { readonly requestId?: string }>(parameters: T) {
    return { ...parameters, requestId: parameters.requestId ?? nextRequestId() };
  }

  return {
    requestChallenge,
    exchangeToken,
    authenticate,
    submit,
    createRequestId: nextRequestId,
    getAccessToken: () => retainedToken,
    setAccessToken: (token: RelayTokenValue | undefined) => {
      retainedToken = token;
    },
    clearAccessToken: () => {
      retainedToken = undefined;
    },
    executeReplaceBySlot: (
      parameters: RelaySubmitBuilderParams<BuildExecuteReplaceBySlotRelayRequest>,
      options?: RelaySubmitOptions
    ) => submit(buildExecuteReplaceBySlotRelayRequest(withRequestId(parameters)), options),
    executeBatch: (
      parameters: RelaySubmitBuilderParams<BuildExecuteBatchRelayRequest>,
      options?: RelaySubmitOptions
    ) => submit(buildExecuteBatchRelayRequest(withRequestId(parameters)), options),
    createReplaceTrigger: (
      parameters: RelaySubmitBuilderParams<BuildCreateReplaceTriggerRelayRequest>,
      options?: RelaySubmitOptions
    ) => submit(buildCreateReplaceTriggerRelayRequest(withRequestId(parameters)), options),
    createBatchTrigger: (
      parameters: RelaySubmitBuilderParams<BuildCreateBatchTriggerRelayRequest>,
      options?: RelaySubmitOptions
    ) => submit(buildCreateBatchTriggerRelayRequest(withRequestId(parameters)), options),
    cancelTrigger: (
      parameters: RelaySubmitBuilderParams<BuildCancelTriggerRelayRequest>,
      options?: RelaySubmitOptions
    ) => submit(buildCancelTriggerRelayRequest(withRequestId(parameters)), options),
    authorizeAccountSigner: (
      parameters: RelaySubmitBuilderParams<BuildAuthorizeAccountSignerRelayRequest>,
      options?: RelaySubmitOptions
    ) => submit(buildAuthorizeAccountSignerRelayRequest(withRequestId(parameters)), options)
  };
}

export type KuruRelayClient = ReturnType<typeof createKuruRelayClient>;

function normalizeBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw relayInputError("INVALID_BASE_URL", "Relay baseUrl must be an absolute URL.");
  }
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.search || url.hash) {
    throw relayInputError(
      "INVALID_BASE_URL",
      "Relay baseUrl must use HTTP(S) and must not contain a query or fragment."
    );
  }
  return url.toString().replace(/\/$/, "");
}

function normalizeTimeout(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 120_000) {
    throw relayInputError("INVALID_TIMEOUT", "timeoutMs must be between 1 and 120000.");
  }
  return value;
}

function requestOptionsFrom(options: RelayRequestOptions): RelayRequestOptions {
  const result: { signal?: AbortSignal; timeoutMs?: number } = {};
  if (options.signal) result.signal = options.signal;
  if (options.timeoutMs !== undefined) result.timeoutMs = options.timeoutMs;
  return result;
}

async function requestJson(
  fetchImplementation: RelayFetch,
  url: string,
  body: unknown,
  accessToken: string | undefined,
  options: RelayRequestOptions,
  defaultTimeoutMs: number
) {
  const timeoutMs = normalizeTimeout(options.timeoutMs ?? defaultTimeoutMs);
  if (options.signal?.aborted) {
    throw new KuruRelayError("CANCELLED", "The relay request was cancelled.", {
      code: "RELAY_CANCELLED"
    });
  }
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const cleanup = () => {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  };
  let encodedBody: string;
  try {
    encodedBody = JSON.stringify(body);
  } catch {
    cleanup();
    throw relayInputError("RELAY_SERIALIZATION_FAILED", "The relay request cannot be serialized.");
  }
  let response: Response;
  try {
    response = await fetchImplementation(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: encodedBody,
      signal: controller.signal
    });
  } catch {
    if (timedOut) {
      cleanup();
      throw new KuruRelayError("TIMEOUT", "The relay request timed out.", {
        code: "RELAY_TIMEOUT"
      });
    }
    if (options.signal?.aborted) {
      cleanup();
      throw new KuruRelayError("CANCELLED", "The relay request was cancelled.", {
        code: "RELAY_CANCELLED"
      });
    }
    cleanup();
    throw new KuruRelayError("TRANSPORT", "The relay request failed before a response.", {
      code: "RELAY_TRANSPORT_ERROR"
    });
  }
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    cleanup();
    if (timedOut) {
      throw new KuruRelayError("TIMEOUT", "The relay request timed out.", {
        code: "RELAY_TIMEOUT"
      });
    }
    if (options.signal?.aborted) {
      throw new KuruRelayError("CANCELLED", "The relay request was cancelled.", {
        code: "RELAY_CANCELLED"
      });
    }
    if (!response.ok) return { response, body: undefined };
    throw new KuruRelayError("MALFORMED_RESPONSE", "The relay returned invalid JSON.", {
      code: "INVALID_RELAY_RESPONSE",
      httpStatus: response.status
    });
  }
  cleanup();
  if (timedOut) {
    throw new KuruRelayError("TIMEOUT", "The relay request timed out.", {
      code: "RELAY_TIMEOUT"
    });
  }
  if (options.signal?.aborted) {
    throw new KuruRelayError("CANCELLED", "The relay request was cancelled.", {
      code: "RELAY_CANCELLED"
    });
  }
  return { response, body: parsed };
}

async function resolveAccessToken(
  direct: RelayTokenValue | undefined,
  provider: KuruRelayClientConfig["tokenProvider"],
  wallet: Address,
  now: () => Date
): Promise<string> {
  let value = direct;
  if (!value && provider) {
    try {
      value = await provider();
    } catch {
      throw new KuruRelayError("AUTHENTICATION", "The access-token provider failed.", {
        code: "TOKEN_PROVIDER_FAILED"
      });
    }
  }
  if (!value) {
    throw new KuruRelayError("AUTHENTICATION", "A relay access token is required.", {
      code: "ACCESS_TOKEN_REQUIRED"
    });
  }
  if (typeof value === "string") return normalizeToken(value);
  if (
    value.tokenType !== "Bearer" ||
    !Number.isFinite(value.expiresAt.getTime()) ||
    value.expiresAt.getTime() <= now().getTime()
  ) {
    throw new KuruRelayError("AUTHENTICATION", "The relay access token has expired.", {
      code: "ACCESS_TOKEN_EXPIRED"
    });
  }
  if (!isAddressEqual(normalizeAddress(value.wallet, "token.wallet"), wallet)) {
    throw new KuruRelayError("AUTHENTICATION", "The relay token belongs to another wallet.", {
      code: "ACCESS_TOKEN_WALLET_MISMATCH"
    });
  }
  return normalizeToken(value.accessToken);
}

function normalizeToken(value: string): string {
  if (!value || value.length > 16_384 || /\s/.test(value)) {
    throw new KuruRelayError("AUTHENTICATION", "The relay access token is invalid.", {
      code: "INVALID_ACCESS_TOKEN"
    });
  }
  return value;
}

function parseChallenge(value: unknown): RelayChallenge {
  const object = record(value);
  const challengeId = normalizeChallengeId(requiredString(object, "challengeId"), true);
  const message = requiredString(object, "message");
  const expiresAt = parseDate(requiredString(object, "expiresAt"), "challenge expiry");
  if (!message) malformed("INVALID_CHALLENGE_RESPONSE");
  return { challengeId, message, expiresAt };
}

function normalizeChallengeId(value: string, serverResponse = false): string {
  if (!/^[0-9a-f]{32}$/.test(value)) {
    if (serverResponse) malformed("INVALID_CHALLENGE_RESPONSE");
    throw relayInputError(
      "INVALID_CHALLENGE_ID",
      "challengeId must be 16 bytes of lowercase hexadecimal."
    );
  }
  return value;
}

function parseAccessToken(value: unknown): RelayAccessToken {
  const object = record(value);
  const accessToken = normalizeToken(requiredString(object, "accessToken"));
  if (object.tokenType !== "Bearer") malformed("INVALID_TOKEN_RESPONSE");
  const expiresAt = parseDate(requiredString(object, "expiresAt"), "token expiry");
  const wallet = normalizeAddress(requiredString(object, "wallet") as Address, "token.wallet");
  return { accessToken, tokenType: "Bearer", expiresAt, wallet };
}

function parseBroadcastResponse(value: unknown): RelayBroadcastResponse {
  const object = record(value);
  if (object.status !== "BROADCAST") malformed("INVALID_RELAY_RESPONSE");
  const transactionType = object.transactionType;
  if (transactionType !== "DYNAMIC_FEE" && transactionType !== "SET_CODE") {
    malformed("INVALID_RELAY_RESPONSE");
  }
  return {
    requestId: assertRelayRequestId(requiredString(object, "requestId")),
    status: "BROADCAST",
    txHash: fixedHex(requiredString(object, "txHash"), 32),
    sponsorAddress: normalizeAddress(
      requiredString(object, "sponsorAddress") as Address,
      "response.sponsorAddress"
    ),
    sponsorNonce: canonicalDecimal(requiredString(object, "sponsorNonce"), 64),
    transactionType
  };
}

function parseFailureResponse(value: unknown): RelayFailureResponse | undefined {
  let object: Record<string, unknown>;
  try {
    object = record(value);
  } catch {
    return undefined;
  }
  if (object.status !== "REJECTED" && object.status !== "UNKNOWN") return undefined;
  const retryAfterMs = nullableNumber(object.retryAfterMs, "retryAfterMs");
  if (retryAfterMs !== null && (!Number.isSafeInteger(retryAfterMs) || retryAfterMs < 0)) {
    malformed("INVALID_RELAY_FAILURE");
  }
  return {
    requestId:
      object.requestId === null ? null : assertRelayRequestId(requiredString(object, "requestId")),
    status: object.status,
    code: requiredString(object, "code"),
    message: requiredString(object, "message"),
    retryable: requiredBoolean(object, "retryable"),
    retryAfterMs,
    candidateTxHash:
      object.candidateTxHash === null
        ? null
        : fixedHex(requiredString(object, "candidateTxHash"), 32),
    sponsorAddress:
      object.sponsorAddress === null
        ? null
        : normalizeAddress(
            requiredString(object, "sponsorAddress") as Address,
            "response.sponsorAddress"
          ),
    sponsorNonce:
      object.sponsorNonce === null
        ? null
        : canonicalDecimal(requiredString(object, "sponsorNonce"), 64)
  };
}

function assertResponseRequestId(actual: string | null, expected: string): void {
  if (actual !== null && actual !== expected) {
    malformed("RESPONSE_REQUEST_ID_MISMATCH");
  }
}

function authenticationFailure(status: number, value: unknown): KuruRelayError {
  const parsed = parseAuthenticationFailure(value);
  return new KuruRelayError("AUTHENTICATION", "Relay authentication failed.", {
    code: parsed?.code ?? "AUTHENTICATION_HTTP_ERROR",
    httpStatus: status,
    ...(parsed ? { retryable: parsed.retryable } : {})
  });
}

function parseAuthenticationFailure(
  value: unknown
): RelayAuthenticationFailureResponse | undefined {
  try {
    const object = record(value);
    return {
      code: requiredString(object, "code"),
      message: requiredString(object, "message"),
      retryable: requiredBoolean(object, "retryable")
    };
  } catch {
    return undefined;
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) malformed("INVALID_JSON_OBJECT");
  return value as Record<string, unknown>;
}

function requiredString(object: Record<string, unknown>, field: string): string {
  const value = object[field];
  if (typeof value !== "string" || value.length === 0) malformed("INVALID_RELAY_RESPONSE");
  return value;
}

function requiredBoolean(object: Record<string, unknown>, field: string): boolean {
  const value = object[field];
  if (typeof value !== "boolean") malformed("INVALID_RELAY_RESPONSE");
  return value;
}

function nullableNumber(value: unknown, field: string): number | null {
  if (value === null) return null;
  if (typeof value !== "number") malformed(`INVALID_${field.toUpperCase()}`);
  return value;
}

function parseDate(value: string, field: string): Date {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()))
    malformed(`INVALID_${field.toUpperCase().replace(/ /g, "_")}`);
  return date;
}

function canonicalDecimal(value: string, bits: number): string {
  if (!/^(0|[1-9][0-9]*)$/.test(value)) malformed("INVALID_DECIMAL_RESPONSE");
  const parsed = BigInt(value);
  if (parsed >= 1n << BigInt(bits)) malformed("INVALID_DECIMAL_RESPONSE");
  return value;
}

function fixedHex(value: string, bytes: number): Hex {
  if (!isHex(value, { strict: true }) || size(value) !== bytes) malformed("INVALID_HEX_RESPONSE");
  return value.toLowerCase() as Hex;
}

function malformed(code: string): never {
  throw new KuruRelayError("MALFORMED_RESPONSE", "The relay response was malformed.", { code });
}

function parseServerResponse<T>(parser: () => T): T {
  try {
    return parser();
  } catch (cause) {
    if (cause instanceof KuruRelayError) throw cause;
    throw new KuruRelayError("MALFORMED_RESPONSE", "The relay response was malformed.", {
      code: "INVALID_RELAY_RESPONSE"
    });
  }
}
