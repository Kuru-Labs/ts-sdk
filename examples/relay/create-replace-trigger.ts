import { encodePackedReplaceOp } from "../../src/spot";
import { buildCreateReplaceTriggerRelayRequest } from "../../src/relay";
import { signCreateReplaceTriggerIntent } from "../../src/trading-wallet";
import {
  chainId,
  commonHeader,
  envBigInt,
  intentSigner,
  orderArguments,
  relay,
  submitAndPrint,
  tradingWallet,
  triggerCondition
} from "./shared";

const condition = triggerCondition();
const { price, size, side } = orderArguments();
const intent = await signCreateReplaceTriggerIntent(
  {
    wallet: tradingWallet.address,
    chainId,
    header: commonHeader("create-replace-trigger"),
    packedOps: encodePackedReplaceOp({
      slotIdx: Number(envBigInt("KURU_SLOT_INDEX", 0n)),
      side,
      price,
      size
    }),
    expectedOrderIds: [envBigInt("KURU_EXPECTED_ORDER_ID", (1n << 64n) - 1n)],
    triggerExpiry: condition.triggerExpiry,
    conditionHash: condition.conditionHash
  },
  intentSigner
);

await relay.authenticate();
const request = buildCreateReplaceTriggerRelayRequest({
  requestId: relay.createRequestId(),
  intent,
  conditionSchema: condition.conditionSchema,
  condition: condition.condition
});
await submitAndPrint(intent.signature, request);
