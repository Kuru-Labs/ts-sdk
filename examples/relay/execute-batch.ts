import { signBatchIntent } from "../../src/trading-wallet";
import { chainId, commonHeader, intentSigner, nativeOrder, relay, tradingWallet } from "./shared";

const intent = await signBatchIntent(
  {
    wallet: tradingWallet.address,
    chainId,
    header: commonHeader("execute-batch"),
    orders: [nativeOrder()],
    cancelSlotIdxs: [],
    expectedOrderIds: []
  },
  intentSigner
);

await relay.authenticate();
const broadcast = await relay.executeBatch({ intent });
console.log(broadcast.txHash, broadcast.transactionType);
