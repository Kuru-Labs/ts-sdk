import type { Address } from "viem";

import { spotOrderBookAbi } from "../generated";
import type { KuruContractRequest } from "../utils";
import { normalizeClientOrderId } from "../utils";
import { normalizeNativeOrders } from "./orders";
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

function spotRequest(
  market: Address,
  functionName: string,
  args: readonly unknown[],
  abi = spotOrderBookAbi
): KuruContractRequest<typeof spotOrderBookAbi> {
  return {
    address: market,
    abi,
    functionName,
    args
  };
}

function spotOverloadAbi(name: string, inputTypes: readonly string[]): typeof spotOrderBookAbi {
  const fragment = spotOrderBookAbi.find(
    (item) =>
      item.type === "function" &&
      item.name === name &&
      item.inputs.length === inputTypes.length &&
      item.inputs.every((input, index) => input.type === inputTypes[index])
  );

  if (!fragment) {
    throw new Error(`Missing ${name}(${inputTypes.join(",")}) ABI fragment.`);
  }

  return [fragment] as unknown as typeof spotOrderBookAbi;
}

export function buildBatchRequest(
  params: BatchParams
): KuruContractRequest<typeof spotOrderBookAbi> {
  const orders = normalizeNativeOrders(params.orders);
  const cancelSlotIdxs = [...(params.cancelSlotIdxs ?? [])];
  const clientOrderId = params.clientOrderId;
  const builderConfig = params.builderConfig;

  if (clientOrderId && builderConfig) {
    return spotRequest(
      params.market,
      "batch",
      [params.userId, orders, cancelSlotIdxs, clientOrderId, builderConfig],
      spotOverloadAbi("batch", ["uint40", "tuple[]", "uint8[]", "bytes32", "tuple"])
    );
  }

  if (clientOrderId) {
    return spotRequest(
      params.market,
      "batch",
      [params.userId, orders, cancelSlotIdxs, clientOrderId],
      spotOverloadAbi("batch", ["uint40", "tuple[]", "uint8[]", "bytes32"])
    );
  }

  if (builderConfig) {
    return spotRequest(
      params.market,
      "batch",
      [params.userId, orders, cancelSlotIdxs, builderConfig],
      spotOverloadAbi("batch", ["uint40", "tuple[]", "uint8[]", "tuple"])
    );
  }

  return spotRequest(
    params.market,
    "batch",
    [params.userId, orders, cancelSlotIdxs],
    spotOverloadAbi("batch", ["uint40", "tuple[]", "uint8[]"])
  );
}

export function buildCancelBySlotsRequest(
  params: UserMarketParams & { cancelSlotIdxs: readonly number[]; clientOrderId?: `0x${string}` }
): KuruContractRequest<typeof spotOrderBookAbi> {
  const base = {
    market: params.market,
    userId: params.userId,
    orders: [],
    cancelSlotIdxs: params.cancelSlotIdxs
  };

  return params.clientOrderId
    ? buildBatchRequest({ ...base, clientOrderId: params.clientOrderId })
    : buildBatchRequest(base);
}

export function buildCancelAllOrdersRequest(
  params: UserMarketParams
): KuruContractRequest<typeof spotOrderBookAbi> {
  return spotRequest(params.market, "cancelAllOrders", [params.userId]);
}

export function buildProtocolCancelBySlotsRequest(
  params: UserMarketParams & { slotIdxs: readonly number[]; clientOrderId?: `0x${string}` }
): KuruContractRequest<typeof spotOrderBookAbi> {
  const slotIdxs = [...params.slotIdxs];
  if (params.clientOrderId) {
    return spotRequest(
      params.market,
      "protocolCancelBySlots",
      [params.userId, slotIdxs, params.clientOrderId],
      spotOverloadAbi("protocolCancelBySlots", ["uint40", "uint8[]", "bytes32"])
    );
  }
  return spotRequest(
    params.market,
    "protocolCancelBySlots",
    [params.userId, slotIdxs],
    spotOverloadAbi("protocolCancelBySlots", ["uint40", "uint8[]"])
  );
}

