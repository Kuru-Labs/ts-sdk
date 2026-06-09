# SDK Architecture

The SDK has three layers:

1. Committed generated ABIs and metadata from the pinned contracts checkout.
2. Pure request, encoding, decoding, and typed-data helpers.
3. Viem-backed clients that read, simulate, and write using caller-provided public and wallet clients.

The public SDK is intentionally framework-agnostic. Frontends can wrap it with wagmi or another wallet
adapter, while bots and services can use the same pure request builders with their own transaction
submission pipeline.

Perps are intentionally not exposed in v1. The `products` module exists so future product modules can
be added without reshaping the spot API.

The ABI generator is intentionally not part of normal build/test/typecheck scripts. Consumers cloning
the SDK from GitHub use the committed `src/generated` files; maintainers run `pnpm abi:generate` only
when intentionally updating the contract surface.
