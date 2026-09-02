import type { Address, Hex } from "../src";
import {
  NATIVE_TOKEN_ADDRESS,
  buildBatchRequest,
  buildDepositRequest,
  createLocalAccountWalletIntentSigner,
  createKuruClient,
  createKuruRelayClient,
  decodeExchangeWsFrame,
  encodePackedCancelOp,
  packPostFillQuote,
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

void client.spot.getPostFillHook({ market, userId: 1n });
void client.spot.setPostFillHook({ market, userId: 1n, hook: user });
void client.spot.getPostFillHookGasLimit({ market });
void client.spot.setPostFillHookGasLimit({ market, gasLimit: 500_000n });
void client.spot.getPostFillHookMinQuoteNotional({ market });
void client.spot.setPostFillHookMinQuoteNotional({ market, minQuoteNotional: 60_000_000n });
void client.account.getPostFillHookAccess({ accountId: 1n });
void client.account.setPostFillHookAccess({ accountId: 1n, allowed: true });
packPostFillQuote(50_000n, 1_000_000n) satisfies bigint;

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
  baseUrl: "https://relay.testnet.kuru.io",
  accessToken: "relay-issued-jwt"
});

void relayClient.executeReplaceBySlot({
  requestId: "018f5ef2-88a1-7b41-a826-4b679010f87f",
  intent: signedRelayIntent
});

const exchangeFrame = decodeExchangeWsFrame(new Uint8Array());
exchangeFrame.feedEpoch satisfies bigint;
if (exchangeFrame.kind === "l2Book" && exchangeFrame.levelFormat === "extended") {
  exchangeFrame.bids[0]?.activeBaseX18 satisfies bigint | undefined;
}
if (exchangeFrame.kind === "userOrders" && exchangeFrame.snapshot) {
  exchangeFrame.stateHead?.blockNumber satisfies bigint | undefined;
  exchangeFrame.orders[0]?.slotIdx satisfies number | undefined;
}
if (exchangeFrame.kind === "userOrders" && !exchangeFrame.snapshot) {
  const event = exchangeFrame.events[0];
  event?.source.recordIdx satisfies number | undefined;
  if (event?.kind === "trade") {
    event.filledSize satisfies bigint;
    event.updatedSize satisfies bigint;
  }
}
