import { relayInputError } from "./errors";

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function isRelayRequestId(value: string): boolean {
  return UUID_V7.test(value);
}

export function assertRelayRequestId(value: string): string {
  if (!isRelayRequestId(value)) {
    throw relayInputError("INVALID_REQUEST_ID", "requestId must be a canonical lowercase UUIDv7.");
  }
  return value;
}

/** Creates a canonical lowercase UUIDv7 using the current Unix millisecond timestamp. */
export function createRelayRequestId(now = Date.now(), random?: Uint8Array): string {
  if (!Number.isSafeInteger(now) || now < 0 || now > 0xffff_ffff_ffff) {
    throw relayInputError("INVALID_CLOCK", "Cannot create a UUIDv7 from the supplied timestamp.");
  }
  const bytes = random ? Uint8Array.from(random) : crypto.getRandomValues(new Uint8Array(16));
  if (bytes.length !== 16) {
    throw relayInputError("INVALID_RANDOM_SOURCE", "UUIDv7 randomness must contain 16 bytes.");
  }
  let timestamp = BigInt(now);
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number(timestamp & 0xffn);
    timestamp >>= 8n;
  }
  bytes[6] = 0x70 | ((bytes[6] ?? 0) & 0x0f);
  bytes[8] = 0x80 | ((bytes[8] ?? 0) & 0x3f);
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
