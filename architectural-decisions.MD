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

**Status:** superseded by the 2026-08-28 decision below

The latest contracts include `KuruTradingWallet`, but this sync does not expose it. The current goal
is to bring account, spot, periphery, ABIs, and event decoders to latest main while avoiding a
partially designed Mera/relay API.

The tradeoff is that the generated ABI allowlist intentionally omits a production contract. That
omission is temporary and should be revisited when the EIP-7702/Mera SDK surface is implemented.

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
