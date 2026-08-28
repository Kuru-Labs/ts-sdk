import { keccak256, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { buildAuthorizeAccountSignerTypedData } from "../src/account";
import {
  KuruRelayError,
  buildAuthorizeAccountSignerRelayRequest,
  buildCancelTriggerRelayRequest,
  buildCreateBatchTriggerRelayRequest,
  buildCreateReplaceTriggerRelayRequest,
  buildExecuteBatchRelayRequest,
  buildExecuteReplaceBySlotRelayRequest,
  createKuruRelayClient,
  createLocalAccountRelaySigner,
  createRelayRequestId,
  isRelayRequestId
} from "../src/relay";
import {
  createLocalAccountAuthorizationSigner,
  createLocalAccountWalletIntentSigner,
  signBatchIntent,
  signCancelTriggerIntent,
  signCreateBatchTriggerIntent,
  signCreateReplaceTriggerIntent,
  signEip7702Authorization,
  signReplaceBySlotIntent
} from "../src/trading-wallet";

const REQUEST_ID = "018f5ef2-88a1-7b41-a826-4b679010f87f";
const OTHER_REQUEST_ID = "018f5ef2-88a1-7b41-a826-4b679010f880";
const TX_HASH: Hex = `0x${"ab".repeat(32)}`;
const CLIENT_ORDER_ID: Hex = `0x${"11".repeat(32)}`;
const TRIGGER_ID: Hex = `0x${"22".repeat(32)}`;
const CONDITION = "0x00000001deadbeef" as Hex;
const CONDITION_HASH = keccak256(CONDITION);
const MARKET = "0x2222222222222222222222222222222222222222" as Address;
const DELEGATE = "0x4444444444444444444444444444444444444444" as Address;
const SPONSOR = "0x5555555555555555555555555555555555555555" as Address;
const CHALLENGE_ID = "0123456789abcdef0123456789abcdef";
const wallet = privateKeyToAccount(`0x${"01".repeat(32)}`);
const authorizer = privateKeyToAccount(`0x${"02".repeat(32)}`);
const intentSigner = createLocalAccountWalletIntentSigner(wallet);

const header = {
  accountId: 123n,
  market: MARKET,
  authNonce: 9n,
  nonce: 1_720_000_000_123n,
  deadline: 1_720_000_030n,
  clientOrderId: CLIENT_ORDER_ID
};

async function fixtures() {
  const packedOps = `0x${"00".repeat(31)}00` as Hex;
  const replace = await signReplaceBySlotIntent(
    { wallet: wallet.address, chainId: 143, header, packedOps, expectedOrderIds: [31n] },
    intentSigner
  );
  const batch = await signBatchIntent(
    {
      wallet: wallet.address,
      chainId: 143,
      header,
      orders: [
        {
          side: "BUY",
          quantity: 1_000_000n,
          price: 123_400n,
          tif: "GTC",
          executionInstruction: "POST_ONLY",
          minSizeAfterBlock: 0n
        }
      ],
      cancelSlotIdxs: [3],
      expectedOrderIds: [31n]
    },
    intentSigner
  );
  const createReplace = await signCreateReplaceTriggerIntent(
    {
      wallet: wallet.address,
      chainId: 143,
      header,
      packedOps,
      expectedOrderIds: [31n],
      triggerExpiry: 1_720_003_600n,
      conditionHash: CONDITION_HASH
    },
    intentSigner
  );
  const createBatch = await signCreateBatchTriggerIntent(
    {
      wallet: wallet.address,
      chainId: 143,
      header,
      orders: [],
      cancelSlotIdxs: [3],
      expectedOrderIds: [31n],
      triggerExpiry: 1_720_003_600n,
      conditionHash: CONDITION_HASH
    },
    intentSigner
  );
  const cancel = await signCancelTriggerIntent(
    {
      wallet: wallet.address,
      chainId: 143,
      accountId: 123n,
      authNonce: 9n,
      nonce: 1_720_000_000_124n,
      deadline: 1_720_000_030n,
      triggerId: TRIGGER_ID
    },
    intentSigner
  );
  const authorization7702 = await signEip7702Authorization({
    authority: wallet.address,
    chainId: 143,
    delegate: DELEGATE,
    nonce: 7n,
    signer: createLocalAccountAuthorizationSigner(wallet)
  });
  const accountAuthorizationSignature = await authorizer.signTypedData(
    buildAuthorizeAccountSignerTypedData({
      accountCore: "0x3333333333333333333333333333333333333333",
      chainId: 143,
      account: authorizer.address,
      authorizer: authorizer.address,
      signer: wallet.address,
      permissions: 1,
      expiry: 1_722_592_000n,
      nonce: 0n,
      deadline: 1_720_000_030n
    })
  );
  return {
    replace,
    batch,
    createReplace,
    createBatch,
    cancel,
    authorization7702,
    accountAuthorizationSignature
  };
}

describe("relay request serialization", () => {
  it("serializes each wallet method with canonical decimal strings", async () => {
    const values = await fixtures();
    const replace = buildExecuteReplaceBySlotRelayRequest({
      requestId: REQUEST_ID,
      intent: values.replace
    });
    expect(replace).toEqual({
      requestId: REQUEST_ID,
      method: "wallet.execute_replace_by_slot_packed",
      wallet: wallet.address.toLowerCase(),
      payload: {
        header: {
          accountId: "123",
          market: MARKET,
          authNonce: "9",
          nonce: "1720000000123",
          deadline: "1720000030",
          clientOrderId: CLIENT_ORDER_ID,
          builder: "0x0000000000000000000000000000000000000000",
          builderFeePps: "0"
        },
        packedOps: values.replace.packedOps,
        expectedOrderIds: ["31"],
        signature: values.replace.signature
      },
      authorization7702: null
    });

    const batch = buildExecuteBatchRelayRequest({
      requestId: REQUEST_ID,
      intent: values.batch,
      authorization7702: values.authorization7702
    });
    expect(batch.payload.orders).toEqual([
      {
        side: "BUY",
        quantity: "1000000",
        price: "123400",
        tif: "GTC",
        executionInstruction: "POST_ONLY",
        minSizeAfterBlock: "0"
      }
    ]);
    expect(batch.payload.cancelSlotIdxs).toEqual(["3"]);
    expect(batch.authorization7702).toEqual({
      authority: wallet.address.toLowerCase(),
      chainId: "143",
      delegate: DELEGATE,
      nonce: "7",
      yParity: String(values.authorization7702.yParity),
      r: values.authorization7702.r,
      s: values.authorization7702.s
    });

    const createReplace = buildCreateReplaceTriggerRelayRequest({
      requestId: REQUEST_ID,
      intent: values.createReplace,
      conditionSchema: 1,
      condition: CONDITION
    });
    expect(createReplace.payload).toMatchObject({
      triggerExpiry: "1720003600",
      conditionSchema: "1",
      condition: CONDITION,
      conditionHash: CONDITION_HASH,
      expectedOrderIds: ["31"]
    });

    const createBatch = buildCreateBatchTriggerRelayRequest({
      requestId: REQUEST_ID,
      intent: values.createBatch,
      conditionSchema: 1n,
      condition: CONDITION
    });
    expect(createBatch.payload).toMatchObject({
      triggerExpiry: "1720003600",
      conditionSchema: "1",
      orders: [],
      cancelSlotIdxs: ["3"],
      expectedOrderIds: ["31"]
    });

    const cancel = buildCancelTriggerRelayRequest({ requestId: REQUEST_ID, intent: values.cancel });
    expect(cancel.payload).toEqual({
      accountId: "123",
      authNonce: "9",
      nonce: "1720000000124",
      deadline: "1720000030",
      triggerId: TRIGGER_ID,
      signature: values.cancel.signature
    });
  });

  it("serializes AccountCore authorization without re-signing it", async () => {
    const values = await fixtures();
    const request = buildAuthorizeAccountSignerRelayRequest({
      requestId: REQUEST_ID,
      wallet: wallet.address,
      authorization7702: values.authorization7702,
      authorization: {
        account: authorizer.address,
        authorizer: authorizer.address,
        signer: wallet.address,
        permissions: 1,
        expiry: 1_722_592_000n,
        nonce: 0n,
        deadline: 1_720_000_030n,
        signature: values.accountAuthorizationSignature
      }
    });
    expect(request.method).toBe("account_core.authorize_account_signer_by_sig");
    expect(request.payload).toEqual({
      account: authorizer.address.toLowerCase(),
      authorizer: authorizer.address.toLowerCase(),
      signer: wallet.address.toLowerCase(),
      permissions: "1",
      expiry: "1722592000",
      nonce: "0",
      deadline: "1720000030",
      signature: values.accountAuthorizationSignature.toLowerCase()
    });
  });

  it("rejects incompatible wallet and condition inputs locally", async () => {
    const values = await fixtures();
    expect(() =>
      buildCreateReplaceTriggerRelayRequest({
        requestId: REQUEST_ID,
        intent: values.createReplace,
        conditionSchema: 2,
        condition: CONDITION
      })
    ).toThrowError(KuruRelayError);
    expect(() =>
      buildAuthorizeAccountSignerRelayRequest({
        requestId: REQUEST_ID,
        wallet: authorizer.address,
        authorization: {
          account: authorizer.address,
          authorizer: authorizer.address,
          signer: wallet.address,
          permissions: 1,
          expiry: 0n,
          nonce: 0n,
          deadline: 1n,
          signature: values.accountAuthorizationSignature
        }
      })
    ).toThrowError(/signer must equal/);
  });

  it("revalidates JSON-restored envelopes for every public method", async () => {
    const values = await fixtures();
    const accountAuthorization = buildAuthorizeAccountSignerRelayRequest({
      requestId: REQUEST_ID,
      wallet: wallet.address,
      authorization7702: values.authorization7702,
      authorization: {
        account: authorizer.address,
        authorizer: authorizer.address,
        signer: wallet.address,
        permissions: 1,
        expiry: 1_722_592_000n,
        nonce: 0n,
        deadline: 1_720_000_030n,
        signature: values.accountAuthorizationSignature
      }
    });
    const requests = [
      buildExecuteReplaceBySlotRelayRequest({ requestId: REQUEST_ID, intent: values.replace }),
      buildExecuteBatchRelayRequest({ requestId: REQUEST_ID, intent: values.batch }),
      buildCreateReplaceTriggerRelayRequest({
        requestId: REQUEST_ID,
        intent: values.createReplace,
        conditionSchema: 1,
        condition: CONDITION
      }),
      buildCreateBatchTriggerRelayRequest({
        requestId: REQUEST_ID,
        intent: values.createBatch,
        conditionSchema: 1,
        condition: CONDITION
      }),
      buildCancelTriggerRelayRequest({ requestId: REQUEST_ID, intent: values.cancel }),
      accountAuthorization
    ];
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(broadcast()))) as typeof fetch;
    const client = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: fetchMock,
      accessToken: "token"
    });

    for (const request of requests) {
      await expect(client.submit(JSON.parse(JSON.stringify(request)))).resolves.toMatchObject({
        requestId: REQUEST_ID,
        status: "BROADCAST"
      });
    }
    expect(fetchMock).toHaveBeenCalledTimes(requests.length);
  });
});

