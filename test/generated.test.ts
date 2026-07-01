import { describe, expect, it } from "vitest";

import { contractAbis, contractMetadata } from "../src/generated";

describe("generated contract surface", () => {
  it("pins the committed contracts commit", () => {
    expect(contractMetadata.contractsCommit).toBe("393d122c40c70372373448a42612183d98fc3b34");
  });

  it("includes only the production ABI allowlist", () => {
    expect(Object.keys(contractAbis).sort()).toEqual([
      "AccountCore",
      "IERC20Metadata",
      "KuruIntentExecutor",
      "OrderBook",
      "SpotEngine",
      "SpotOrderBook",
      "SpotPeriphery",
      "SpotRouter"
    ]);

    for (const [name, metadata] of Object.entries(contractMetadata.artifacts)) {
      expect(name).not.toMatch(/Test|Mock|Harness|Bench/u);
      expect(metadata.artifact).not.toMatch(/\.t\.sol|Test|Mock|Harness|Bench/u);
      expect(metadata.abiSha256).toMatch(/^[0-9a-f]{64}$/u);
    }

    expect(Object.keys(contractMetadata.artifacts).sort()).toEqual([
      "AccountCore",
      "IERC20Metadata",
      "KuruIntentExecutor",
      "OrderBook",
      "SpotEngine",
      "SpotPeriphery",
      "SpotRouter"
    ]);
  });
});
