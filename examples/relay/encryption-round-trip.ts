import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

import {
  createKuruRelayClient,
  createLocalAccountRelaySigner,
  encryptRelayPrivateKey,
  decryptRelayPrivateKey,
  type RelayEncryptedPrivateKey,
  type RelayFetch
} from "../../src/relay";

/** Injectable fetch/output lets the complete example run against a test relay. */
export async function encryptionRoundTrip(options: {
  privateKey: Hex;
  baseUrl: string;
  fetch?: RelayFetch;
  print?: (envelope: RelayEncryptedPrivateKey) => void;
}): Promise<void> {
  let account;
  try {
    account = privateKeyToAccount(options.privateKey);
  } catch {
    throw new Error("PRIVATE_KEY must be a valid secp256k1 private key.");
  }
  const relay = createKuruRelayClient({
    baseUrl: options.baseUrl,
    signer: createLocalAccountRelaySigner(account),
    ...(options.fetch ? { fetch: options.fetch } : {})
  });
  // Relay issues the JWT after verifying this account's signed login challenge.
  const session = await relay.authenticate();
  const envelope = await encryptRelayPrivateKey(
    options.privateKey,
    await relay.requestEncryptionKey(account.address)
  );
  (options.print ?? ((value) => console.log(JSON.stringify(value, null, 2))))(envelope);

  // Simulate refresh: a new client has only the existing JWT session and the
  // persisted envelope. No previous encryption key is passed to this client.
  const restoredClient = createKuruRelayClient({
    baseUrl: options.baseUrl,
    accessToken: session,
    ...(options.fetch ? { fetch: options.fetch } : {})
  });
  const restored = await decryptRelayPrivateKey(
    envelope,
    await restoredClient.requestEncryptionKey(account.address, { keyVersion: envelope.keyVersion })
  );
  // Assert a boolean so assertion errors cannot print either private key.
  assert.ok(restored === options.privateKey.toLowerCase(), "Private-key round trip did not match.");
  assert.ok(
    privateKeyToAccount(restored).address === account.address,
    "Restored signer did not match."
  );
  relay.clearAccessToken();
  restoredClient.clearAccessToken();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("PRIVATE_KEY must be a 0x-prefixed 32-byte private key.");
  }
  await encryptionRoundTrip({
    privateKey: privateKey as Hex,
    baseUrl: process.env.KURU_RELAY_URL ?? "https://relay.testnet.kuru.io"
  });
  console.log("Private-key round trip verified.");
}
