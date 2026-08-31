import { privateKeyToAccount } from "viem/accounts";

import { createKuruRelayClient, createLocalAccountRelaySigner } from "../../src/relay";

const privateKey = process.env.RELAY_SIGNER_PRIVATE_KEY as `0x${string}` | undefined;
if (!privateKey) throw new Error("RELAY_SIGNER_PRIVATE_KEY is required.");

const signer = privateKeyToAccount(privateKey);
const relay = createKuruRelayClient({
  baseUrl: process.env.KURU_RELAY_URL ?? "https://relay.testnet.kuru.io",
  signer: createLocalAccountRelaySigner(signer)
});

// Relay creates the JWT after verifying the signer's personal-message signature.
const session = await relay.authenticate();
console.log(session.accessToken);
