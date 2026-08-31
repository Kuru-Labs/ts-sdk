# Kuru Relay REST client

`@kuru-labs/ts-sdk/relay` authenticates a wallet with Kuru Relay and submits the six typed REST
methods supported by the service. It does not build or sign trading intents; use
`@kuru-labs/ts-sdk/trading-wallet` first, then pass the signed result to the relay client.

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
import { createKuruRelayClient, createLocalAccountRelaySigner } from "@kuru-labs/ts-sdk/relay";

const wallet = privateKeyToAccount(process.env.TRADING_WALLET_KEY as `0x${string}`);
const relay = createKuruRelayClient({
  baseUrl: "https://relay.testnet.kuru.io",
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
import { createWalletClientRelaySigner } from "@kuru-labs/ts-sdk/relay";

const relay = createKuruRelayClient({
  baseUrl: "https://relay.testnet.kuru.io",
  signer: createWalletClientRelaySigner(walletClient, tradingWalletAddress)
});
```

Authentication works with allowlisted and `allow-all` Relay deployments. Admission is always a
server decision; the SDK does not infer it from configuration.

## Submit a signed intent

```ts
import { encodePackedCancelOp } from "@kuru-labs/ts-sdk/spot";
import {
  createLocalAccountWalletIntentSigner,
  signReplaceBySlotIntent
} from "@kuru-labs/ts-sdk/trading-wallet";

const intent = await signReplaceBySlotIntent(
  {
    wallet: wallet.address,
    chainId: 10143,
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
value into a printed Relay request before submission. Each script prints the signature, request,
and response. Authentication also signs Relay's personal-message challenge. For a specific-market
batch order, set `KURU_MARKET`:

```bash
TRADING_WALLET_KEY=0x... \
KURU_ACCOUNT_ID=18 \
KURU_AUTH_NONCE=0 \
KURU_MARKET=0x... \
pnpm dlx tsx examples/relay/execute-batch.ts --side buy --price 2020 --size 1
```

The example files are:

- [`authenticate.ts`](../examples/relay/authenticate.ts) — prints a JWT for `RELAY_SIGNER_PRIVATE_KEY`.
- [`authorize-account-signer.ts`](../examples/relay/authorize-account-signer.ts)
- [`execute-replace-by-slot.ts`](../examples/relay/execute-replace-by-slot.ts)
- [`execute-batch.ts`](../examples/relay/execute-batch.ts)
- [`create-replace-trigger.ts`](../examples/relay/create-replace-trigger.ts)
- [`create-batch-trigger.ts`](../examples/relay/create-batch-trigger.ts)
- [`cancel-trigger.ts`](../examples/relay/cancel-trigger.ts)

To print a Relay JWT without placing an order:

```bash
RELAY_SIGNER_PRIVATE_KEY=0x... \
pnpm dlx tsx examples/relay/authenticate.ts
```

Treat this output as a secret. The JWT is bound to the signing wallet and expires at the time
reported by Relay.

Every signed trading-wallet example needs `TRADING_WALLET_KEY`, `KURU_ACCOUNT_ID`, and
`KURU_AUTH_NONCE`. The four order-creation examples also need `KURU_MARKET`. Supply `--price` and
`--size` to every order-producing example. Both are raw positive integers: `--price` uses the
market's `pricePrecision` and `--size` uses its `sizePrecision`; the examples do not fetch or
convert market precisions.

### CLI flags and environment variables

| Input                              | Required for                   | Meaning                                                                                                         |
| ---------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `RELAY_SIGNER_PRIVATE_KEY`         | `authenticate.ts`              | EOA private key used only to sign Relay's authentication challenge. The script prints the resulting JWT.        |
| `TRADING_WALLET_KEY`               | Signed trading-wallet examples | Delegated trading EOA private key. It signs intents and Relay authentication challenges.                        |
| `KURU_CHAIN_ID`                    | Optional                       | EIP-712 chain ID. Defaults to Monad testnet `10143`; set only when intentionally targeting another deployment.  |
| `KURU_RELAY_URL`                   | Optional                       | Relay base URL. Defaults to `https://relay.testnet.kuru.io`.                                                    |
| `KURU_ACCOUNT_ID`                  | Signed trading-wallet examples | Target AccountCore account ID, such as `18`. The trading wallet needs live `TRADE` permission for this account. |
| `KURU_AUTH_NONCE`                  | Signed trading-wallet examples | Current AccountCore authorization epoch for `KURU_ACCOUNT_ID`; `0` is valid only when it is the current epoch.  |
| `KURU_MARKET`                      | Order-producing examples       | OrderBook address for the target market.                                                                        |
| `--side buy\|sell`                 | Order-producing examples       | Order direction. Defaults to `buy` when omitted.                                                                |
| `--price VALUE`                    | Order-producing examples       | Positive raw price in the market's `pricePrecision`.                                                            |
| `--size VALUE`                     | Order-producing examples       | Positive raw base size in the market's `sizePrecision`.                                                         |
| `KURU_SLOT_INDEX`                  | Packed replacement examples    | Target maker slot; defaults to `0`.                                                                             |
| `KURU_EXPECTED_ORDER_ID`           | Packed replacement examples    | Current expected order ID for the target slot; defaults to `uint64.max`, requiring an empty slot.               |
| `KURU_TRIGGER_ID`                  | `cancel-trigger.ts`            | 32-byte trigger ID to cancel. This does not cancel an active maker order.                                       |
| `KURU_TRIGGER_CONDITION`           | Trigger-creation examples      | Protocol-encoded condition beginning with its four-byte schema. Its hash is signed and sent with the trigger.   |
| `KURU_TRIGGER_EXPIRY`              | Optional trigger creation      | Unix-second expiry. Defaults to one hour after the example starts.                                              |
| `ACCOUNT_OWNER_KEY`                | Signer authorization           | Account owner or live administrator private key; it signs the AccountCore permission grant.                     |
| `KURU_ACCOUNT_CORE`                | Signer authorization           | AccountCore address used as the AccountCore EIP-712 verifying contract.                                         |
| `KURU_TRADING_WALLET_DELEGATE`     | Signer authorization           | KuruTradingWallet implementation address used in the EIP-7702 authorization.                                    |
| `KURU_ACCOUNT_AUTHORIZATION_NONCE` | Signer authorization           | Current AccountCore signer-authorization nonce, distinct from `KURU_AUTH_NONCE`.                                |
| `KURU_AUTHORITY_NONCE`             | Signer authorization           | Current EIP-7702 authority nonce for `TRADING_WALLET_KEY`.                                                      |
| `KURU_SIGNER_PERMISSIONS`          | Optional signer authorization  | AccountCore permission bitmap; defaults to `1` (`TRADE`).                                                       |
| `KURU_SIGNER_EXPIRY`               | Optional signer authorization  | Unix-second permission expiry; defaults to 30 days after the example starts.                                    |

Method-specific inputs are:

| Example                       | Additional inputs                                                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authorize-account-signer.ts` | `ACCOUNT_OWNER_KEY`, `KURU_ACCOUNT_CORE`, `KURU_TRADING_WALLET_DELEGATE`, `KURU_ACCOUNT_AUTHORIZATION_NONCE`, `KURU_AUTHORITY_NONCE`                                 |
| `execute-replace-by-slot.ts`  | `--price`, `--size`; optional `--side`, `KURU_SLOT_INDEX`, and `KURU_EXPECTED_ORDER_ID`; the expected order defaults to `uint64.max`, meaning the slot must be empty |
| `execute-batch.ts`            | `--price`, `--size`; optional `--side`                                                                                                                               |
| `create-replace-trigger.ts`   | `--price`, `--size`, `KURU_TRIGGER_CONDITION`; optional `--side`, `KURU_TRIGGER_EXPIRY`, `KURU_SLOT_INDEX`, and `KURU_EXPECTED_ORDER_ID`                             |
| `create-batch-trigger.ts`     | `--price`, `--size`, `KURU_TRIGGER_CONDITION`; optional `--side`, `KURU_TRIGGER_EXPIRY`                                                                              |
| `cancel-trigger.ts`           | `KURU_TRIGGER_ID`                                                                                                                                                    |

`KURU_TRIGGER_CONDITION` is the protocol-defined encoded condition, including its four-byte schema
prefix. The example derives `conditionSchema` from that prefix and signs its `keccak256` hash so the
signed trading-wallet intent and Relay payload cannot diverge.

## Atomic 7702 and AccountCore onboarding

Pass the signed EIP-7702 authorization to the AccountCore request. The two signatures and nonces are
independent.

```ts
const authorization7702 = await signEip7702Authorization({
  authority: tradingWallet.address,
  chainId: 10143,
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
