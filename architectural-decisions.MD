# Architectural Decisions

## 2026-08-27: SDK Uses Committed Spot/Account ABIs Pinned To Contracts Main

**Status:** accepted

The SDK runtime uses committed ABI files under `src/generated` rather than generating from a sibling
contracts repo during install, build, typecheck, or test. Each sync pins
`contractMetadata.contractsCommit` to the exact contracts commit used to produce the ABIs.

This keeps GitHub and npm consumers self-contained and makes contract-surface drift explicit in SDK
review. The tradeoff is that ABI refreshes are a deliberate SDK maintenance step; local generated
artifacts in the contracts repo are not a source of truth unless committed into the SDK.

## 2026-08-27: Remove Legacy Intent Executor Surface

**Status:** accepted

The legacy `KuruIntentExecutor` module and `./intent` package subpath are removed from the SDK.
Current spot relay work is expected to use EIP-7702 delegated trading wallets later, and that flow
has a different EIP-712 signing domain and trust model from the executor contract.

This is a breaking SDK surface change, but the package is still private and pre-release. Keeping the
executor helpers would invite frontends to integrate a path the protocol is retiring.

## 2026-08-27: Defer Trading Wallet SDK Module Until Requested

**Status:** reverted on 2026-08-28 by the decision below

The latest contracts include `KuruTradingWallet`, but this sync does not expose it. The current goal
is to bring account, spot, periphery, ABIs, and event decoders to latest main while avoiding a
partially designed Mera/relay API.

The tradeoff is that the generated ABI allowlist intentionally omits a production contract. That
omission is temporary and should be revisited when the EIP-7702/Mera SDK surface is implemented.
The decision was reverted after the wallet and relay signing surface was explicitly requested and
its trust, nonce, and transport boundaries were specified.

## 2026-08-28: Isolate KuruTradingWallet Signing From Relay Transport

**Status:** accepted

The SDK exposes `@kuru-labs/ts-sdk/trading-wallet` as a pure module for KuruTradingWallet EIP-712
intent preparation/signing and EIP-7702 authorization. Relay authentication and request submission
remain a separate module.

Order preparation, hashing, and local signing never query chain state. Callers supply all domain,
nonce, deadline, account, market, and binding values. The only optional state lookup is the EOA
transaction nonce needed during one-time EIP-7702 onboarding: when the authority nonce is absent,
the caller must inject a public client or nonce resolver and the SDK reads it once using the pending
block tag.

The wallet EIP-712 verifying contract is always the wallet EOA because delegated code runs in the
EOA's address and storage context. It is never the KuruTradingWallet implementation address.
AccountCore signer authorization remains a distinct EIP-712 domain and nonce lifecycle.

## 2026-08-28: Keep Relay Authentication Explicit And Submission Replay-Free

**Status:** accepted

The SDK exposes `@kuru-labs/ts-sdk/relay` independently from the chain client and trading-wallet
signing module. Relay authentication is an explicit challenge/sign/token exchange. The SDK signs the
exact server challenge, while the Relay service verifies admission and issues the JWT; the SDK never
mints or signs JWTs.

The latency-sensitive submission path accepts a ready token and pre-signed payload. It performs one
HTTP request, no chain RPC, no wallet signing, and no implicit authentication or token refresh. A
caller may inject a token provider explicitly. State-changing requests are never automatically
retried, including ambiguous broadcasts, because durable idempotency is not provided by the Relay.

Request builders serialize every integer as a canonical decimal string and model only the six public
typed methods. The public raw `submit` boundary revalidates and canonicalizes the complete envelope
so JavaScript and JSON-restored queued requests cannot bypass builder validation. A broadcast or
non-null failure response must carry the submitted request ID; mismatches fail closed as malformed
responses before transaction metadata reaches the caller. WebSocket support remains a separately
tracked future module.

## 2026-08-29: Require The Target Chain In Runnable Relay Examples

**Status:** accepted

Runnable Relay examples require an explicit `KURU_CHAIN_ID` instead of coupling a testnet Relay URL
to a hardcoded chain. The chain ID is part of both trading-wallet EIP-712 domains and EIP-7702
authorizations, so an incorrect default creates signatures that are invalid for the intended
deployment.

The testnet command documents `10143`, while callers targeting other deployments supply their own
chain ID. The Relay URL retains its testnet convenience default; callers remain responsible for
pointing it at a Relay serving the explicitly selected chain.
