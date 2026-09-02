# Kuru TypeScript SDK

Viem-first TypeScript SDK for Kuru spot/account contracts and delegated trading wallets.

Releases are published to npm as
[`@toxicflow-labs/ts-sdk`](https://www.npmjs.com/package/@toxicflow-labs/ts-sdk). The contract ABI surface is
committed in `src/generated`.

## Quick Start

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

```ts
import { createKuruClient, NATIVE_TOKEN_ADDRESS } from "@toxicflow-labs/ts-sdk";

const kuru = createKuruClient({
  publicClient,
  walletClient,
  addresses: {
    accountCore: "0x..."
  }
});

const balance = await kuru.account.getBalance({
  user: "0x...",
  token: NATIVE_TOKEN_ADDRESS
});
```

## Contract Artifacts

The SDK is self-contained. Committed ABIs live in `src/generated/abis.ts` and are used by the
runtime, tests, and build. A GitHub checkout does not need any sibling contracts repository.

The committed ABI surface is pinned to `spot-contracts-v2` main commit
`e37bc3961c23e0bdb0ce23477cffc2b2482a1b72`. The spot market artifact is now `OrderBook`;
`spotOrderBookAbi` remains exported as a compatibility alias.

## Current Contract Shape

- Builder fees are expressed as PPS (`feePps`, `builderFeePps`), matching the contracts.
- Spot `swap` and `estimateSwap` no longer take `limitPrice`.
- Legacy intent executor helpers are not exposed. EIP-7702 trading uses the dedicated
  `@toxicflow-labs/ts-sdk/trading-wallet` module.

## Delegated Trading Wallets

The trading-wallet module is deliberately split from relay transport. It builds, hashes, and signs
the five current `KuruTradingWallet` EIP-712 intents, and it can create the EIP-7702 authorization
that delegates a wallet EOA to the configured implementation.

```ts
import { privateKeyToAccount } from "viem/accounts";
import {
  createLocalAccountWalletIntentSigner,
  prepareReplaceBySlotIntent,
  signPreparedWalletIntent
} from "@toxicflow-labs/ts-sdk/trading-wallet";

const wallet = privateKeyToAccount("0x...");
const prepared = prepareReplaceBySlotIntent({
  wallet: wallet.address,
  chainId: 10143,
  header: {
    accountId: 123n,
    market: "0x...",
    authNonce: 9n,
    nonce: 1_720_000_000_123n,
    deadline: 1_720_000_030n,
    clientOrderId: "0x..."
  },
  packedOps: "0x...",
  expectedOrderIds: [31n]
});

const signed = await signPreparedWalletIntent(
  prepared,
  createLocalAccountWalletIntentSigner(wallet)
);
```

Preparing, hashing, and locally signing an order does not call an RPC. Every chain- and
transaction-specific input is caller supplied.

EIP-7702 onboarding accepts an optional authority nonce. Supplying it keeps authorization signing
RPC-free. If it is omitted, pass a public client or nonce resolver; the SDK reads the pending
authority nonce exactly once before signing.

```ts
import {
  createLocalAccountAuthorizationSigner,
  signEip7702Authorization
} from "@toxicflow-labs/ts-sdk/trading-wallet";

const authorization = await signEip7702Authorization({
  authority: wallet.address,
  chainId: 10143,
  delegate: "0x...",
  publicClient,
  signer: createLocalAccountAuthorizationSigner(wallet)
});
```

Do not use an authorization mode that treats the wallet as the outer transaction executor. The
relay sponsor submits the EIP-7702 transaction. AccountCore trading-rights authorization is a
separate signature and nonce domain exposed by `@toxicflow-labs/ts-sdk/account`.

Injected, passkey, and embedded-wallet integrations can use
`createWalletClientIntentSigner(walletClient, walletAddress)` for EIP-712 intents. If a provider
offers EIP-7702 through its own API, adapt that method to the small `Eip7702AuthorizationSigner`
interface. The interface receives the already-resolved chain, delegate, and nonce, so provider
adapters never need to perform hidden state discovery in the order path.

## Spot post-fill hooks

Post-fill hooks are configured per maker and market. Governance must first grant protocol-wide
access on AccountCore; the maker can then register or clear its hook on each Spot order book.

```ts
import { zeroAddress } from "viem";
import { packPostFillQuote, packPostFillRequotePair } from "@toxicflow-labs/ts-sdk/spot";

await kuru.account.setPostFillHookAccess({ accountId: 18n, allowed: true }); // governance only
await kuru.spot.setPostFillHook({ market, userId: 18n, hook });

const configuredHook = await kuru.spot.getPostFillHook({ market, userId: 18n });
const header = packPostFillRequotePair(1, expectedOrderId);
const replenishWord = packPostFillQuote(price, size, minSizeAfterBlock);

// A maker clears its market hook by setting the zero address.
await kuru.spot.setPostFillHook({ market, userId: 18n, hook: zeroAddress });
```

`getPostFillHookGasLimit` and `getPostFillHookMinQuoteNotional` expose the per-market execution
bounds. Their corresponding setters, and `account.setPostFillHookAccess`, are governance-only. The
Spot module also exports `postFillHookAbi` plus helpers for `NOOP`, `REQUOTE_PAIR`,
`REPLENISH_ONLY`, and `REPLACE_ONLY` response plans.

## Relay REST client

`@toxicflow-labs/ts-sdk/relay` authenticates a trading wallet and submits the six typed public Relay REST
methods. It deliberately consumes signed wallet/AccountCore payloads instead of duplicating their
signing logic.

```ts
import { createKuruRelayClient, createLocalAccountRelaySigner } from "@toxicflow-labs/ts-sdk/relay";

const relay = createKuruRelayClient({
  baseUrl: "https://relay.testnet.kuru.io",
  signer: createLocalAccountRelaySigner(wallet)
});

const session = await relay.authenticate(); // Relay issues and signs this JWT.
const result = await relay.executeReplaceBySlot({ intent: signedIntent });
```

Authentication and 7702 onboarding stay outside the hot order path. With a supplied valid token and
pre-signed intent, submission performs one REST call, no chain RPC, no hidden signing or refresh, and
no automatic retry. `BROADCAST` is RPC acceptance, not execution success; follow the transaction
receipt separately. See [the Relay client guide](docs/relay.md) for onboarding, browser adapters,
errors, expiry, and cancellation.

## Exchange WebSocket data

`@kuru-labs/ts-sdk/exchange-ws` strictly decodes the Exchange Gateway's `KXMD` binary data frames
into typed `bigint`-safe objects. It supports L2 books and deltas, trades, BBO, all mids, lifecycle
controls, and all user order, balance, and trade frames. Every wire-version-1 result includes the
`feedEpoch` that namespaces its market or user sequence cursor.
User-order snapshots expose complete `orders`; deltas expose causal `created`, `trade`,
`cancelled`, and `rab-reduced` events with source positions and physical `slotIdx` values.

```ts
import { decodeExchangeWsMessage } from "@kuru-labs/ts-sdk/exchange-ws";

socket.binaryType = "arraybuffer";
socket.onmessage = async ({ data }) => {
  if (typeof data !== "string") {
    const frame = await decodeExchangeWsMessage(data);
    console.log(frame.kind, frame.view);
  }
};
```

See [the Exchange WebSocket decoder guide](docs/exchange-ws.md) for numeric units, topic-specific
helpers, lifecycle handling, and validation behavior.
