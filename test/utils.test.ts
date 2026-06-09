import { describe, expect, it, vi } from "vitest";

import { executeWrite } from "../src/utils";

const account = {
  address: "0x00000000000000000000000000000000000000aa",
  type: "local"
};

const request = {
  address: "0x0000000000000000000000000000000000000001",
  abi: [
    {
      type: "function",
      name: "setValue",
      inputs: [{ name: "value", type: "uint256" }],
      outputs: [],
      stateMutability: "nonpayable"
    }
  ],
  functionName: "setValue",
  args: [1n]
} as const;

describe("executeWrite", () => {
  it("reattaches the original local account after simulation", async () => {
    const simulateContract = vi.fn(() =>
      Promise.resolve({
        request: {
          ...request,
          account: account.address
        }
      })
    );
    const writeContract = vi.fn(() => Promise.resolve(`0x${"12".repeat(32)}` as const));

    await executeWrite({
      config: {
        publicClient: { simulateContract } as any,
        walletClient: { writeContract } as any,
        account: account as any,
        simulateWrites: true
      },
      request
    });

    expect(simulateContract).toHaveBeenCalledWith({ ...request, account });
    expect(writeContract).toHaveBeenCalledWith({ ...request, account });
  });
});
