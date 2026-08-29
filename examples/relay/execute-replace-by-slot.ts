import { encodePackedReplaceOp } from "../../src/spot";
import { signReplaceBySlotIntent } from "../../src/trading-wallet";
import { chainId, commonHeader, envBigInt, intentSigner, relay, tradingWallet } from "./shared";

const intent = await signReplaceBySlotIntent(
  {
    wallet: tradingWallet.address,
    chainId,
    header: commonHeader("execute-replace-by-slot"),
    packedOps: encodePackedReplaceOp({
      slotIdx: Number(envBigInt("KURU_SLOT_INDEX", 0n)),
      side: "buy",
      price: envBigInt("KURU_ORDER_PRICE", 123_400n),
      size: envBigInt("KURU_ORDER_QUANTITY", 1_000_000n),
      postOnly: true
    }),
    // uint64.max asserts that the target slot is currently empty.
    expectedOrderIds: [envBigInt("KURU_EXPECTED_ORDER_ID", (1n << 64n) - 1n)]
  },
  intentSigner
);

// Authentication signs Relay's personal-message challenge and retains the token.
await relay.authenticate();
const broadcast = await relay.executeReplaceBySlot({ intent });
console.log(broadcast.txHash, broadcast.transactionType);
