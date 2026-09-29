import {
  concatHex,
  decodeFunctionData,
  encodeFunctionData,
  numberToHex,
  zeroAddress,
  zeroHash
} from "viem";
import { describe, expect, it, vi } from "vitest";
import { accountCoreAbi } from "../src/generated";
import {
  buildDepositRequest,
  buildDepositToOwnerRequest,
  buildWithdrawRequest,
  buildTransferBetweenAccountsRequest,
  createKuruClient,
  decodeBookUpdatesPacked,
  decodeTradesPacked,
  OperationOutcome,
  prepareCreateTwapIntent,
  prepareCancelAllIntent,
  prepareCancelOrdersByIdIntent,
  prepareFokSwapIntent,
  prepareEmitSignedDataIntent
} from "../src";

const core = "0x0000000000000000000000000000000000000001";
const owner = "0x0000000000000000000000000000000000000002";
const domain = { wallet: owner, chainId: 143 } as const;
const header = {
  accountId: 1n,
  market: core,
  authNonce: 3n,
  nonce: 4n,
  deadline: 100n,
  clientOrderId: zeroHash
} as const;

describe("auditFixes account migration", () => {
  it("encodes both current deposit selectors, explicit recipient and ID transfers", () => {
    const byId = buildDepositRequest({
      accountCore: core,
      rootAccountId: 17n,
      token: zeroAddress,
      amount: 1n
    });
    const byOwner = buildDepositToOwnerRequest({
      accountCore: core,
      rootOwner: owner,
      token: zeroAddress,
      amount: 1n
    });
    const idData = encodeFunctionData(byId as any),
      ownerData = encodeFunctionData(byOwner as any);
    expect(idData.slice(0, 10)).not.toBe(ownerData.slice(0, 10));
    expect(decodeFunctionData({ abi: accountCoreAbi, data: idData }).args).toEqual([
      17,
      zeroAddress,
      1n
    ]);
    expect(decodeFunctionData({ abi: accountCoreAbi, data: ownerData }).args).toEqual([
      owner,
      zeroAddress,
      1n
    ]);
    const withdrawal = buildWithdrawRequest({
      accountCore: core,
      rootAccountId: 17n,
      token: zeroAddress,
      amount: 1n,
      recipient: owner
    });
    expect(
      decodeFunctionData({ abi: accountCoreAbi, data: encodeFunctionData(withdrawal as any) }).args
    ).toEqual([17, zeroAddress, 1n, owner]);
    const transfer = buildTransferBetweenAccountsRequest({
      accountCore: core,
      fromAccountId: 17n,
      toAccountId: 18n,
      token: zeroAddress,
      amount: 1n
    });
    expect(
      decodeFunctionData({ abi: accountCoreAbi, data: encodeFunctionData(transfer as any) }).args
    ).toEqual([17, 18, zeroAddress, 1n]);
  });
  it("normalizes viem uint40 reads to the SDK bigint ID type", async () => {
    const readContract = vi.fn(({ functionName }) =>
      Promise.resolve(functionName === "getSubaccounts" ? [2, 3] : 1)
    );
    const client = createKuruClient({
      publicClient: { readContract } as any,
      addresses: { accountCore: core }
    });
    expect(await client.account.getRootAccountId({ rootOwner: owner })).toBe(1n);
    expect(await client.account.getAccountRootId({ accountId: 2n })).toBe(1n);
    expect(await client.account.getSubaccounts({ rootAccountId: 1n })).toEqual([2n, 3n]);
    expect(client.account).not.toHaveProperty("depositForAccount");
    expect(client.account).not.toHaveProperty("withdrawFromAccount");
    expect(client.account).not.toHaveProperty("claimBuilderFees");
  });
});

describe("packed operation metadata", () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
    "decodes outcome %i independently from trade/book flags",
    (outcome) => {
      const flags = BigInt((outcome << 3) | 7);
      const trade = concatHex([
        numberToHex((flags << 200n) | 255n, { size: 32 }),
        numberToHex((61n << 128n) | 123n, { size: 32 })
      ]);
      expect(decodeTradesPacked(trade)[0]).toMatchObject({
        outcome,
        operationIndex: 255,
        replacementSlot: 61,
        makerIsBuy: true,
        makerIsPassive: true,
        isMatchEnd: true,
        tradeId: 123n
      });
      const book = concatHex([
        numberToHex((BigInt(outcome << 1) << 200n) | 255n, { size: 32 }),
        numberToHex(0, { size: 7 })
      ]);
      expect(decodeBookUpdatesPacked(book)[0]).toMatchObject({
        outcome,
        operationIndex: 255,
        isSentinel: true,
        isLive: false
      });
    }
  );
  it("preserves tagged deletes and distinguishes native completion from replacements", () => {
    const first = (1n << 216n) | (BigInt(OperationOutcome.CANCELLED << 1) << 200n);
    expect(
      decodeBookUpdatesPacked(
        concatHex([numberToHex(first, { size: 32 }), numberToHex(0, { size: 7 })])
      )[0]?.isSentinel
    ).toBe(false);
    const native = concatHex([
      numberToHex(BigInt((OperationOutcome.FILLED << 3) | 4) << 200n, { size: 32 }),
      numberToHex(255n << 128n, { size: 32 })
    ]);
    expect(decodeTradesPacked(native)[0]).toMatchObject({
      outcome: OperationOutcome.FILLED,
      operationIndex: 0,
      replacementSlot: undefined
    });
  });
});

describe("new wallet action validation", () => {
  it("rejects ambiguous cancellation and invalid FOK input", () => {
    expect(() =>
      prepareCancelAllIntent({ ...domain, header: { ...header, builder: core, builderFeePps: 1 } })
    ).toThrow();
    expect(() =>
      prepareCancelOrdersByIdIntent({ ...domain, header, orderIds: [1n, 1n] })
    ).toThrow();
    expect(() => prepareCancelOrdersByIdIntent({ ...domain, header, orderIds: [] })).toThrow();
    expect(() =>
      prepareFokSwapIntent({
        ...domain,
        header,
        order: { side: "buy", quantity: 0, limitPrice: 1 }
      })
    ).toThrow();
    expect(() =>
      prepareFokSwapIntent({
        ...domain,
        header,
        order: { side: "buy", quantity: 1, limitPrice: 0xffffffff }
      })
    ).toThrow();
  });
  it("checks slice divisibility, zero intervals and uint64 schedule end", () => {
    const config = {
      side: "buy" as const,
      totalQuantity: 6n,
      limitPrice: 100n,
      startTime: 100n,
      intervalSeconds: 10,
      sliceCount: 3
    };
    expect(() => prepareCreateTwapIntent({ ...domain, header, config })).not.toThrow();
    expect(() =>
      prepareCreateTwapIntent({ ...domain, header, config: { ...config, totalQuantity: 7n } })
    ).toThrow();
    expect(() =>
      prepareCreateTwapIntent({ ...domain, header, config: { ...config, intervalSeconds: 0 } })
    ).toThrow();
    expect(() =>
      prepareCreateTwapIntent({
        ...domain,
        header,
        config: { ...config, startTime: (1n << 64n) - 1n }
      })
    ).toThrow();
  });
  it("keeps signed-data nonce independent and validates byte encoding", () => {
    expect(
      prepareEmitSignedDataIntent({ ...domain, data: "0x", nonce: 0n, deadline: 100n }).typedData
        .primaryType
    ).toBe("EmitSignedData");
    expect(() =>
      prepareEmitSignedDataIntent({ ...domain, data: "0x123", nonce: 0n, deadline: 100n })
    ).toThrow();
  });
});
