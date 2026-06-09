# Kuru TypeScript SDK

Viem-first TypeScript SDK for the current Kuru spot/account/intent contracts.

This package is intentionally private while the public npm package name is finalized. The
generated contract surface is pinned to the contract checkout commit recorded in
`src/generated/metadata.ts`.

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

The SDK is self-contained for consumers and normal contributors: committed ABIs live in
`src/generated/abis.ts` and are used by the runtime, tests, and build. You do not need a local
`kuru-contracts-perps` checkout to install, typecheck, test, or build the SDK from GitHub.

`pnpm abi:generate` is a maintainer workflow for refreshing committed ABIs. It reads Foundry artifacts
from `../kuru-contracts-perps/out` by default. Override with
`KURU_CONTRACTS_DIR=/path/to/contracts` when needed.
