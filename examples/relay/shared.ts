import { getAddress, isAddress, isHex, keccak256, stringToHex, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import {
  createKuruRelayClient,
  createLocalAccountRelaySigner,
  type AnyRelayRequest
} from "../../src/relay";
import { createLocalAccountWalletIntentSigner } from "../../src/trading-wallet";

export const chainId = Number(envBigInt("KURU_CHAIN_ID", 10143n));
if (!Number.isSafeInteger(chainId) || chainId <= 0) {
  throw new Error("KURU_CHAIN_ID must be a positive safe integer.");
}
export const tradingWallet = privateKeyToAccount(requireHex("TRADING_WALLET_KEY", 32));
export const intentSigner = createLocalAccountWalletIntentSigner(tradingWallet);
export const relay = createKuruRelayClient({
  baseUrl: process.env.KURU_RELAY_URL ?? "https://relay.testnet.kuru.io",
  signer: createLocalAccountRelaySigner(tradingWallet)
});

export function commonHeader(label: string) {
  const nowMs = Date.now();
  return {
    accountId: requireBigInt("KURU_ACCOUNT_ID"),
    market: requireAddress("KURU_MARKET"),
    authNonce: requireBigInt("KURU_AUTH_NONCE"),
    nonce: BigInt(nowMs),
    deadline: BigInt(Math.floor(nowMs / 1_000) + 30),
    clientOrderId: keccak256(stringToHex(`${label}:${nowMs}`))
  };
}

export function nativeOrder() {
  const { price, size, side } = orderArguments();
  return {
    side,
    quantity: size,
    price,
    tif: "gtc" as const,
    executionInstruction: "postOnly" as const,
    minSizeAfterBlock: 0n
  };
}

/**
 * Order CLI values are already raw integers: price uses the market's
 * pricePrecision and size uses the market's sizePrecision.
 */
export function orderArguments() {
  return {
    price: requireCliUint("price"),
    size: requireCliUint("size"),
    side: optionalCliSide()
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

function cliValues(name: string): string[] {
  const flag = `--${name}`;
  const values: string[] = [];
  for (let index = 2; index < process.argv.length; index += 1) {
    const argument = process.argv[index];
    if (argument === undefined) continue;
    if (argument === flag) {
      const value = process.argv[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`${flag} requires an integer value.`);
      }
      values.push(value);
      index += 1;
    } else if (argument.startsWith(`${flag}=`)) {
      values.push(argument.slice(flag.length + 1));
    }
  }
  return values;
}

function requireCliUint(name: string): bigint {
  const flag = `--${name}`;
  const values = cliValues(name);
  if (values.length !== 1) throw new Error(`Pass exactly one ${flag} value.`);
  const input = values[0];
  if (input === undefined) throw new Error(`Pass exactly one ${flag} value.`);
  try {
    const value = BigInt(input);
    if (value <= 0n) throw new Error();
    return value;
  } catch {
    throw new Error(`${flag} must be a positive integer in the market's raw precision.`);
  }
}

function optionalCliSide(): "buy" | "sell" {
  const values = cliValues("side");
  if (values.length === 0) return "buy";
  if (values.length !== 1 || (values[0] !== "buy" && values[0] !== "sell")) {
    throw new Error("--side must be buy or sell.");
  }
  return values[0];
}

/** Logs the signed value, exact wire request, and Relay response for inspection. */
export async function submitAndPrint(signature: unknown, request: AnyRelayRequest) {
  console.log("signature:", JSON.stringify(signature, null, 2));
  console.log("request:", JSON.stringify(request, null, 2));
  const response = await relay.submit(request);
  console.log("response:", JSON.stringify(response, null, 2));
  return response;
}
