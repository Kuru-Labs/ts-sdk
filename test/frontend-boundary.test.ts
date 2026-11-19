import { decodeFunctionData, zeroAddress } from "viem";
import { describe, expect, it, vi } from "vitest";

import { createKuruClient } from "../src";
import { accountCoreAbi, erc20MetadataAbi } from "../src/generated";

const accountCore = "0x0000000000000000000000000000000000000001";
const market = "0x0000000000000000000000000000000000000002";
const owner = "0x0000000000000000000000000000000000000003";
const token = "0x0000000000000000000000000000000000000004";

describe("ABI-free frontend methods", () => {
  it("reads effective fees for the requested account and market", async () => {
    const readContract = vi.fn(({ functionName, args }) => {
      const results: Record<string, number | bigint> = {
        tickSize: 4,
        makerFeePps: 100n,
        takerFeePps: 200n,
        PPS_MULTIPLIER: 1_000_000n,
        effectiveSpotMakerFeePps: 70,
        effectiveSpotTakerFeePps: 150
      };
      if (functionName === "effectiveSpotMakerFeePps") expect(args).toEqual([8n, 100n]);
      if (functionName === "effectiveSpotTakerFeePps") expect(args).toEqual([8n, 200n]);
      return Promise.resolve(results[functionName]);
    });
    const client = createKuruClient({
      publicClient: { readContract } as any,
      addresses: { accountCore }
    });

    await expect(client.spot.getLimitOrderSettings({ market, accountId: 8n })).resolves.toEqual({
      tickSize: 4n,
      effectiveMakerFeePps: 70n,
      effectiveTakerFeePps: 150n,
      feeMultiplier: 1_000_000n
    });
  });

  it("reads external balances and the wallet order nonce without a signer", async () => {
    const readContract = vi.fn(({ functionName }) =>
      Promise.resolve(functionName === "balanceOf" ? 19n : 25n)
    );
    const getBalance = vi.fn(() => Promise.resolve(11n));
    const client = createKuruClient({ publicClient: { readContract, getBalance } as any });

    await expect(client.account.getAssetBalance({ owner, token: zeroAddress })).resolves.toBe(11n);
    await expect(client.account.getAssetBalance({ owner, token })).resolves.toBe(19n);
    await expect(client.account.getLastSeenOrderNonce({ wallet: owner })).resolves.toBe(25n);
    expect(getBalance).toHaveBeenCalledWith({ address: owner });
  });

  it("simulates approval and deposit before returning ABI-free wallet requests", async () => {
    const simulateContract = vi.fn().mockResolvedValue({ request: {} });
    const client = createKuruClient({
      publicClient: { simulateContract } as any,
      addresses: { accountCore }
    });

    const approval = await client.account.prepareTokenApproval({
      owner,
      token,
      spender: accountCore,
      amount: 6n
    });
    expect(decodeFunctionData({ abi: erc20MetadataAbi, data: approval.data })).toMatchObject({
      functionName: "approve",
      args: [accountCore, 6n]
    });
    expect(approval).toMatchObject({ to: token, value: 0n });

    const deposit = await client.account.prepareDeposit({ owner, token: zeroAddress, amount: 9n });
    expect(decodeFunctionData({ abi: accountCoreAbi, data: deposit.data })).toMatchObject({
      functionName: "deposit",
      args: [owner, zeroAddress, 9n]
    });
    expect(deposit).toMatchObject({ to: accountCore, value: 9n });
    expect(simulateContract).toHaveBeenCalledTimes(2);
    expect(simulateContract.mock.calls[1]?.[0]).toMatchObject({ account: owner, value: 9n });
  });

  it("reads a pending nonce only when the wallet is not already delegated", async () => {
    const getCode = vi.fn(() => Promise.resolve(`0xef0100${token.slice(2)}`));
    const getTransactionCount = vi.fn(() => Promise.resolve(7));
    const client = createKuruClient({ publicClient: { getCode, getTransactionCount } as any });

    await expect(
      client.account.getDelegationState({ authority: owner, delegate: token })
    ).resolves.toEqual({ isDelegated: true });
    expect(getTransactionCount).not.toHaveBeenCalled();

    getCode.mockResolvedValue("0x");
    await expect(
      client.account.getDelegationState({ authority: owner, delegate: token })
    ).resolves.toEqual({ isDelegated: false, pendingNonce: 7n });
    expect(getTransactionCount).toHaveBeenCalledWith({ address: owner, blockTag: "pending" });
  });
});
