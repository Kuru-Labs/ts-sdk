import { buildCreateBatchTriggerRelayRequest } from "../../src/relay";
import { signCreateBatchTriggerIntent } from "../../src/trading-wallet";
import {
  chainId,
  commonHeader,
  intentSigner,
  nativeOrder,
  relay,
  submitAndPrint,
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
const request = buildCreateBatchTriggerRelayRequest({
  requestId: relay.createRequestId(),
  intent,
  conditionSchema: condition.conditionSchema,
  condition: condition.condition
});
await submitAndPrint(intent.signature, request);
