import { privateKeyToAccount } from "viem/accounts";

import { createKuruRelayClient, createLocalAccountRelaySigner } from "../src/relay";
import { encodePackedCancelOp } from "../src/spot";
import {
  createLocalAccountWalletIntentSigner,
  signReplaceBySlotIntent
} from "../src/trading-wallet";

const wallet = privateKeyToAccount(process.env.TRADING_WALLET_KEY as `0x${string}`);
const relay = createKuruRelayClient({
  baseUrl: process.env.KURU_RELAY_URL ?? "https://api.relay.testnet.kuru.io",
  signer: createLocalAccountRelaySigner(wallet)
});

// Authentication is outside the trading hot path. Relay, not this SDK, issues the JWT.
export const session = await relay.authenticate();

const intent = await signReplaceBySlotIntent(
  {
    wallet: wallet.address,
    chainId: 143,
    header: {
      accountId: 1n,
      market: "0x1111111111111111111111111111111111111111",
      authNonce: 0n,
      nonce: BigInt(Date.now()),
      deadline: BigInt(Math.floor(Date.now() / 1_000) + 30),
      clientOrderId: `0x${"11".repeat(32)}`
    },
    packedOps: encodePackedCancelOp(0),
    expectedOrderIds: [(1n << 64n) - 1n]
  },
  createLocalAccountWalletIntentSigner(wallet)
);

// Exactly one HTTP request and no chain RPC when a valid token and signed intent are ready.
export const broadcast = await relay.executeReplaceBySlot({ intent });
