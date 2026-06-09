import type { Address, Hex } from "../src";
import {
  NATIVE_TOKEN_ADDRESS,
  buildBatchRequest,
  buildDepositRequest,
  createKuruClient,
  encodePackedCancelOp
} from "../src";
import type { PublicClient, WalletClient } from "../src";

declare const publicClient: PublicClient;
declare const walletClient: WalletClient;
declare const accountCore: Address;
declare const market: Address;
declare const user: Address;

const client = createKuruClient({
  publicClient,
  walletClient,
  addresses: {
    accountCore
  }
});

const depositRequest = buildDepositRequest({
  accountCore,
  token: NATIVE_TOKEN_ADDRESS,
  amount: 1n
});
depositRequest.functionName satisfies string;

const packedOps: Hex = encodePackedCancelOp(0);

buildBatchRequest({
  market,
  userId: 1n,
  orders: [
    {
      side: "buy",
      quantity: 1n,
      price: 1n,
      tif: "gtc"
    }
  ],
  cancelSlotIdxs: [0]
});

void client.account.getBalance({
  user,
  token: NATIVE_TOKEN_ADDRESS
});

void client.spot.replaceBySlotPacked({
  market,
  userId: 1n,
  packedOps,
  simulate: false
});
