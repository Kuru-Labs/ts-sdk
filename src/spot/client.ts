import { spotOrderBookAbi } from "../generated";
import type { KuruClientConfig, WriteOverrides } from "../types";
import { executeWrite, readContract } from "../utils";
import {
  buildBatchMintPassiveLiquidityRequest,
  buildBatchRequest,
  buildBurnPassiveLiquidityRequest,
  buildCancelAllOrdersRequest,
  buildCancelBySlotsRequest,
  buildClaimPassiveFeesRequest,
  buildEstimateSwapRequest,
  buildMintPassiveLiquidityRequest,
  buildProtocolCancelBySlotsRequest,
  buildReplaceBySlotPackedRequest,
  buildSwapRequest
} from "./requests";
import type {
  BatchMintPassiveLiquidityParams,
  BatchParams,
  BurnPassiveLiquidityParams,
  ClaimPassiveFeesParams,
  EstimateSwapParams,
  MintPassiveLiquidityParams,
  ReplaceBySlotPackedParams,
  SwapParams,
  UserMarketParams
} from "./types";

export function createSpotClient(config: KuruClientConfig) {
  return {
    buildBatchRequest,
    buildCancelBySlotsRequest,
    buildReplaceBySlotPackedRequest,
    buildSwapRequest,

    getMarketParams: (params: { market: `0x${string}` }) =>
      readContract(config, {
        address: params.market,
        abi: spotOrderBookAbi,
        functionName: "getMarketParams",
        args: []
      }),
    bestBidAsk: (params: { market: `0x${string}` }) =>
      readContract<readonly [bigint, bigint]>(config, {
        address: params.market,
        abi: spotOrderBookAbi,
        functionName: "bestBidAsk",
        args: []
      }),
    getL2Book: (params: { market: `0x${string}`; levels: bigint }) =>
      readContract(config, {
        address: params.market,
        abi: spotOrderBookAbi,
        functionName: "getL2Book",
        args: [params.levels]
      }),
    getOrderId: (params: UserMarketParams & { slotIdx: number }) =>
      readContract<bigint>(config, {
        address: params.market,
        abi: spotOrderBookAbi,
        functionName: "getOrderId",
        args: [params.userId, params.slotIdx]
      }),
    getOrderMinSizeAfterBlock: (params: UserMarketParams & { slotIdx: number }) =>
      readContract<bigint>(config, {
        address: params.market,
        abi: spotOrderBookAbi,
        functionName: "getOrderMinSizeAfterBlock",
        args: [params.userId, params.slotIdx]
      }),
    getPassiveBand: (params: { market: `0x${string}`; lowPrice: bigint }) =>
      readContract(config, {
        address: params.market,
        abi: spotOrderBookAbi,
        functionName: "getPassiveBand",
        args: [params.lowPrice]
      }),
    getPassivePosition: (params: { market: `0x${string}`; positionId: bigint }) =>
      readContract(config, {
        address: params.market,
        abi: spotOrderBookAbi,
        functionName: "getPassivePosition",
        args: [params.positionId]
      }),
    estimateSwap: (params: EstimateSwapParams) =>
      readContract(config, buildEstimateSwapRequest(params)),

    batch: (params: BatchParams) =>
      executeWrite({
        config,
        request: buildBatchRequest(params),
        overrides: params
      }),
    cancelBySlots: (
      params: UserMarketParams &
        WriteOverrides & {
        cancelSlotIdxs: readonly number[];
        clientOrderId?: `0x${string}`;
      }
    ) =>
      executeWrite({
        config,
        request: buildCancelBySlotsRequest(params),
        overrides: params
      }),
    cancelAllOrders: (params: UserMarketParams & WriteOverrides) =>
      executeWrite({
        config,
        request: buildCancelAllOrdersRequest(params),
        overrides: params
      }),
    protocolCancelBySlots: (
      params: UserMarketParams &
        WriteOverrides & {
        slotIdxs: readonly number[];
        clientOrderId?: `0x${string}`;
      }
    ) =>
      executeWrite({
        config,
        request: buildProtocolCancelBySlotsRequest(params),
        overrides: params
      }),
    replaceBySlotPacked: (params: ReplaceBySlotPackedParams) =>
      executeWrite({
        config,
        request: buildReplaceBySlotPackedRequest(params),
        overrides: params
      }),
    swap: (params: SwapParams) =>
      executeWrite({
        config,
        request: buildSwapRequest(params),
        overrides: params
      }),
    mintPassiveLiquidity: (params: MintPassiveLiquidityParams) =>
      executeWrite({
        config,
        request: buildMintPassiveLiquidityRequest(params),
        overrides: params
      }),
    batchMintPassiveLiquidity: (params: BatchMintPassiveLiquidityParams) =>
      executeWrite({
        config,
        request: buildBatchMintPassiveLiquidityRequest(params),
        overrides: params
      }),
    burnPassiveLiquidity: (params: BurnPassiveLiquidityParams) =>
      executeWrite({
        config,
        request: buildBurnPassiveLiquidityRequest(params),
        overrides: params
      }),
    claimPassiveFees: (params: ClaimPassiveFeesParams) =>
      executeWrite({
        config,
        request: buildClaimPassiveFeesRequest(params),
        overrides: params
      })
  };
}
