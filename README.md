# Kuru TypeScript SDK

Viem-first TypeScript SDK for the current Kuru spot/account contracts.

This package is intentionally private while the public npm package name is finalized. The
contract ABI surface is committed in `src/generated`.

## Quick Start

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

```ts
import { createKuruClient, NATIVE_TOKEN_ADDRESS } from "@kuru-labs/ts-sdk";

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

The committed ABI surface is pinned to `kuru-contracts-perps` main commit
`e37bc3961c23e0bdb0ce23477cffc2b2482a1b72`. The spot market artifact is now `OrderBook`;
`spotOrderBookAbi` remains exported as a compatibility alias.

## Current Contract Shape

- Builder fees are expressed as PPS (`feePps`, `builderFeePps`), matching the contracts.
- Spot `swap` and `estimateSwap` no longer take `limitPrice`.
- Legacy intent executor helpers are not exposed. Account typed-data helpers cover current
  signer-authorization flows only.
