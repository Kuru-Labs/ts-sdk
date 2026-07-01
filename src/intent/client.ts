import type { Address } from "viem";

import type { KuruClientConfig } from "../types";
import { executeWrite, requireConfiguredAddress } from "../utils";
import { buildExecuteBatchRequest, buildExecuteReplaceBySlotPackedRequest } from "./requests";
import {
  buildBatchIntentTypedData,
  buildReplaceBySlotIntentTypedData,
  normalizeIntentHeader
} from "./typed-data";
import type { ExecuteBatchParams, ExecuteReplaceBySlotPackedParams } from "./types";

function resolveIntentExecutor(config: KuruClientConfig, override?: Address): Address {
  return requireConfiguredAddress(config.addresses, "intentExecutor", override);
}

export function createIntentClient(config: KuruClientConfig) {
  return {
    normalizeIntentHeader,
    buildBatchIntentTypedData,
    buildReplaceBySlotIntentTypedData,
    buildExecuteBatchRequest: (
      params: Omit<ExecuteBatchParams, "intentExecutor"> & { intentExecutor?: Address }
    ) =>
      buildExecuteBatchRequest({
        ...params,
        intentExecutor: resolveIntentExecutor(config, params.intentExecutor)
      }),
    buildExecuteReplaceBySlotPackedRequest: (
      params: Omit<ExecuteReplaceBySlotPackedParams, "intentExecutor"> & {
        intentExecutor?: Address;
      }
    ) =>
      buildExecuteReplaceBySlotPackedRequest({
        ...params,
        intentExecutor: resolveIntentExecutor(config, params.intentExecutor)
      }),
    executeBatch: (
      params: Omit<ExecuteBatchParams, "intentExecutor"> & { intentExecutor?: Address }
    ) =>
      executeWrite({
        config,
        request: buildExecuteBatchRequest({
          ...params,
          intentExecutor: resolveIntentExecutor(config, params.intentExecutor)
        }),
        overrides: params
      }),
    executeReplaceBySlotPacked: (
      params: Omit<ExecuteReplaceBySlotPackedParams, "intentExecutor"> & {
        intentExecutor?: Address;
      }
    ) =>
      executeWrite({
        config,
        request: buildExecuteReplaceBySlotPackedRequest({
          ...params,
          intentExecutor: resolveIntentExecutor(config, params.intentExecutor)
        }),
        overrides: params
      })
  };
}
