import {
  encodeAbiParameters,
  hashTypedData,
  isHex,
  keccak256,
  zeroAddress,
  type Address,
  type Hex
} from "viem";
import { kuruTradingWalletAbi } from "../generated";
import { KuruSdkError } from "../errors";
import { assertUint, type KuruContractRequest } from "../utils";
import { normalizeNativeSide } from "../spot/orders";
import type { NativeSideInput } from "../spot/types";
import { tradingWalletDomain } from "./typed-data";
import {
  normalizeBytes32,
  normalizeWalletIntentHeader,
  normalizeWalletSignature
} from "./validation";
import type {
  WalletDomainInput,
  WalletIntentHeaderInput,
  WalletIntentHeader,
  WalletUintInput,
  WalletTypedDataDefinition,
  WalletTypedDataField,
  SignedWalletIntent
} from "./types";

export interface WalletActionInput extends WalletDomainInput {
  header: WalletIntentHeaderInput;
}
export interface FokOrderInput {
  side: NativeSideInput;
  /** Base quantity in market sizePrecision, unlike exact-input swap amounts. */
  quantity: WalletUintInput;
  limitPrice: WalletUintInput;
}
export interface TwapConfigInput {
  side: NativeSideInput;
  totalQuantity: WalletUintInput;
  limitPrice: WalletUintInput;
  startTime: WalletUintInput;
  intervalSeconds: WalletUintInput;
  sliceCount: WalletUintInput;
}
export interface CancelTwapIntentInput extends WalletDomainInput {
  accountId: WalletUintInput;
  authNonce: WalletUintInput;
  nonce: WalletUintInput;
  deadline: WalletUintInput;
  twapId: Hex;
}

const headerFields = [
  { name: "accountId", type: "uint40" },
  { name: "market", type: "address" },
  { name: "authNonce", type: "uint256" },
  { name: "nonce", type: "uint64" },
  { name: "deadline", type: "uint64" },
  { name: "clientOrderId", type: "bytes32" },
  { name: "builder", type: "address" },
  { name: "builderFeePps", type: "uint32" }
] as const;
const fokFields = [
  { name: "side", type: "uint8" },
  { name: "quantity", type: "uint96" },
  { name: "limitPrice", type: "uint32" }
] as const;

function invalid(message: string): never {
  throw new KuruSdkError("INVALID_WALLET_INTENT", message);
}
function positive(value: WalletUintInput, bits: number, name: string): bigint {
  const result = assertUint(value, bits, name);
  if (result === 0n) invalid(`${name} must not be zero.`);
  return result;
}
function header(
  input: WalletActionInput,
  immediate = false,
  noBuilder = false
): WalletIntentHeader {
  const value = normalizeWalletIntentHeader(input.header);
  if (immediate && value.nonce === 0n) invalid("Immediate intent nonce must not be zero.");
  if (noBuilder && (value.builder !== zeroAddress || value.builderFeePps !== 0))
    invalid("Cancellation intents cannot carry a builder.");
  return value;
}
function fok(input: FokOrderInput) {
  const limitPrice = Number(positive(input.limitPrice, 32, "limitPrice"));
  if (limitPrice === 0xffffffff) invalid("limitPrice must be below uint32.max.");
  return {
    side: normalizeNativeSide(input.side),
    quantity: positive(input.quantity, 96, "quantity"),
    limitPrice
  };
}
function prepare<K extends string, F extends string>(
  input: WalletDomainInput,
  kind: K,
  functionName: F,
  primaryType: WalletTypedDataDefinition["primaryType"],
  fields: readonly WalletTypedDataField[],
  message: Readonly<Record<string, unknown>>,
  args: readonly unknown[]
) {
  const domain = tradingWalletDomain(input.wallet, input.chainId);
  const typedData: WalletTypedDataDefinition = {
    domain,
    primaryType,
    types: { [primaryType]: fields },
    message
  };
  return {
    kind,
    wallet: domain.verifyingContract as Address,
    functionName,
    args,
    typedData,
    digest: hashTypedData(typedData as Parameters<typeof hashTypedData>[0])
  };
}

