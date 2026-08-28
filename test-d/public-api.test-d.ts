import type { Address, Hex } from "../src";
import {
  NATIVE_TOKEN_ADDRESS,
  buildBatchRequest,
  buildDepositRequest,
  createLocalAccountWalletIntentSigner,
  createKuruClient,
  createKuruRelayClient,
  encodePackedCancelOp,
  prepareReplaceBySlotIntent,
  signEip7702Authorization,
  signPreparedWalletIntent
} from "../src";
import type { Eip7702AuthorizationSigner } from "../src";
import type { PreparedReplaceBySlotIntent, SignedWalletIntent } from "../src/trading-wallet";
import type { LocalAccount } from "viem";
import type { PublicClient, WalletClient } from "../src";

declare const publicClient: PublicClient;
declare const walletClient: WalletClient;
declare const accountCore: Address;
declare const market: Address;
declare const user: Address;
declare const localAccount: LocalAccount;
declare const authorizationSigner: Eip7702AuthorizationSigner;
declare const signedRelayIntent: SignedWalletIntent<PreparedReplaceBySlotIntent>;

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

const walletIntent = prepareReplaceBySlotIntent({
  wallet: localAccount.address,
  chainId: 143,
  header: {
    accountId: 1n,
    market,
    authNonce: 0n,
    nonce: 1n,
    deadline: 2n,
    clientOrderId: `0x${"11".repeat(32)}`
  },
  packedOps,
  expectedOrderIds: [1n]
});

void signPreparedWalletIntent(walletIntent, createLocalAccountWalletIntentSigner(localAccount));

void signEip7702Authorization({
  authority: localAccount.address,
  chainId: 143,
  delegate: accountCore,
  publicClient,
  signer: authorizationSigner
});

const relayClient = createKuruRelayClient({
  baseUrl: "https://api.relay.testnet.kuru.io",
  accessToken: "relay-issued-jwt"
});

void relayClient.executeReplaceBySlot({
  requestId: "018f5ef2-88a1-7b41-a826-4b679010f87f",
  intent: signedRelayIntent
});
