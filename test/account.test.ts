import { zeroAddress } from "viem";
import { describe, expect, it, vi } from "vitest";

import { NATIVE_TOKEN_ADDRESS } from "../src/constants";
import {
  AccountPermission,
  buildDepositRequest,
  clientOrderIdFromString,
  createKuruClient,
  deadlineSeconds
} from "../src";

const accountCore = "0x0000000000000000000000000000000000000001";
const token = "0x0000000000000000000000000000000000000002";

describe("account helpers", () => {
  it("uses call value for native deposits", () => {
    const request = buildDepositRequest({
      accountCore,
      token: NATIVE_TOKEN_ADDRESS,
      amount: 10n
    });

    expect(request.value).toBe(10n);
    expect(request.args).toEqual([zeroAddress, 10n]);
  });

  it("does not attach call value for ERC20 deposits", () => {
    const request = buildDepositRequest({
      accountCore,
      token,
      amount: 10n
    });

    expect(request.value).toBeUndefined();
    expect(request.args).toEqual([token, 10n]);
  });

  it("builds deterministic client order ids and relative deadlines", () => {
    expect(clientOrderIdFromString("kuru-test")).toMatch(/^0x[0-9a-f]{64}$/u);
    expect(deadlineSeconds(60n)).toBeGreaterThan(BigInt(Math.floor(Date.now() / 1000)));
  });

  it("does not confuse account-domain params with the transaction signer", async () => {
    const signer = {
      address: "0x00000000000000000000000000000000000000aa",
      type: "local"
    };
    const targetAccount = "0x00000000000000000000000000000000000000bb";
    const delegate = "0x00000000000000000000000000000000000000cc";
    const simulateContract = vi.fn((request) =>
      Promise.resolve({
        request: {
          ...request,
          account: signer.address
        }
      })
    );
    const writeContract = vi.fn(() => Promise.resolve(`0x${"34".repeat(32)}` as const));

    const client = createKuruClient({
      publicClient: { simulateContract } as any,
      walletClient: { writeContract } as any,
      account: signer as any,
      addresses: { accountCore }
    });

    await client.account.authorizeAccountSigner({
      account: targetAccount,
      signer: delegate,
      permissions: AccountPermission.TRADE,
      expiry: 1n
    });

    const simulatedRequest = (simulateContract.mock.calls as any)[0][0];
    const writtenRequest = (writeContract.mock.calls as any)[0][0];

    expect(simulatedRequest.account).toBe(signer);
    expect(simulatedRequest.args).toEqual([targetAccount, delegate, AccountPermission.TRADE, 1n]);
    expect(writtenRequest.account).toBe(signer);
  });
});
