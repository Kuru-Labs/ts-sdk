import { createPublicClient, createWalletClient, custom, http } from "viem";

import { createKuruClient, NATIVE_TOKEN_ADDRESS } from "../src";

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

const publicClient = createPublicClient({
  transport: http("https://rpc.example")
});

const walletClient = createWalletClient({
  transport: custom(window.ethereum)
});

export const kuru = createKuruClient({
  publicClient,
  walletClient,
  addresses: {
    accountCore: "0x0000000000000000000000000000000000000000"
  }
});

export async function depositNativeMon(amount: bigint) {
  return kuru.account.deposit({
    token: NATIVE_TOKEN_ADDRESS,
    amount
  });
}
