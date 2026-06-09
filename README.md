# Kuru TypeScript SDK

Viem-first TypeScript SDK for the current Kuru spot/account/intent contracts.

This package is intentionally private while the public npm package name is finalized. The
generated contract surface is pinned to the contract checkout commit recorded in
`src/generated/metadata.ts`.

## Quick Start

```bash
pnpm install
pnpm generate
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

`pnpm generate` reads Foundry artifacts from `../kuru-contracts-perps/out` by default. Override
with `KURU_CONTRACTS_DIR=/path/to/contracts` when needed.
