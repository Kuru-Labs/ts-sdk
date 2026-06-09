import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { createKuruClient, encodePackedCancelOp } from "../src";

const rpcUrl = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const privateKey = process.env.PRIVATE_KEY as `0x${string}`;

const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({
  transport: http(rpcUrl)
});
const walletClient = createWalletClient({
  account,
  transport: http(rpcUrl)
});

const kuru = createKuruClient({
  publicClient,
  walletClient,
  account,
  addresses: {
    accountCore: "0x0000000000000000000000000000000000000000"
  }
});

const request = kuru.spot.buildReplaceBySlotPackedRequest({
  market: "0x0000000000000000000000000000000000000000",
  userId: 1n,
  packedOps: encodePackedCancelOp(0)
});

console.log(request);
