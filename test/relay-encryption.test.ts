import { createCipheriv, createDecipheriv } from "node:crypto";
import { privateKeyToAccount } from "viem/accounts";
import { verifyMessage, type Address, type Hex } from "viem";
import { describe, expect, it, vi } from "vitest";

import {
  createKuruRelayClient,
  encryptRelayPrivateKey,
  decryptRelayPrivateKey,
  type RelayEncryptionKey,
  type RelayFetch
} from "../src/relay";
import { encryptionRoundTrip } from "../examples/relay/encryption-round-trip";

const privateKey: Hex = `0x${"01".repeat(32)}`;
const wallet = privateKeyToAccount(privateKey).address.toLowerCase() as Address;
const key: RelayEncryptionKey = {
  wallet,
  keyVersion: "v1",
  algorithm: "AES-256-GCM",
  encryptionKey: Buffer.alloc(32, 7).toString("base64"),
  aad: JSON.stringify([
    "kuru-mera-browser-key-v1",
    "testnet",
    "10143",
    "issuer",
    "audience",
    wallet.toLowerCase(),
    "v1"
  ])
};
const wire = {
  wallet,
  key_version: key.keyVersion,
  algorithm: key.algorithm,
  encryption_key: key.encryptionKey,
  aad: key.aad
};
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });

function fixtureFetch(body: unknown = wire, status = 200) {
  return vi.fn<RelayFetch>().mockResolvedValue(json(body, status));
}

