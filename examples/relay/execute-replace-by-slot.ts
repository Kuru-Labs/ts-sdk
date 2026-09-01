import { encodePackedReplaceOp } from "../../src/spot";
import { buildExecuteReplaceBySlotRelayRequest } from "../../src/relay";
import { signReplaceBySlotIntent } from "../../src/trading-wallet";
import {
  chainId,
  commonHeader,
  envBigInt,
  intentSigner,
  orderArguments,
  relay,
  submitAndPrint,
  tradingWallet
} from "./shared";

const { price, size, side } = orderArguments();
const intent = await signReplaceBySlotIntent(
  {
    wallet: tradingWallet.address,
    chainId,
    header: commonHeader("execute-replace-by-slot"),
    packedOps: encodePackedReplaceOp({
      slotIdx: Number(envBigInt("KURU_SLOT_INDEX", 0n)),
      side,
      price,
      size,
      postOnly: true
    }),
    // uint64.max asserts that the target slot is currently empty.
    expectedOrderIds: [envBigInt("KURU_EXPECTED_ORDER_ID", (1n << 64n) - 1n)]
  },
  intentSigner
);

await relay.authenticate();
const request = buildExecuteReplaceBySlotRelayRequest({
  requestId: relay.createRequestId(),
  intent
});
await submitAndPrint(intent.signature, request);
