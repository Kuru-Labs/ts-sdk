import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  decodeExchangeWsEnvelope,
  decodeExchangeWsFrame,
  decodeExchangeWsMessage
} from "../src/exchange-ws";

const root = new URL("fixtures/exchange-ws-envelope/", import.meta.url);
describe("Gateway subscription envelopes", () => {
  for (const name of readdirSync(root).filter((name) => name.endsWith(".bin"))) {
    it(`decodes authoritative Gateway ${name}`, async () => {
      const bytes = readFileSync(new URL(name, root));
      const decoded = decodeExchangeWsEnvelope(bytes);
      expect(decoded.id).toBe(101n);
      expect(decoded.message).toEqual(decodeExchangeWsFrame(bytes.subarray(8)));
      expect(await decodeExchangeWsMessage(bytes)).toEqual(decoded);
      for (const id of [0n, 202n, (1n << 64n) - 1n]) {
        const changed = Uint8Array.from(bytes);
        new DataView(changed.buffer).setBigUint64(0, id, false);
        expect(decodeExchangeWsEnvelope(changed)).toEqual({ id, message: decoded.message });
      }
    });
  }
  it("rejects incomplete prefixes, missing payloads and unprefixed frames", () => {
    for (let length = 0; length <= 8; length++) {
      expect(() => decodeExchangeWsEnvelope(new Uint8Array(length))).toThrow(/truncated/);
    }
    const bytes = readFileSync(new URL("trades.bin", root));
    expect(() => decodeExchangeWsEnvelope(bytes.subarray(8))).toThrow();
  });
});
