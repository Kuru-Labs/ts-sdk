# Kuru Relay REST client

`@toxicflow-labs/ts-sdk/relay` authenticates a wallet with Kuru Relay and submits the six typed REST
methods supported by the service. It does not build or sign trading intents; use
`@toxicflow-labs/ts-sdk/trading-wallet` first, then pass the signed result to the relay client.

WebSocket support is intentionally outside this module.

## Recommended flow

1. Prepare the user's trading wallet. This can be a secondary embedded/passkey wallet rather than
   the user's primary custody wallet.
2. During onboarding, sign an EIP-7702 authorization for the configured KuruTradingWallet delegate.
   Supplying the authority nonce is RPC-free; omitting it performs the trading-wallet module's one
   explicit pending-nonce lookup.
3. Sign the separate AccountCore authorization granting the trading wallet TRADE permission.
4. Authenticate the trading wallet with Relay. Relay returns a one-time challenge, the wallet signs
   the exact UTF-8 message with `personal_sign` semantics, and Relay verifies wallet admission before
   issuing its own JWT.
5. Cache the returned access token until `expiresAt`. Build and sign intents ahead of submission.
6. Submit a pre-signed request. With a valid token, this is exactly one REST request and performs no
   chain RPC, hidden signing, token refresh, or automatic retry.

The SDK never creates or signs a JWT. JWT signing keys belong to the Relay deployment.

## Authenticate

```ts
import { privateKeyToAccount } from "viem/accounts";
import { createKuruRelayClient, createLocalAccountRelaySigner } from "@toxicflow-labs/ts-sdk/relay";

const wallet = privateKeyToAccount(process.env.TRADING_WALLET_KEY as `0x${string}`);
const relay = createKuruRelayClient({
  baseUrl: "https://api.relay.testnet.kuru.io",
  signer: createLocalAccountRelaySigner(wallet),
  timeoutMs: 5_000
});

// POST /auth/challenge, one personal-message signature, then POST /auth/token.
// The returned token is retained by this client unless retainToken is false.
const session = await relay.authenticate();
console.log(session.wallet, session.expiresAt);
```

For an embedded or passkey wallet, adapt a Viem wallet client without adding chain-state reads:

```ts
import { createWalletClientRelaySigner } from "@toxicflow-labs/ts-sdk/relay";

const relay = createKuruRelayClient({
  baseUrl: "https://api.relay.testnet.kuru.io",
  signer: createWalletClientRelaySigner(walletClient, tradingWalletAddress)
});
```

Authentication works with allowlisted and `allow-all` Relay deployments. Admission is always a
server decision; the SDK does not infer it from configuration.

## Submit a signed intent

```ts
import { encodePackedCancelOp } from "@toxicflow-labs/ts-sdk/spot";
import {
  createLocalAccountWalletIntentSigner,
  signReplaceBySlotIntent
} from "@toxicflow-labs/ts-sdk/trading-wallet";

const intent = await signReplaceBySlotIntent(
  {
    wallet: wallet.address,
    chainId: 143,
    header: {
      accountId: 123n,
      market,
      authNonce,
      nonce: BigInt(Date.now()),
      deadline: BigInt(Math.floor(Date.now() / 1_000) + 30),
      clientOrderId
    },
    packedOps: encodePackedCancelOp(0),
    expectedOrderIds: [(1n << 64n) - 1n]
  },
  createLocalAccountWalletIntentSigner(wallet)
);

const result = await relay.executeReplaceBySlot({ intent });
console.log(result.txHash, result.transactionType);
```

`BROADCAST` means an RPC accepted the transaction. It does not mean the transaction was included or
executed successfully. Follow `txHash` through a chain client and verify the receipt and expected
events/postconditions.

The client also exposes `executeBatch`, `createReplaceTrigger`, `createBatchTrigger`,
`cancelTrigger`, and `authorizeAccountSigner`. Pure `build*RelayRequest` functions are available for
queueing, inspection, and deterministic tests.

## Complete runnable examples

The [`examples/relay`](../examples/relay) directory contains one signing-and-submission file for
each public Relay method. Every file creates the relevant signature first and passes the signed
value to the corresponding typed client method; authentication also signs Relay's personal-message
challenge. For example:

```bash
TRADING_WALLET_KEY=0x... \
KURU_CHAIN_ID=10143 \
KURU_MARKET=0x... \
pnpm dlx tsx examples/relay/execute-batch.ts
```

