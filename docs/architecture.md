# SDK Architecture

The SDK has three layers:

1. Committed ABIs and contract metadata in `src/generated`.
2. Pure request, encoding, decoding, and typed-data helpers.
3. Viem-backed clients that read, simulate, and write using caller-provided public and wallet clients.

The public SDK is intentionally framework-agnostic. Frontends can wrap it with wagmi or another wallet
adapter, while bots and services can use the same pure request builders with their own transaction
submission pipeline.

Perps are intentionally not exposed in v1. The `products` module exists so future product modules can
be added without reshaping the spot API.

Legacy intent executor helpers are intentionally not exposed. Future EIP-7702 trading-wallet and
relay support should get its own module once that signing and submission flow is finalized.

The SDK does not fetch or generate ABIs at install, test, typecheck, or build time. Consumers cloning
the SDK from GitHub use the committed `src/generated` files.

The committed contracts metadata pins the ABI source commit. When contracts main changes, refresh
`src/generated`, then update pure request builders and typed-data helpers to match the new ABI
signatures before shipping the SDK.
