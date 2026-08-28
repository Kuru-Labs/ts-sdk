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

Legacy intent executor helpers are intentionally not exposed. EIP-7702 wallet authorization and
KuruTradingWallet EIP-712 signing live in the pure `trading-wallet` module. Relay authentication and
HTTP/WebSocket transport belong in separate relay modules so signing can be used without a network
client.

The latency-sensitive wallet-intent path never resolves state. Chain ID, wallet, account ID,
AccountCore authorization epoch, intent nonce, deadline, client order ID, bindings, and order data
are all explicit. Local signing therefore performs zero RPC calls. A browser or hosted wallet may
use its own signing transport, but that transport is not used to discover chain state.

EIP-7702 authorization is onboarding rather than order flow. Its authority nonce is optional:
callers can supply a cached/known nonce for a pure path, or inject a public client/nonce resolver for
one pending-nonce lookup. No other trading-wallet helper performs that lookup.

The SDK does not fetch or generate ABIs at install, test, typecheck, or build time. Consumers cloning
the SDK from GitHub use the committed `src/generated` files.

The committed contracts metadata pins the ABI source commit. When contracts main changes, refresh
`src/generated`, then update pure request builders and typed-data helpers to match the new ABI
signatures before shipping the SDK.
