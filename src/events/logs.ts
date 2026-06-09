import { decodeEventLog, type Abi, type Hex } from "viem";

import { contractAbis } from "../generated";

export interface KuruLogInput {
  data: Hex;
  topics: readonly [Hex, ...Hex[]] | readonly [];
}

export function combinedKuruAbi(): Abi {
  return Object.values(contractAbis).flat();
}

export function decodeKuruEventLog(log: KuruLogInput, abi: Abi = combinedKuruAbi()) {
  return decodeEventLog({
    abi,
    data: log.data,
    topics: [...log.topics]
  });
}
