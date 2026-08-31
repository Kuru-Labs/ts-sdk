import { buildExecuteBatchRelayRequest } from "../../src/relay";
import { signBatchIntent } from "../../src/trading-wallet";
import {
  chainId,
  commonHeader,
  intentSigner,
  nativeOrder,
  relay,
  submitAndPrint,
  tradingWallet
} from "./shared";

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
const request = buildExecuteBatchRelayRequest({ requestId: relay.createRequestId(), intent });
await submitAndPrint(intent.signature, request);