describe("Relay encryption key requests", () => {
  it("uses authenticated no-store POST and converts wire fields", async () => {
    const fetch = fixtureFetch();
    const relay = createKuruRelayClient({
      baseUrl: "https://relay.example",
      accessToken: "jwt",
      fetch
    });
    expect(await relay.requestEncryptionKey(wallet, { keyVersion: "v1" })).toEqual(key);
    expect(fetch).toHaveBeenCalledWith(
      "https://relay.example/auth/mera/encryption-key",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        redirect: "error",
        body: JSON.stringify({ wallet, key_version: "v1" }),
        headers: expect.objectContaining({ Authorization: "Bearer jwt" })
      })
    );
  });

  it("supports token providers, omits active version and does not retain encryption keys", async () => {
    const fetch = vi.fn<RelayFetch>().mockImplementation(() => Promise.resolve(json(wire)));
    const tokenProvider = vi.fn(() => "jwt");
    const relay = createKuruRelayClient({ baseUrl: "https://relay.example", tokenProvider, fetch });
    await relay.requestEncryptionKey(wallet);
    await relay.requestEncryptionKey(wallet);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(tokenProvider).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ wallet }));
  });

  it.each([
    ["bad algorithm", { ...wire, algorithm: "AES-CBC" }],
    ["bad length", { ...wire, encryption_key: "secret" }],
    ["wrong wallet", { ...wire, wallet: `0x${"22".repeat(20)}` }],
    ["wrong version", { ...wire, key_version: "v2" }],
    ["missing AAD", { ...wire, aad: "" }],
    ["oversized AAD", { ...wire, aad: "a".repeat(4097) }],
    ["not an object", null]
  ])("rejects malformed response: %s", async (_, response) => {
    const relay = createKuruRelayClient({
      baseUrl: "https://relay.example",
      accessToken: "jwt",
      fetch: fixtureFetch(response)
    });
    await expect(relay.requestEncryptionKey(wallet, { keyVersion: "v1" })).rejects.toMatchObject({
      kind: "MALFORMED_RESPONSE",
      code: "INVALID_ENCRYPTION_KEY_RESPONSE"
    });
  });

  it.each([401, 403, 404, 409, 429, 503])("preserves safe status/code for %s", async (status) => {
    const relay = createKuruRelayClient({
      baseUrl: "https://relay.example",
      accessToken: "jwt",
      fetch: fixtureFetch(
        { code: "KEY_VERSION_UNAVAILABLE", message: key.encryptionKey, retryable: false },
        status
      )
    });
    try {
      await relay.requestEncryptionKey(wallet);
      expect.fail("expected rejection");
    } catch (error) {
      expect(error).toMatchObject({ httpStatus: status, code: "KEY_VERSION_UNAVAILABLE" });
      expect(String(error)).not.toContain(key.encryptionKey);
    }
  });

  it("rejects absent/expired credentials and invalid versions before fetching", async () => {
    const fetch = fixtureFetch();
    const relay = createKuruRelayClient({ baseUrl: "https://relay.example", fetch });
    await expect(relay.requestEncryptionKey(wallet)).rejects.toMatchObject({
      code: "ACCESS_TOKEN_REQUIRED"
    });
    await expect(relay.requestEncryptionKey(wallet, { keyVersion: "" })).rejects.toMatchObject({
      code: "INVALID_KEY_VERSION"
    });
    relay.setAccessToken({
      accessToken: "jwt",
      tokenType: "Bearer",
      wallet,
      expiresAt: new Date(0)
    });
    await expect(relay.requestEncryptionKey(wallet)).rejects.toMatchObject({
      code: "ACCESS_TOKEN_EXPIRED"
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("supports cancellation and timeout on the key endpoint", async () => {
    const fetch: RelayFetch = (_, options) =>
      new Promise((_, reject) => {
        options?.signal?.addEventListener("abort", () => reject(new Error("aborted")), {
          once: true
        });
      });
    const relay = createKuruRelayClient({
      baseUrl: "https://relay.example",
      fetch,
      accessToken: "jwt"
    });
    await expect(
      relay.requestEncryptionKey(wallet, { signal: AbortSignal.abort() })
    ).rejects.toMatchObject({ kind: "CANCELLED" });
    await expect(relay.requestEncryptionKey(wallet, { timeoutMs: 5 })).rejects.toMatchObject({
      kind: "TIMEOUT"
    });
  });
});

describe("Private-key encryption", () => {
  it("round trips a JSON-stored envelope with fresh IVs and a re-fetched key", async () => {
    const first = await encryptRelayPrivateKey(privateKey, key);
    const second = await encryptRelayPrivateKey(privateKey, key);
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(JSON.stringify(first)).not.toContain(privateKey.slice(2));
    expect(JSON.stringify(first)).not.toContain(key.encryptionKey);
    expect(await decryptRelayPrivateKey(JSON.parse(JSON.stringify(first)), { ...key })).toBe(
      privateKey
    );
    const decipher = createDecipheriv(
      "aes-256-gcm",
      Buffer.from(key.encryptionKey, "base64"),
      Buffer.from(first.iv, "base64")
    );
    decipher.setAAD(Buffer.from(key.aad));
    const ciphertext = Buffer.from(first.ciphertext, "base64");
    decipher.setAuthTag(ciphertext.subarray(-16));
    expect(
      Buffer.concat([decipher.update(ciphertext.subarray(0, -16)), decipher.final()]).toString(
        "hex"
      )
    ).toBe(privateKey.slice(2));
  });

  it("decrypts independently produced AES-GCM ciphertext", async () => {
    const iv = Buffer.alloc(12, 9);
    const cipher = createCipheriv("aes-256-gcm", Buffer.from(key.encryptionKey, "base64"), iv);
    cipher.setAAD(Buffer.from(key.aad));
    const ciphertext = Buffer.concat([
      cipher.update(Buffer.from(privateKey.slice(2), "hex")),
      cipher.final(),
      cipher.getAuthTag()
    ]);
    expect(
      await decryptRelayPrivateKey(
        {
          formatVersion: 1,
          wallet,
          keyVersion: "v1",
          algorithm: "AES-256-GCM",
          aad: key.aad,
          iv: iv.toString("base64"),
          ciphertext: ciphertext.toString("base64")
        },
        key
      )
    ).toBe(privateKey);
  });

  it("rejects tampered ciphertext, IV, metadata, and wrong keys", async () => {
    const envelope = await encryptRelayPrivateKey(privateKey, key);
    const altered = Buffer.from(envelope.ciphertext, "base64");
    altered[0] = altered[0]! ^ 1;
    await expect(
      decryptRelayPrivateKey({ ...envelope, ciphertext: altered.toString("base64") }, key)
    ).rejects.toMatchObject({ code: "DECRYPTION_FAILED" });
    await expect(
      decryptRelayPrivateKey({ ...envelope, iv: Buffer.alloc(12).toString("base64") }, key)
    ).rejects.toMatchObject({ code: "DECRYPTION_FAILED" });
    await expect(
      decryptRelayPrivateKey(envelope, {
        ...key,
        encryptionKey: Buffer.alloc(32, 8).toString("base64")
      })
    ).rejects.toMatchObject({ code: "DECRYPTION_FAILED" });
    for (const metadata of [
      { aad: "tampered" },
      { keyVersion: "v2" },
      { wallet: `0x${"22".repeat(20)}` as const },
      { formatVersion: 2 as never }
    ]) {
      await expect(decryptRelayPrivateKey({ ...envelope, ...metadata }, key)).rejects.toMatchObject(
        { code: "ENCRYPTION_CONTEXT_MISMATCH" }
      );
    }
    await expect(
      decryptRelayPrivateKey({ ...envelope, ciphertext: "invalid" }, key)
    ).rejects.toMatchObject({ code: "INVALID_ENCRYPTION_ENCODING" });
  });

  it.each(["0x00", `0x${"00".repeat(32)}`, `0x${"ff".repeat(32)}`])(
    "rejects invalid private key without echoing it",
    async (value) => {
      await expect(encryptRelayPrivateKey(value as Hex, key)).rejects.toMatchObject({
        code: "INVALID_PRIVATE_KEY"
      });
    }
  );
});

describe("CLI round-trip example", () => {
  it("signs a challenge, obtains JWT, requests twice and prints ciphertext only", async () => {
    let requests = 0;
    const print = vi.fn();
    const fetch: RelayFetch = async (url, options) => {
      const body = JSON.parse(options!.body as string);
      const target = typeof url === "string" ? url : url instanceof URL ? url.href : url.url;
      if (target.endsWith("/auth/challenge")) {
        expect(body.wallet).toBe(wallet);
        return json({
          challengeId: "ab".repeat(16),
          message: "test relay challenge",
          expiresAt: new Date(Date.now() + 60_000).toISOString()
        });
      }
      if (target.endsWith("/auth/token")) {
        expect(
          await verifyMessage({
            address: wallet,
            message: "test relay challenge",
            signature: body.signature
          })
        ).toBe(true);
        return json({
          wallet,
          accessToken: "test.jwt",
          tokenType: "Bearer",
          expiresAt: new Date(Date.now() + 60_000).toISOString()
        });
      }
      expect(target).toBe("https://relay.example/auth/mera/encryption-key");
      expect(options?.headers).toMatchObject({ Authorization: "Bearer test.jwt" });
      expect(body.key_version).toBe(requests++ === 0 ? undefined : "v1");
      return json(wire);
    };
    await encryptionRoundTrip({ privateKey, baseUrl: "https://relay.example", fetch, print });
    expect(requests).toBe(2);
    expect(print).toHaveBeenCalledOnce();
    const output = JSON.stringify(print.mock.calls);
    expect(output).not.toContain(privateKey.slice(2));
    expect(output).not.toContain(key.encryptionKey);
    expect(output).not.toContain("test.jwt");
  });
});
