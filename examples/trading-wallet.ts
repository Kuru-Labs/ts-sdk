import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { encodePackedCancelOp } from "../src/spot";
import {
  createLocalAccountAuthorizationSigner,
  createLocalAccountWalletIntentSigner,
  prepareReplaceBySlotIntent,
  signEip7702Authorization,
  signPreparedWalletIntent
} from "../src/trading-wallet";

const rpcUrl = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
const delegate = process.env.KURU_TRADING_WALLET_DELEGATE as `0x${string}`;

const wallet = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ transport: http(rpcUrl) });

// Onboarding may resolve the authority nonce once. Pass `nonce` explicitly to avoid this RPC.
export const authorization = await signEip7702Authorization({
  authority: wallet.address,
  chainId: 10143,
  delegate,
  publicClient,
  signer: createLocalAccountAuthorizationSigner(wallet)
});

// The order path below performs no chain RPC.
const prepared = prepareReplaceBySlotIntent({
  wallet: wallet.address,
  chainId: 10143,
  header: {
    accountId: 1n,
    market: "0x1111111111111111111111111111111111111111",
    authNonce: 0n,
    nonce: BigInt(Date.now()),
    deadline: BigInt(Math.floor(Date.now() / 1000) + 30),
    clientOrderId: `0x${"11".repeat(32)}`
  },
  packedOps: encodePackedCancelOp(0),
  expectedOrderIds: [(1n << 64n) - 1n]
});

export const signedIntent = await signPreparedWalletIntent(
  prepared,
  createLocalAccountWalletIntentSigner(wallet)
);
