import { kuruIntentExecutorAbi } from "../generated";
import { normalizeNativeOrders } from "../spot";
import type { KuruContractRequest } from "../utils";
import { normalizeIntentHeader } from "./typed-data";
import type { ExecuteBatchParams, ExecuteReplaceBySlotPackedParams } from "./types";

export function buildExecuteReplaceBySlotPackedRequest(
  params: ExecuteReplaceBySlotPackedParams
): KuruContractRequest<typeof kuruIntentExecutorAbi> {
  return {
    address: params.intentExecutor,
    abi: kuruIntentExecutorAbi,
    functionName: "executeReplaceBySlotPacked",
    args: [normalizeIntentHeader(params.header), params.packedOps, params.signature]
  };
}

export function buildExecuteBatchRequest(
  params: ExecuteBatchParams
): KuruContractRequest<typeof kuruIntentExecutorAbi> {
  return {
    address: params.intentExecutor,
    abi: kuruIntentExecutorAbi,
    functionName: "executeBatch",
    args: [
      normalizeIntentHeader(params.header),
      normalizeNativeOrders(params.orders),
      [...(params.cancelSlotIdxs ?? [])],
      params.signature
    ]
  };
}
