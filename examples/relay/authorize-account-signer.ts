import { privateKeyToAccount } from "viem/accounts";

import { buildAuthorizeAccountSignerTypedData } from "../../src/account";
import { buildAuthorizeAccountSignerRelayRequest } from "../../src/relay";
import {
  createLocalAccountAuthorizationSigner,
  signEip7702Authorization
} from "../../src/trading-wallet";
import {
  chainId,
  envBigInt,
  relay,
  requireAddress,
  requireBigInt,
  requireHex,
  submitAndPrint,
  tradingWallet
} from "./shared";

const accountOwner = privateKeyToAccount(requireHex("ACCOUNT_OWNER_KEY", 32));
const accountCore = requireAddress("KURU_ACCOUNT_CORE");
const now = Math.floor(Date.now() / 1_000);
const authorization = {
  account: accountOwner.address,
  authorizer: accountOwner.address,
  signer: tradingWallet.address,
  permissions: Number(envBigInt("KURU_SIGNER_PERMISSIONS", 1n)),
  expiry: envBigInt("KURU_SIGNER_EXPIRY", BigInt(now + 30 * 24 * 60 * 60)),
  nonce: requireBigInt("KURU_ACCOUNT_AUTHORIZATION_NONCE"),
  deadline: BigInt(now + 60)
};

// The account owner grants the trading wallet AccountCore permissions.
const signature = await accountOwner.signTypedData(
  buildAuthorizeAccountSignerTypedData({ accountCore, chainId, ...authorization })
);

// This separate signature installs KuruTradingWallet on the trading-wallet EOA.
const authorization7702 = await signEip7702Authorization({
  authority: tradingWallet.address,
  chainId,
  delegate: requireAddress("KURU_TRADING_WALLET_DELEGATE"),
  nonce: requireBigInt("KURU_AUTHORITY_NONCE"),
  signer: createLocalAccountAuthorizationSigner(tradingWallet)
});

await relay.authenticate();
const request = buildAuthorizeAccountSignerRelayRequest({
  requestId: relay.createRequestId(),
  wallet: tradingWallet.address,
  authorization: { ...authorization, signature },
  authorization7702
});
await submitAndPrint({ accountAuthorization: signature, authorization7702 }, request);
