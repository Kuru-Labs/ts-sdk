import { encodePackedReplaceOp } from "../../src/spot";
import { signCreateReplaceTriggerIntent } from "../../src/trading-wallet";
import {
  chainId,
  commonHeader,
  envBigInt,
  intentSigner,
  relay,
  tradingWallet,
  triggerCondition
} from "./shared";

const condition = triggerCondition();
const intent = await signCreateReplaceTriggerIntent(
  {
    wallet: tradingWallet.address,
    chainId,
    header: commonHeader("create-replace-trigger"),
    packedOps: encodePackedReplaceOp({
      slotIdx: Number(envBigInt("KURU_SLOT_INDEX", 0n)),
      side: "buy",
      price: envBigInt("KURU_ORDER_PRICE", 123_400n),
      size: envBigInt("KURU_ORDER_QUANTITY", 1_000_000n)
    }),
    expectedOrderIds: [envBigInt("KURU_EXPECTED_ORDER_ID", (1n << 64n) - 1n)],
    triggerExpiry: condition.triggerExpiry,
    conditionHash: condition.conditionHash
  },
  intentSigner
);

await relay.authenticate();
const broadcast = await relay.createReplaceTrigger({
  intent,
  conditionSchema: condition.conditionSchema,
  condition: condition.condition
});
console.log(broadcast.txHash, broadcast.transactionType);
