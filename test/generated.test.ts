import { describe, expect, it } from "vitest";

import { contractAbis, contractMetadata } from "../src/generated";

describe("generated contract surface", () => {
  it("pins the committed contracts commit", () => {
    expect(contractMetadata.contractsCommit).toBe("cdac5ae1311ce4793f80d604d25f9713fcfed57d");
  });

  it("includes only the production ABI allowlist", () => {
    expect(Object.keys(contractAbis).sort()).toEqual([
      "AccountCore",
      "IERC20Metadata",
      "KuruTradingWallet",
      "OrderBook",
      "SpotPeriphery",
      "SpotRouter",
      "WithdrawalLimiter"
    ]);

    for (const [name, metadata] of Object.entries(contractMetadata.artifacts)) {
      expect(name).not.toMatch(/Test|Mock|Harness|Bench/u);
      expect(metadata.artifact).not.toMatch(/\.t\.sol|Test|Mock|Harness|Bench/u);
      expect(metadata.abiSha256).toMatch(/^[0-9a-f]{64}$/u);
    }

    expect(Object.keys(contractMetadata.artifacts).sort()).toEqual([
      "AccountCore",
      "IERC20Metadata",
      "KuruTradingWallet",
      "OrderBook",
      "SpotPeriphery",
      "SpotRouter",
      "WithdrawalLimiter"
    ]);

    const walletFunctions = contractAbis.KuruTradingWallet.filter(
      (
        item
      ): item is Extract<(typeof contractAbis.KuruTradingWallet)[number], { type: "function" }> =>
        item.type === "function"
    ).map((item) => item.name);
    expect(walletFunctions).toEqual(
      expect.arrayContaining([
        "cancelTrigger",
        "createBatchTrigger",
        "createReplaceTrigger",
        "executeBatch",
        "executeReplaceBySlotPacked"
      ])
    );
  });
});