describe("relay authentication and submission", () => {
  it("rejects malformed raw envelopes before transport", async () => {
    const values = await fixtures();
    const request = buildExecuteReplaceBySlotRelayRequest({
      requestId: REQUEST_ID,
      intent: values.replace
    });
    const fetchMock = vi.fn() as unknown as typeof fetch;
    const client = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: fetchMock,
      accessToken: "token"
    });

    const submitMalformed = (value: unknown) =>
      client.submit(value as Parameters<typeof client.submit>[0]);
    await expect(
      submitMalformed({ ...request, method: "not.a.relay.method" })
    ).rejects.toMatchObject({ kind: "INPUT", code: "INVALID_RELAY_METHOD" });
    await expect(submitMalformed({ ...request, wallet: "not-an-address" })).rejects.toMatchObject({
      kind: "INPUT"
    });
    await expect(submitMalformed({ ...request, payload: {} })).rejects.toMatchObject({
      kind: "INPUT"
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects broadcast and failure responses correlated to another request", async () => {
    const values = await fixtures();
    const request = buildExecuteReplaceBySlotRelayRequest({
      requestId: REQUEST_ID,
      intent: values.replace
    });
    const broadcastClient = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: vi.fn(() => Promise.resolve(jsonResponse(broadcast(OTHER_REQUEST_ID)))),
      accessToken: "token"
    });
    await expect(broadcastClient.submit(request)).rejects.toMatchObject({
      kind: "MALFORMED_RESPONSE",
      code: "RESPONSE_REQUEST_ID_MISMATCH"
    });

    const failureClient = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            {
              requestId: OTHER_REQUEST_ID,
              status: "UNKNOWN",
              code: "BROADCAST_RESULT_UNKNOWN",
              message: "broadcast result is unknown",
              retryable: false,
              retryAfterMs: null,
              candidateTxHash: TX_HASH,
              sponsorAddress: SPONSOR,
              sponsorNonce: "81"
            },
            503
          )
        )
      ),
      accessToken: "token"
    });
    await expect(failureClient.submit(request)).rejects.toMatchObject({
      kind: "MALFORMED_RESPONSE",
      code: "RESPONSE_REQUEST_ID_MISMATCH"
    });
  });

  it("signs the exact challenge, exchanges only ID/signature, and retains the relay JWT", async () => {
    const values = await fixtures();
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const challengeMessage = "api.relay.testnet.kuru.io wants you to sign in\nexact bytes";
    const challengeSignature = await wallet.signMessage({ message: challengeMessage });
    const fetchMock = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const requestedUrl = typeof url === "string" ? url : url instanceof URL ? url.href : url.url;
      calls.push({ url: requestedUrl, init: init ?? {} });
      if (requestedUrl.endsWith("/auth/challenge")) {
        return Promise.resolve(
          jsonResponse({
            challengeId: CHALLENGE_ID,
            message: challengeMessage,
            expiresAt: "2026-08-28T10:05:00.000Z"
          })
        );
      }
      if (requestedUrl.endsWith("/auth/token")) {
        return Promise.resolve(
          jsonResponse({
            accessToken: "header.payload.signature",
            tokenType: "Bearer",
            expiresAt: "2026-08-28T11:00:00.000Z",
            wallet: wallet.address
          })
        );
      }
      return Promise.resolve(jsonResponse(broadcast()));
    }) as typeof fetch;
    const signer = {
      address: wallet.address,
      signMessage: vi.fn((message: string) => {
        expect(message).toBe(challengeMessage);
        return Promise.resolve(challengeSignature);
      })
    };
    const client = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io/",
      fetch: fetchMock,
      signer,
      now: () => new Date("2026-08-28T10:00:00.000Z")
    });
    const token = await client.authenticate();
    expect(token.accessToken).toBe("header.payload.signature");
    expect(typeof calls[0]!.init.body).toBe("string");
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({
      wallet: wallet.address.toLowerCase()
    });
    expect(typeof calls[1]!.init.body).toBe("string");
    expect(JSON.parse(calls[1]!.init.body as string)).toEqual({
      challengeId: CHALLENGE_ID,
      signature: challengeSignature
    });

    await client.submit(
      buildExecuteReplaceBySlotRelayRequest({ requestId: REQUEST_ID, intent: values.replace })
    );
    expect((calls[2]!.init.headers as Record<string, string>).Authorization).toBe(
      "Bearer header.payload.signature"
    );
  });

  it("performs one HTTP request and no signing or state lookup on the hot path", async () => {
    const values = await fixtures();
    const fetchMock = vi.fn((_input: string | URL | Request, _init?: RequestInit) => {
      void _input;
      void _init;
      return Promise.resolve(jsonResponse(broadcast()));
    });
    const tokenProvider = vi.fn(() => "token");
    const requestIdSource = vi.fn(() => REQUEST_ID);
    const signMessage = vi.fn();
    const client = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: fetchMock,
      tokenProvider,
      requestIdSource,
      signer: { signMessage }
    });
    const result = await client.executeBatch({ intent: values.batch });
    expect(result.status).toBe("BROADCAST");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(tokenProvider).toHaveBeenCalledTimes(1);
    expect(requestIdSource).toHaveBeenCalledTimes(1);
    expect(signMessage).not.toHaveBeenCalled();
    const requestBody = fetchMock.mock.calls[0]?.[1]?.body;
    expect(typeof requestBody).toBe("string");
    expect(JSON.parse(requestBody as string).requestId).toBe(REQUEST_ID);
  });

  it("rejects stale challenges and malformed wallet signatures before token exchange", async () => {
    const staleFetch = vi.fn(() =>
      Promise.resolve(
        jsonResponse({
          challengeId: CHALLENGE_ID,
          message: "stale challenge",
          expiresAt: "2026-08-28T09:59:59.000Z"
        })
      )
    ) as typeof fetch;
    const staleClient = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: staleFetch,
      signer: createLocalAccountRelaySigner(wallet),
      now: () => new Date("2026-08-28T10:00:00.000Z")
    });
    await expect(staleClient.authenticate()).rejects.toMatchObject({
      kind: "AUTHENTICATION",
      code: "CHALLENGE_EXPIRED"
    });
    expect(staleFetch).toHaveBeenCalledTimes(1);

    const invalidFetch = vi.fn(() =>
      Promise.resolve(
        jsonResponse({
          challengeId: CHALLENGE_ID,
          message: "sign exactly this",
          expiresAt: "2026-08-28T10:05:00.000Z"
        })
      )
    ) as typeof fetch;
    const invalidClient = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: invalidFetch,
      signer: { address: wallet.address, signMessage: () => Promise.resolve("0x12") },
      now: () => new Date("2026-08-28T10:00:00.000Z")
    });
    await expect(invalidClient.authenticate()).rejects.toMatchObject({
      kind: "INPUT",
      code: "INVALID_CHALLENGE_SIGNATURE"
    });
    expect(invalidFetch).toHaveBeenCalledTimes(1);
  });

  it("surfaces denied admission as a typed authentication failure", async () => {
    let call = 0;
    const fetchMock = vi.fn(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve(
          jsonResponse({
            challengeId: CHALLENGE_ID,
            message: "sign this challenge",
            expiresAt: "2026-08-28T10:05:00.000Z"
          })
        );
      }
      return Promise.resolve(
        jsonResponse(
          { code: "AUTHENTICATION_FAILED", message: "authentication failed", retryable: false },
          401
        )
      );
    }) as typeof fetch;
    const client = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: fetchMock,
      signer: createLocalAccountRelaySigner(wallet),
      now: () => new Date("2026-08-28T10:00:00.000Z")
    });
    await expect(client.authenticate()).rejects.toMatchObject({
      kind: "AUTHENTICATION",
      code: "AUTHENTICATION_FAILED",
      retryable: false,
      httpStatus: 401
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry relay rejections and exposes safe retry metadata", async () => {
    const values = await fixtures();
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(
          {
            requestId: REQUEST_ID,
            status: "UNKNOWN",
            code: "BROADCAST_RESULT_UNKNOWN",
            message: "broadcast result is unknown",
            retryable: false,
            retryAfterMs: null,
            candidateTxHash: TX_HASH,
            sponsorAddress: SPONSOR,
            sponsorNonce: "81"
          },
          503
        )
      )
    ) as typeof fetch;
    const client = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: fetchMock,
      accessToken: "secret-token"
    });
    await expect(
      client.submit(
        buildExecuteReplaceBySlotRelayRequest({ requestId: REQUEST_ID, intent: values.replace })
      )
    ).rejects.toMatchObject({
      kind: "RELAY_REJECTION",
      code: "BROADCAST_RESULT_UNKNOWN",
      retryable: false,
      candidateTxHash: TX_HASH,
      sponsorNonce: "81"
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails closed for expired tokens before making a request", async () => {
    const values = await fixtures();
    const fetchMock = vi.fn() as unknown as typeof fetch;
    const client = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: fetchMock,
      accessToken: {
        accessToken: "secret-token",
        tokenType: "Bearer",
        expiresAt: new Date("2026-08-28T09:59:59.000Z"),
        wallet: wallet.address
      },
      now: () => new Date("2026-08-28T10:00:00.000Z")
    });
    await expect(
      client.executeReplaceBySlot({ requestId: REQUEST_ID, intent: values.replace })
    ).rejects.toMatchObject({ kind: "AUTHENTICATION", code: "ACCESS_TOKEN_EXPIRED" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("distinguishes timeout, cancellation, and malformed responses", async () => {
    const pendingFetch = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError"))
          );
        })
    ) as typeof fetch;
    const timeoutClient = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: pendingFetch,
      accessToken: "token",
      timeoutMs: 5
    });
    const values = await fixtures();
    const request = buildExecuteReplaceBySlotRelayRequest({
      requestId: REQUEST_ID,
      intent: values.replace
    });
    await expect(timeoutClient.submit(request)).rejects.toMatchObject({ kind: "TIMEOUT" });

    const controller = new AbortController();
    controller.abort();
    await expect(
      timeoutClient.submit(request, { signal: controller.signal })
    ).rejects.toMatchObject({
      kind: "CANCELLED"
    });

    const malformedClient = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: vi.fn(() => Promise.resolve(jsonResponse({ status: "BROADCAST" }))),
      accessToken: "token"
    });
    await expect(malformedClient.submit(request)).rejects.toMatchObject({
      kind: "MALFORMED_RESPONSE"
    });

    const httpClient = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: vi.fn(() => Promise.resolve(new Response("bad gateway", { status: 502 }))),
      accessToken: "token"
    });
    await expect(httpClient.submit(request)).rejects.toMatchObject({
      kind: "HTTP",
      code: "RELAY_HTTP_ERROR",
      httpStatus: 502
    });

    const transportClient = createKuruRelayClient({
      baseUrl: "https://api.relay.testnet.kuru.io",
      fetch: vi.fn(() => Promise.reject(new Error("secret-token and signed-payload"))),
      accessToken: "secret-token"
    });
    let transportError: unknown;
    try {
      await transportClient.submit(request);
    } catch (error) {
      transportError = error;
    }
    expect(transportError).toMatchObject({
      kind: "TRANSPORT",
      code: "RELAY_TRANSPORT_ERROR"
    });
    expect(JSON.stringify(transportError)).not.toContain("secret-token");
    expect(JSON.stringify(transportError)).not.toContain("signed-payload");
  });
});

describe("relay request IDs", () => {
  it("creates deterministic standards-compliant UUIDv7 values", () => {
    const requestId = createRelayRequestId(1_720_000_000_123, new Uint8Array(16).fill(0xab));
    expect(requestId).toBe("019077fd-307b-7bab-abab-abababababab");
    expect(isRelayRequestId(requestId)).toBe(true);
    expect(isRelayRequestId(requestId.toUpperCase())).toBe(false);
  });
});

function broadcast(requestId = REQUEST_ID) {
  return {
    requestId,
    status: "BROADCAST",
    txHash: TX_HASH,
    sponsorAddress: SPONSOR,
    sponsorNonce: "81",
    transactionType: "DYNAMIC_FEE"
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

describe("relay signer adapters", () => {
  it("adapts a local account without chain RPC", async () => {
    const signer = createLocalAccountRelaySigner(wallet);
    const signature = await signer.signMessage("hello relay");
    expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
    expect(signer.address).toBe(wallet.address.toLowerCase());
  });
});