export function prepareCancelAllIntent(input: WalletActionInput) {
  const h = header(input, true, true);
  return prepare(
    input,
    "cancelAll",
    "executeCancelAll",
    "CancelAllIntent",
    headerFields,
    { ...h },
    [h]
  );
}
export function prepareCancelOrdersByIdIntent(
  input: WalletActionInput & { orderIds: readonly WalletUintInput[] }
) {
  const h = header(input, true, true);
  if (input.orderIds.length === 0 || input.orderIds.length > 62)
    invalid("Provide between 1 and 62 order IDs.");
  const ids = input.orderIds.map((value) => positive(value, 64, "orderId"));
  if (new Set(ids).size !== ids.length) invalid("orderIds must be distinct.");
  const orderIdsHash = keccak256(encodeAbiParameters([{ type: "uint64[]" }], [ids]));
  return prepare(
    input,
    "cancelOrdersById",
    "executeCancelOrdersById",
    "CancelOrdersByIdIntent",
    [...headerFields, { name: "orderIdsHash", type: "bytes32" }],
    { ...h, orderIdsHash },
    [h, ids]
  );
}
export function prepareFokSwapIntent(input: WalletActionInput & { order: FokOrderInput }) {
  const h = header(input, true),
    order = fok(input.order);
  return prepare(
    input,
    "fokSwap",
    "executeFokSwap",
    "FokSwapIntent",
    [...headerFields, ...fokFields],
    { ...h, ...order },
    [h, order]
  );
}
export function prepareCreateFokSwapTriggerIntent(
  input: WalletActionInput & {
    order: FokOrderInput;
    triggerExpiry: WalletUintInput;
    conditionHash: Hex;
  }
) {
  const h = header(input),
    order = fok(input.order);
  const triggerExpiry = positive(input.triggerExpiry, 64, "triggerExpiry");
  const conditionHash = normalizeBytes32(input.conditionHash, "conditionHash");
  return prepare(
    input,
    "createFokSwapTrigger",
    "createFokSwapTrigger",
    "CreateFokSwapTriggerIntent",
    [
      ...headerFields,
      { name: "triggerExpiry", type: "uint64" },
      { name: "conditionHash", type: "bytes32" },
      ...fokFields
    ],
    { ...h, triggerExpiry, conditionHash, ...order },
    [h, triggerExpiry, conditionHash, order]
  );
}
export function prepareCreateTwapIntent(input: WalletActionInput & { config: TwapConfigInput }) {
  const h = header(input);
  const order = fok({
    side: input.config.side,
    quantity: input.config.totalQuantity,
    limitPrice: input.config.limitPrice
  });
  const config = {
    side: order.side,
    totalQuantity: order.quantity,
    limitPrice: order.limitPrice,
    startTime: positive(input.config.startTime, 64, "startTime"),
    intervalSeconds: Number(positive(input.config.intervalSeconds, 32, "intervalSeconds")),
    sliceCount: Number(positive(input.config.sliceCount, 32, "sliceCount"))
  };
  if (config.totalQuantity % BigInt(config.sliceCount) !== 0n)
    invalid("totalQuantity must be divisible by sliceCount.");
  assertUint(
    config.startTime + BigInt(config.intervalSeconds) * BigInt(config.sliceCount),
    64,
    "TWAP end time"
  );
  return prepare(
    input,
    "createTwap",
    "createTwap",
    "CreateTwapIntent",
    [
      ...headerFields,
      { name: "side", type: "uint8" },
      { name: "totalQuantity", type: "uint96" },
      { name: "limitPrice", type: "uint32" },
      { name: "startTime", type: "uint64" },
      { name: "intervalSeconds", type: "uint32" },
      { name: "sliceCount", type: "uint32" }
    ],
    { ...h, ...config },
    [h, config]
  );
}
export function prepareCancelTwapIntent(input: CancelTwapIntentInput) {
  const message = {
    accountId: positive(input.accountId, 40, "accountId"),
    authNonce: assertUint(input.authNonce, 256, "authNonce"),
    nonce: assertUint(input.nonce, 64, "nonce"),
    deadline: positive(input.deadline, 64, "deadline"),
    twapId: normalizeBytes32(input.twapId, "twapId", false)
  };
  return prepare(
    input,
    "cancelTwap",
    "cancelTwap",
    "CancelTwapIntent",
    [
      { name: "accountId", type: "uint40" },
      { name: "authNonce", type: "uint256" },
      { name: "nonce", type: "uint64" },
      { name: "deadline", type: "uint64" },
      { name: "twapId", type: "bytes32" }
    ],
    message,
    [message.accountId, message.authNonce, message.nonce, message.deadline, message.twapId]
  );
}
export function prepareEmitSignedDataIntent(
  input: WalletDomainInput & { data: Hex; nonce: WalletUintInput; deadline: WalletUintInput }
) {
  if (!isHex(input.data, { strict: true }) || input.data.length % 2 !== 0)
    invalid("data must be whole hex bytes.");
  const message = {
    data: input.data,
    nonce: assertUint(input.nonce, 256, "nonce"),
    deadline: positive(input.deadline, 64, "deadline")
  };
  return prepare(
    input,
    "emitSignedData",
    "emitSignedData",
    "EmitSignedData",
    [
      { name: "data", type: "bytes" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint64" }
    ],
    message,
    [message.data, message.nonce, message.deadline]
  );
}

export type PreparedWalletAction = ReturnType<
  | typeof prepareCancelAllIntent
  | typeof prepareCancelOrdersByIdIntent
  | typeof prepareFokSwapIntent
  | typeof prepareCreateFokSwapTriggerIntent
  | typeof prepareCreateTwapIntent
  | typeof prepareCancelTwapIntent
  | typeof prepareEmitSignedDataIntent
>;

/** Build direct contract calldata after signPreparedWalletIntent; HTTP Relay methods are a separate API. */
export function buildWalletActionRequest(
  intent: SignedWalletIntent<PreparedWalletAction>
): KuruContractRequest<typeof kuruTradingWalletAbi> {
  return {
    address: intent.wallet,
    abi: kuruTradingWalletAbi,
    functionName: intent.functionName,
    args: [...intent.args, normalizeWalletSignature(intent.signature)]
  };
}
/** Requires an authorized keeper; the execution report is receipt metadata. */
export function buildExecuteTwapSliceRequest(
  wallet: Address,
  twapId: Hex,
  executionReportHash: Hex
): KuruContractRequest<typeof kuruTradingWalletAbi> {
  return {
    address: wallet,
    abi: kuruTradingWalletAbi,
    functionName: "executeTwapSlice",
    args: [
      normalizeBytes32(twapId, "twapId", false),
      normalizeBytes32(executionReportHash, "executionReportHash")
    ]
  };
}
export function buildFinalizeTwapRequest(
  wallet: Address,
  twapId: Hex
): KuruContractRequest<typeof kuruTradingWalletAbi> {
  return {
    address: wallet,
    abi: kuruTradingWalletAbi,
    functionName: "finalizeTwap",
    args: [normalizeBytes32(twapId, "twapId", false)]
  };
}