export function buildReplaceBySlotPackedRequest(
  params: ReplaceBySlotPackedParams
): KuruContractRequest<typeof spotOrderBookAbi> {
  if (params.clientOrderId && params.builderConfig) {
    return spotRequest(
      params.market,
      "replaceBySlotPacked",
      [params.userId, params.packedOps, params.clientOrderId, params.builderConfig],
      spotOverloadAbi("replaceBySlotPacked", ["uint40", "bytes", "bytes32", "tuple"])
    );
  }

  if (params.clientOrderId) {
    return spotRequest(
      params.market,
      "replaceBySlotPacked",
      [params.userId, params.packedOps, params.clientOrderId],
      spotOverloadAbi("replaceBySlotPacked", ["uint40", "bytes", "bytes32"])
    );
  }

  if (params.builderConfig) {
    return spotRequest(
      params.market,
      "replaceBySlotPacked",
      [params.userId, params.packedOps, params.builderConfig],
      spotOverloadAbi("replaceBySlotPacked", ["uint40", "bytes", "tuple"])
    );
  }

  return spotRequest(
    params.market,
    "replaceBySlotPacked",
    [params.userId, params.packedOps],
    spotOverloadAbi("replaceBySlotPacked", ["uint40", "bytes"])
  );
}

export function buildSwapRequest(params: SwapParams): KuruContractRequest<typeof spotOrderBookAbi> {
  const args = [
    params.userId,
    params.isBuy,
    params.amountIn,
    params.minAmountOut,
    params.deadline
  ] as const;

  if (params.builderConfig) {
    return spotRequest(
      params.market,
      "swap",
      [...args, params.builderConfig],
      spotOverloadAbi("swap", ["uint40", "bool", "uint128", "uint128", "uint64", "tuple"])
    );
  }

  return spotRequest(
    params.market,
    "swap",
    args,
    spotOverloadAbi("swap", ["uint40", "bool", "uint128", "uint128", "uint64"])
  );
}

export function buildEstimateSwapRequest(
  params: EstimateSwapParams
): KuruContractRequest<typeof spotOrderBookAbi> {
  if (params.userId !== undefined && params.builderFeePps !== undefined) {
    return spotRequest(
      params.market,
      "estimateSwap",
      [params.userId, params.isBuy, params.amountIn, params.builderFeePps],
      spotOverloadAbi("estimateSwap", ["uint40", "bool", "uint128", "uint32"])
    );
  }

  if (params.userId !== undefined) {
    return spotRequest(
      params.market,
      "estimateSwap",
      [params.userId, params.isBuy, params.amountIn],
      spotOverloadAbi("estimateSwap", ["uint40", "bool", "uint128"])
    );
  }

  if (params.builderFeePps !== undefined) {
    return spotRequest(
      params.market,
      "estimateSwap",
      [params.isBuy, params.amountIn, params.builderFeePps],
      spotOverloadAbi("estimateSwap", ["bool", "uint128", "uint32"])
    );
  }

  return spotRequest(
    params.market,
    "estimateSwap",
    [params.isBuy, params.amountIn],
    spotOverloadAbi("estimateSwap", ["bool", "uint128"])
  );
}

export function buildMintPassiveLiquidityRequest(
  params: MintPassiveLiquidityParams
): KuruContractRequest<typeof spotOrderBookAbi> {
  const clientOrderId = normalizeClientOrderId(params.clientOrderId);
  const hasSlippage = params.minSharesOut !== undefined || params.deadline !== undefined;

  if (hasSlippage) {
    return spotRequest(params.market, "mintPassiveLiquidity", [
      params.userId,
      params.lowPrice,
      params.baseAmount,
      params.quoteAmount,
      params.minSharesOut ?? 0n,
      params.deadline ?? 0n,
      clientOrderId
    ]);
  }

  return spotRequest(params.market, "mintPassiveLiquidity", [
    params.userId,
    params.lowPrice,
    params.baseAmount,
    params.quoteAmount,
    clientOrderId
  ]);
}

export function buildBatchMintPassiveLiquidityRequest(
  params: BatchMintPassiveLiquidityParams
): KuruContractRequest<typeof spotOrderBookAbi> {
  return spotRequest(params.market, "batchMintPassiveLiquidity", [
    params.userId,
    params.mints.map((mint) => ({ ...mint })),
    params.deadline,
    normalizeClientOrderId(params.clientOrderId)
  ]);
}

export function buildBurnPassiveLiquidityRequest(
  params: BurnPassiveLiquidityParams
): KuruContractRequest<typeof spotOrderBookAbi> {
  return spotRequest(params.market, "burnPassiveLiquidity", [
    params.userId,
    params.positionId,
    params.sharesToBurn,
    normalizeClientOrderId(params.clientOrderId)
  ]);
}

export function buildClaimPassiveFeesRequest(
  params: ClaimPassiveFeesParams
): KuruContractRequest<typeof spotOrderBookAbi> {
  return spotRequest(params.market, "claimPassiveFees", [
    params.userId,
    params.positionId,
    normalizeClientOrderId(params.clientOrderId)
  ]);
}
