# Kuru TypeScript SDK

Viem-first TypeScript SDK for the current Kuru spot/account/intent contracts.

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
`393d122c40c70372373448a42612183d98fc3b34`. The spot market artifact is now `OrderBook`;
`spotOrderBookAbi` remains exported as a compatibility alias.

## Current Contract Shape

- Builder fees are expressed as PPS (`feePps`, `builderFeePps`), matching the contracts.
- Spot `swap` and `estimateSwap` no longer take `limitPrice`.
- Intent typed data includes `authNonce` and `expectedOrderIdsHash`, and execute helpers pass
  `expectedOrderIds` through to `KuruIntentExecutor`.
