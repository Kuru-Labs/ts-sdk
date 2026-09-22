import { bytesToHex, hexToBytes, isAddressEqual, type Hex } from "viem";

import { normalizeAddress } from "../trading-wallet/validation";
import { KuruRelayError, relayInputError } from "./errors";
import type { RelayEncryptedPrivateKey, RelayEncryptionKey } from "./types";

const ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

/** Encrypt a secp256k1 private key locally; only the returned envelope may be persisted. */
export async function encryptRelayPrivateKey(
  privateKey: Hex,
  key: RelayEncryptionKey
): Promise<RelayEncryptedPrivateKey> {
  assertPrivateKey(privateKey);
  validateRelayEncryptionKey(key);
  const crypto = webCrypto();
  const imported = await importKey(key);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = hexToBytes(privateKey);
  try {
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(key.aad), tagLength: 128 },
      imported,
      plaintext
    );
    return {
      formatVersion: 1,
      wallet: normalizeAddress(key.wallet, "wallet"),
      keyVersion: key.keyVersion,
      algorithm: "AES-256-GCM",
      aad: key.aad,
      iv: encodeBase64(iv),
      ciphertext: encodeBase64(new Uint8Array(ciphertext))
    };
  } catch {
    throw cryptoError("ENCRYPTION_FAILED", "Unable to encrypt the private key.");
  } finally {
    plaintext.fill(0);
  }
}

/** Restore locally after fetching the envelope's keyVersion from Relay. */
export async function decryptRelayPrivateKey(
  envelope: RelayEncryptedPrivateKey,
  key: RelayEncryptionKey
): Promise<Hex> {
  validateRelayEncryptionKey(key);
  if (
    !envelope ||
    envelope.formatVersion !== 1 ||
    envelope.algorithm !== "AES-256-GCM" ||
    typeof envelope.wallet !== "string" ||
    !isAddressEqual(normalizeAddress(envelope.wallet, "wallet"), key.wallet) ||
    envelope.keyVersion !== key.keyVersion ||
    envelope.aad !== key.aad
  ) {
    throw relayInputError(
      "ENCRYPTION_CONTEXT_MISMATCH",
      "The encrypted record does not match the relay key context."
    );
  }
  const iv = decodeBase64(envelope.iv, 12);
  const ciphertext = decodeBase64(envelope.ciphertext, 48);
  const imported = await importKey(key);
  let plaintext: Uint8Array | undefined;
  try {
    plaintext = new Uint8Array(
      await webCrypto().subtle.decrypt(
        { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(key.aad), tagLength: 128 },
        imported,
        ciphertext
      )
    );
    const privateKey = bytesToHex(plaintext);
    assertPrivateKey(privateKey);
    return privateKey;
  } catch {
    throw cryptoError(
      "DECRYPTION_FAILED",
      "Unable to authenticate or decrypt the encrypted private key."
    );
  } finally {
    plaintext?.fill(0);
  }
}

/** Shared runtime validation for HTTP responses and callers supplying keys directly. */
export function validateRelayEncryptionKey(key: RelayEncryptionKey): void {
  if (
    !key ||
    key.algorithm !== "AES-256-GCM" ||
    typeof key.keyVersion !== "string" ||
    !/^[A-Za-z0-9_-]{1,64}$/.test(key.keyVersion) ||
    typeof key.aad !== "string" ||
    key.aad.length === 0 ||
    key.aad.length > 4096
  ) {
    throw relayInputError("INVALID_ENCRYPTION_KEY", "Invalid relay encryption key metadata.");
  }
  normalizeAddress(key.wallet, "wallet");
  const raw = decodeBase64(key.encryptionKey, 32);
  raw.fill(0);
}

function webCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw cryptoError(
      "WEB_CRYPTO_UNAVAILABLE",
      "Web Crypto requires a secure browser context or Node.js 20+."
    );
  }
  return globalThis.crypto;
}

async function importKey(key: RelayEncryptionKey) {
  const raw = decodeBase64(key.encryptionKey, 32);
  try {
    return await webCrypto().subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
  } catch (error) {
    if (error instanceof KuruRelayError) throw error;
    throw cryptoError("INVALID_ENCRYPTION_KEY", "Unable to import the relay encryption key.");
  } finally {
    raw.fill(0);
  }
}

function assertPrivateKey(value: Hex): void {
  if (
    typeof value !== "string" ||
    !/^0x[0-9a-fA-F]{64}$/.test(value) ||
    BigInt(value) === 0n ||
    BigInt(value) >= ORDER
  ) {
    throw relayInputError("INVALID_PRIVATE_KEY", "Expected a valid 32-byte secp256k1 private key.");
  }
}

function encodeBase64(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value));
}

function decodeBase64(value: string, bytes: number): Uint8Array<ArrayBuffer> {
  if (typeof value !== "string" || value.length !== Math.ceil(bytes / 3) * 4) {
    throw relayInputError(
      "INVALID_ENCRYPTION_ENCODING",
      "Invalid encrypted-key encoding or length."
    );
  }
  try {
    const decoded = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
    if (decoded.length !== bytes || encodeBase64(decoded) !== value) throw new Error();
    return decoded;
  } catch {
    throw relayInputError(
      "INVALID_ENCRYPTION_ENCODING",
      "Invalid encrypted-key encoding or length."
    );
  }
}

function cryptoError(code: string, message: string): KuruRelayError {
  return new KuruRelayError("ENCRYPTION", message, { code });
}
