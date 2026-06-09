import { describe, expect, it } from "vitest";

import { contractAbis, contractMetadata } from "../src/generated";

describe("generated contract surface", () => {
  it("pins the committed contracts commit", () => {
    expect(contractMetadata.contractsCommit).toBe("bdc940e35da8d061c6f541bba6a84eeda10c83e2");
  });

  it("includes only the production ABI allowlist", () => {
    expect(Object.keys(contractAbis).sort()).toEqual([
      "AccountCore",
      "IERC20Metadata",
      "KuruIntentExecutor",
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
  });
});
