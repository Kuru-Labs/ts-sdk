import { getAddress, isAddress, isHex, keccak256, stringToHex, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { createKuruRelayClient, createLocalAccountRelaySigner } from "../../src/relay";
import { createLocalAccountWalletIntentSigner } from "../../src/trading-wallet";

export const chainId = Number(requireBigInt("KURU_CHAIN_ID"));
if (!Number.isSafeInteger(chainId) || chainId <= 0) {
  throw new Error("KURU_CHAIN_ID must be a positive safe integer.");
}
export const tradingWallet = privateKeyToAccount(requireHex("TRADING_WALLET_KEY", 32));
export const intentSigner = createLocalAccountWalletIntentSigner(tradingWallet);
export const relay = createKuruRelayClient({
  baseUrl: process.env.KURU_RELAY_URL ?? "https://api.relay.testnet.kuru.io",
  signer: createLocalAccountRelaySigner(tradingWallet)
});

export function commonHeader(label: string) {
  const nowMs = Date.now();
  return {
    accountId: envBigInt("KURU_ACCOUNT_ID", 1n),
    market: requireAddress("KURU_MARKET"),
    authNonce: envBigInt("KURU_AUTH_NONCE", 0n),
    nonce: BigInt(nowMs),
    deadline: BigInt(Math.floor(nowMs / 1_000) + 30),
    clientOrderId: keccak256(stringToHex(`${label}:${nowMs}`))
  };
}

export function nativeOrder() {
  return {
    side: "buy" as const,
    quantity: envBigInt("KURU_ORDER_QUANTITY", 1_000_000n),
    price: envBigInt("KURU_ORDER_PRICE", 123_400n),
    tif: "gtc" as const,
    executionInstruction: "postOnly" as const,
    minSizeAfterBlock: 0n
  };
}

export function triggerCondition() {
  const condition = requireHex("KURU_TRIGGER_CONDITION");
  if (condition.length < 10) {
    throw new Error("KURU_TRIGGER_CONDITION must start with a four-byte condition schema.");
  }
  return {
    condition,
    conditionSchema: BigInt(`0x${condition.slice(2, 10)}`),
    conditionHash: keccak256(condition),
    triggerExpiry: envBigInt("KURU_TRIGGER_EXPIRY", BigInt(Math.floor(Date.now() / 1_000) + 3_600))
  };
}

export function requireAddress(name: string): Address {
  const value = process.env[name];
  if (!value || !isAddress(value)) throw new Error(`${name} must be an EVM address.`);
  return getAddress(value);
}

export function requireHex(name: string, bytes?: number): Hex {
  const value = process.env[name];
  if (!value || !isHex(value, { strict: true })) {
    throw new Error(`${name} must be strict 0x-prefixed hexadecimal bytes.`);
  }
  if (bytes !== undefined && value.length !== 2 + bytes * 2) {
    throw new Error(`${name} must be exactly ${bytes} bytes.`);
  }
  return value;
}

export function envBigInt(name: string, fallback: bigint): bigint {
  const value = process.env[name];
  if (value === undefined) return fallback;
  try {
    return BigInt(value);
  } catch {
    throw new Error(`${name} must be an integer.`);
  }
}

export function requireBigInt(name: string): bigint {
  const value = process.env[name];
  if (value === undefined) throw new Error(`${name} is required.`);
  try {
    return BigInt(value);
  } catch {
    throw new Error(`${name} must be an integer.`);
  }
}