The example files are:

- [`authorize-account-signer.ts`](../examples/relay/authorize-account-signer.ts)
- [`execute-replace-by-slot.ts`](../examples/relay/execute-replace-by-slot.ts)
- [`execute-batch.ts`](../examples/relay/execute-batch.ts)
- [`create-replace-trigger.ts`](../examples/relay/create-replace-trigger.ts)
- [`create-batch-trigger.ts`](../examples/relay/create-batch-trigger.ts)
- [`cancel-trigger.ts`](../examples/relay/cancel-trigger.ts)

Every example needs `TRADING_WALLET_KEY` and an explicit `KURU_CHAIN_ID`. The four order-creation
examples also need `KURU_MARKET`. `KURU_RELAY_URL` defaults to the testnet Relay URL, while
`KURU_ACCOUNT_ID`, `KURU_AUTH_NONCE`, `KURU_ORDER_PRICE`, and `KURU_ORDER_QUANTITY` have illustrative
defaults. Replace those defaults with current values for the target account and market before
broadcasting.

Method-specific inputs are:

| Example                       | Additional inputs                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `authorize-account-signer.ts` | `ACCOUNT_OWNER_KEY`, `KURU_ACCOUNT_CORE`, `KURU_TRADING_WALLET_DELEGATE`, `KURU_ACCOUNT_AUTHORIZATION_NONCE`, `KURU_AUTHORITY_NONCE` |
| `execute-replace-by-slot.ts`  | Optional `KURU_SLOT_INDEX` and `KURU_EXPECTED_ORDER_ID`; the expected order defaults to `uint64.max`, meaning the slot must be empty |
| `execute-batch.ts`            | No additional inputs                                                                                                                 |
| `create-replace-trigger.ts`   | `KURU_TRIGGER_CONDITION`; optional `KURU_TRIGGER_EXPIRY`, `KURU_SLOT_INDEX`, and `KURU_EXPECTED_ORDER_ID`                            |
| `create-batch-trigger.ts`     | `KURU_TRIGGER_CONDITION`; optional `KURU_TRIGGER_EXPIRY`                                                                             |
| `cancel-trigger.ts`           | `KURU_TRIGGER_ID`                                                                                                                    |

`KURU_TRIGGER_CONDITION` is the protocol-defined encoded condition, including its four-byte schema
prefix. The example derives `conditionSchema` from that prefix and signs its `keccak256` hash so the
signed trading-wallet intent and Relay payload cannot diverge.

## Atomic 7702 and AccountCore onboarding

Pass the signed EIP-7702 authorization to the AccountCore request. The two signatures and nonces are
independent.

```ts
const authorization7702 = await signEip7702Authorization({
  authority: tradingWallet.address,
  chainId: 143,
  delegate: kuruTradingWalletImplementation,
  nonce: authorityNonce,
  signer: createLocalAccountAuthorizationSigner(tradingWallet)
});

await relay.authorizeAccountSigner({
  wallet: tradingWallet.address,
  authorization: signedAccountCoreAuthorization,
  authorization7702
});
```

After the receipt, verify both the EIP-7702 delegation indicator and the expected
`AccountSignerAuthorized` event. A reverted target call can still leave delegation installed.

## Errors, expiry, and cancellation

`KuruRelayError.kind` distinguishes `INPUT`, `AUTHENTICATION`, `HTTP`, `TRANSPORT`, `TIMEOUT`,
`CANCELLED`, `RELAY_REJECTION`, and `MALFORMED_RESPONSE`. Relay rejections expose safe metadata such
as `retryable`, `retryAfterMs`, `candidateTxHash`, `sponsorAddress`, and `sponsorNonce`.

```ts
try {
  await relay.executeBatch({ requestId, intent });
} catch (error) {
  if (error instanceof KuruRelayError && error.kind === "RELAY_REJECTION") {
    // UNKNOWN is deliberately non-retryable: reconcile candidateTxHash first.
    console.log(error.code, error.retryable, error.candidateTxHash);
  }
}
```

State-changing submissions are never automatically replayed. Reuse the same UUIDv7 request ID only
after the application has reconciled the previous outcome and consciously chosen to retry.

An injected `tokenProvider` is called when a request needs a token, but Relay authentication is never
started implicitly. Supplying a structured `RelayAccessToken` enables local expiry and wallet checks.
Caller cancellation and per-call timeouts are supported through `signal` and `timeoutMs`.
