import { signCancelTriggerIntent } from "../../src/trading-wallet";
import { chainId, envBigInt, intentSigner, relay, requireHex, tradingWallet } from "./shared";

const intent = await signCancelTriggerIntent(
  {
    wallet: tradingWallet.address,
    chainId,
    accountId: envBigInt("KURU_ACCOUNT_ID", 1n),
    authNonce: envBigInt("KURU_AUTH_NONCE", 0n),
    nonce: BigInt(Date.now()),
    deadline: BigInt(Math.floor(Date.now() / 1_000) + 30),
    triggerId: requireHex("KURU_TRIGGER_ID", 32)
  },
  intentSigner
);

await relay.authenticate();
const broadcast = await relay.cancelTrigger({ intent });
console.log(broadcast.txHash, broadcast.transactionType);
