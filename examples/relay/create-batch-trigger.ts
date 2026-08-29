import { signCreateBatchTriggerIntent } from "../../src/trading-wallet";
import {
  chainId,
  commonHeader,
  intentSigner,
  nativeOrder,
  relay,
  tradingWallet,
  triggerCondition
} from "./shared";

const condition = triggerCondition();
const intent = await signCreateBatchTriggerIntent(
  {
    wallet: tradingWallet.address,
    chainId,
    header: commonHeader("create-batch-trigger"),
    orders: [nativeOrder()],
    cancelSlotIdxs: [],
    expectedOrderIds: [],
    triggerExpiry: condition.triggerExpiry,
    conditionHash: condition.conditionHash
  },
  intentSigner
);

await relay.authenticate();
const broadcast = await relay.createBatchTrigger({
  intent,
  conditionSchema: condition.conditionSchema,
  condition: condition.condition
});
console.log(broadcast.txHash, broadcast.transactionType);
