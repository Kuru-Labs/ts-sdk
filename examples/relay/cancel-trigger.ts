import { buildCancelTriggerRelayRequest } from "../../src/relay";
import { signCancelTriggerIntent } from "../../src/trading-wallet";
import {
  chainId,
  intentSigner,
  relay,
  requireHex,
  requireBigInt,
  submitAndPrint,
  tradingWallet
} from "./shared";

const intent = await signCancelTriggerIntent(
  {
    wallet: tradingWallet.address,
    chainId,
    accountId: requireBigInt("KURU_ACCOUNT_ID"),
    authNonce: requireBigInt("KURU_AUTH_NONCE"),
    nonce: BigInt(Date.now()),
    deadline: BigInt(Math.floor(Date.now() / 1_000) + 30),
    triggerId: requireHex("KURU_TRIGGER_ID", 32)
  },
  intentSigner
);

await relay.authenticate();
const request = buildCancelTriggerRelayRequest({ requestId: relay.createRequestId(), intent });
await submitAndPrint(intent.signature, request);
