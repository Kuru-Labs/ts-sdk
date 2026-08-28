import { hashTypedData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it, vi } from "vitest";

import { KuruSdkError } from "../src/errors";
import { encodePackedReplaceOp } from "../src/spot";
import {
  buildCreateReplaceTriggerTypedData,
  buildReplaceBySlotTypedData,
  createLocalAccountAuthorizationSigner,
  createLocalAccountWalletIntentSigner,
  hashCancelSlotIndexes,
  hashEip7702Authorization,
  hashExpectedOrderIds,
  hashNativeOrders,
  hashPackedOperations,
  normalizeWalletIntentHeader,
  prepareBatchIntent,
  prepareCancelTriggerIntent,
  prepareCreateBatchTriggerIntent,
  prepareCreateReplaceTriggerIntent,
  prepareReplaceBySlotIntent,
  recoverWalletIntentSigner,
  signEip7702Authorization,
  signBatchIntent,
  signCancelTriggerIntent,
  signCreateBatchTriggerIntent,
  signCreateReplaceTriggerIntent,
  signPreparedWalletIntent
} from "../src/trading-wallet";

const wallet = "0xe05fcc23807536bee418f142d19fa0d21bb0cff7";
const market = "0x4444444444444444444444444444444444444444";
const builder = "0x5555555555555555555555555555555555555555";
const delegate = "0x6666666666666666666666666666666666666666";
const clientOrderId = "0xcafe180852699cf66d5ab83e4e05b686fa149145d5192bc8ff558663685e51f6";
const conditionHash = "0x88a41890afadf18430a6d52216dd90e1f1066f96e727cae434915d1ceccf4331";
const triggerId = "0xe64e811ade8107631b6f2a7e31c624fa50a0f7202d3add579d26186c7a684cc5";
const packedOps = "0x0000000000000000000000000000000000000000000000000000000000000003";
const expectedOrderIds = [31n, (1n << 64n) - 1n] as const;
const cancelSlotIdxs = [3, 5] as const;
const orders = [
  {
    side: "buy",
    quantity: 1_000_000n,
    price: 123_400n,
    tif: "gtc",
    executionInstruction: "none",
    minSizeAfterBlock: 0n
  },
  {
    side: "sell",
    quantity: 2_000_000n,
    price: 123_500n,
    tif: "ioc",
    executionInstruction: "none",
    minSizeAfterBlock: 0n
  }
] as const;

const headerInput = {
  accountId: 123n,
  market,
  authNonce: 9n,
  nonce: 1_720_000_000_123n,
  deadline: 1_720_000_030n,
  clientOrderId,
  builder,
  builderFeePps: 42
} as const;

describe("KuruTradingWallet hashes and typed data", () => {
  it("matches the pinned Solidity and Go payload hashes", () => {
    expect(hashPackedOperations(packedOps)).toBe(
      "0xc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b"
    );
    expect(hashExpectedOrderIds(expectedOrderIds)).toBe(
      "0x92fd465869a65b4177ce5cd810c1d2c9c1eff106727936a5f517b908740caf6f"
    );
    expect(hashCancelSlotIndexes(cancelSlotIdxs)).toBe(
      "0xf7d4801f4a555b01422942d1f138a36b6e77e9ccc150b701be7a9394ddd4130d"
    );
    expect(hashNativeOrders(prepareBatchIntent(validBatchInput()).orders)).toBe(
      "0x16288488f394fc0c4b4968e529c0fe282ca7ec13a5978e41ebb8a2afed2babe1"
    );
    expect(hashPackedOperations("0x")).toBe(
      "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
    );
    expect(hashExpectedOrderIds([])).toBe(
      "0x569e75fc77c1a856f6daaf9e69d8a9566ca34aa47f9133711ce065a571af0cfd"
    );
  });

  it("matches all pinned wallet intent digests", () => {
    const batch = prepareBatchIntent(validBatchInput());
    expect(batch.digest).toBe("0x10a944f5200156360213a0577437f192af408f4a827d93960594eaaa1e6fb837");

    const createBatch = prepareCreateBatchTriggerIntent({
      ...validBatchInput(),
      triggerExpiry: 1_720_003_600n,
      conditionHash
    });
    expect(createBatch.digest).toBe(
      "0xb8a977cbc92d4a4f82116fe895c02b11df692ab3138cf60477520f5554f652a2"
    );

    const normalizedHeader = normalizeWalletIntentHeader(headerInput);
    const replaceTypedData = buildReplaceBySlotTypedData({
      wallet,
      chainId: 143,
      header: normalizedHeader,
      packedOpsHash: hashPackedOperations(packedOps),
      expectedOrderIdsHash: hashExpectedOrderIds(expectedOrderIds)
    });
    const createReplaceTypedData = buildCreateReplaceTriggerTypedData({
      wallet,
      chainId: 143,
      header: normalizedHeader,
      triggerExpiry: 1_720_003_600n,
      conditionHash,
      packedOpsHash: hashPackedOperations(packedOps),
      expectedOrderIdsHash: hashExpectedOrderIds(expectedOrderIds)
    });
    expect(replaceTypedData.domain.verifyingContract).toBe(wallet);
    expect(replaceTypedData.domain.name).toBe("KuruTradingWallet");
    expect(replaceTypedData.primaryType).toBe("ReplaceBySlotIntent");
    expect(createReplaceTypedData.primaryType).toBe("CreateReplaceTriggerIntent");
    expect(hashTypedData(replaceTypedData as Parameters<typeof hashTypedData>[0])).toBe(
      "0xe8df7afc21b74f24428e1fc83a36a455295e73518fd0030dac9718f41ff8ef27"
    );
    expect(hashTypedData(createReplaceTypedData as Parameters<typeof hashTypedData>[0])).toBe(
      "0x6176c68b88f25eb78b1e596becab44fda964c0f6ca2583c9aaa7151ed11ab507"
    );

    const cancel = prepareCancelTriggerIntent({
      wallet,
      chainId: 143,
      accountId: 123n,
      authNonce: 9n,
      nonce: 1_720_000_000_123n,
      deadline: 1_720_000_030n,
      triggerId
    });
    expect(cancel.digest).toBe(
      "0x6b17e946f652211f341f94edf44b3a05785ab3e021b48ad4b1dc5fc30c2d26c4"
    );
  });

  it("recovers the pinned wallet signature", async () => {
    const typedData = buildReplaceBySlotTypedData({
      wallet,
      chainId: 143,
      header: normalizeWalletIntentHeader(headerInput),
      packedOpsHash: hashPackedOperations(packedOps),
      expectedOrderIdsHash: hashExpectedOrderIds(expectedOrderIds)
    });
    const signature =
      "0x2b879d2f884a63000331fac5163771d1d5f60353375f6bcebcbb856cb7db926259bf55ce412cfea544d0a1675c2c485629eb2043a3cdba6a0ad4f3ef9174f19b1c";
    await expect(recoverWalletIntentSigner(typedData, signature)).resolves.toBe(wallet);
  });
});

describe("wallet intent preparation and signing", () => {
  it("signs locally without any chain-state dependency", async () => {
    const account = privateKeyToAccount(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    );
    const intent = prepareReplaceBySlotIntent({
      wallet: account.address,
      chainId: 143,
      header: {
        accountId: headerInput.accountId,
        market: headerInput.market,
        authNonce: headerInput.authNonce,
        nonce: headerInput.nonce,
        deadline: headerInput.deadline,
        clientOrderId: headerInput.clientOrderId
      },
      packedOps,
      expectedOrderIds: [31n]
    });
    const signer = createLocalAccountWalletIntentSigner(account);
    const signSpy = vi.spyOn(signer, "signTypedData");
    const signed = await signPreparedWalletIntent(intent, signer);

    expect(signSpy).toHaveBeenCalledOnce();
    expect(signed.signature).toMatch(/^0x[0-9a-f]{130}$/u);
    await expect(recoverWalletIntentSigner(intent.typedData, signed.signature)).resolves.toBe(
      account.address.toLowerCase()
    );
  });

  it("rejects invalid relationships and canonical order violations before signing", () => {
    expect(() =>
      prepareReplaceBySlotIntent({
        wallet,
        chainId: 143,
        header: headerInput,
        packedOps,
        expectedOrderIds: []
      })
    ).toThrow(KuruSdkError);

    expect(() =>
      prepareBatchIntent({
        ...validBatchInput(),
        cancelSlotIdxs: [3, 3],
        expectedOrderIds: [1n, 2n]
      })
    ).toThrow(/duplicate slot/u);

    expect(() =>
      prepareBatchIntent({
        ...validBatchInput(),
        orders: [{ ...orders[0], tif: "ioc", executionInstruction: "postOnly" }]
      })
    ).toThrow(/POST_ONLY/u);

    expect(() =>
      prepareBatchIntent({
        ...validBatchInput(),
        orders: [{ ...orders[0], price: 0xffff_ffffn }]
      })
    ).toThrow(/below uint32.max/u);

    expect(() =>
      prepareReplaceBySlotIntent({
        wallet,
        chainId: 143,
        header: headerInput,
        packedOps: encodePackedReplaceOp({
          slotIdx: 0,
          side: "buy",
          price: 0xffff_ffffn,
          size: 1n
        }),
        expectedOrderIds: [1n]
      })
    ).toThrow(/below uint32.max/u);
  });

  it("rejects deterministically unusable deadlines and immediate nonces", () => {
    expect(() =>
      prepareReplaceBySlotIntent({
        wallet,
        chainId: 143,
        header: { ...headerInput, deadline: 0n },
        packedOps,
        expectedOrderIds: [31n]
      })
    ).toThrow(/deadline must not be zero/u);

    expect(() =>
      prepareBatchIntent({
        ...validBatchInput(),
        header: { ...headerInput, nonce: 0n }
      })
    ).toThrow(/Immediate intent nonce must not be zero/u);

    expect(() =>
      prepareReplaceBySlotIntent({
        wallet,
        chainId: 143,
        header: { ...headerInput, nonce: 0n },
        packedOps,
        expectedOrderIds: [31n]
      })
    ).toThrow(/Immediate intent nonce must not be zero/u);

    expect(() =>
      prepareCancelTriggerIntent({
        wallet,
        chainId: 143,
        accountId: 123n,
        authNonce: 9n,
        nonce: 1n,
        deadline: 0n,
        triggerId
      })
    ).toThrow(/deadline must not be zero/u);
  });

  it("keeps unordered trigger nonce zero valid but rejects zero trigger expiry", () => {
    const trigger = prepareCreateReplaceTriggerIntent({
      wallet,
      chainId: 143,
      header: { ...headerInput, nonce: 0n },
      packedOps,
      expectedOrderIds: [31n],
      triggerExpiry: 1_720_003_600n,
      conditionHash
    });
    expect(trigger.header.nonce).toBe(0n);

    expect(() =>
      prepareCreateBatchTriggerIntent({
        ...validBatchInput(),
        triggerExpiry: 0n,
        conditionHash
      })
    ).toThrow(/triggerExpiry must not be zero/u);
  });

  it("rejects a signer bound to another wallet before asking it to sign", async () => {
    const intent = prepareReplaceBySlotIntent({
      wallet,
      chainId: 143,
      header: headerInput,
      packedOps,
      expectedOrderIds: [31n]
    });
    const signTypedData = vi.fn();
    await expect(
      signPreparedWalletIntent(intent, {
        address: "0x1111111111111111111111111111111111111111",
        signTypedData
      })
    ).rejects.toMatchObject({ code: "SIGNER_MISMATCH" });
    expect(signTypedData).not.toHaveBeenCalled();
  });

  it("signs every supported wallet intent through the convenience APIs", async () => {
    const account = privateKeyToAccount(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    );
    const signer = createLocalAccountWalletIntentSigner(account);
    const domainInput = { wallet: account.address, chainId: 143 } as const;
    const header = {
      accountId: 123n,
      market,
      authNonce: 9n,
      nonce: 1_720_000_000_123n,
      deadline: 1_720_000_030n,
      clientOrderId
    } as const;

    const signed = await Promise.all([
      signBatchIntent(
        {
          ...domainInput,
          header,
          orders: [orders[0]],
          cancelSlotIdxs: [],
          expectedOrderIds: []
        },
        signer
      ),
      signCreateReplaceTriggerIntent(
        {
          ...domainInput,
          header,
          packedOps,
          expectedOrderIds: [31n],
          triggerExpiry: 1_720_003_600n,
          conditionHash
        },
        signer
      ),
      signCreateBatchTriggerIntent(
        {
          ...domainInput,
          header,
          orders: [orders[0]],
          cancelSlotIdxs: [],
          expectedOrderIds: [],
          triggerExpiry: 1_720_003_600n,
          conditionHash
        },
        signer
      ),
      signCancelTriggerIntent(
        {
          ...domainInput,
          accountId: 123n,
          authNonce: 9n,
          nonce: 1_720_000_000_124n,
          deadline: 1_720_000_030n,
          triggerId
        },
        signer
      )
    ]);

    expect(signed.map((value) => value.kind)).toEqual([
      "batch",
      "createReplaceTrigger",
      "createBatchTrigger",
      "cancelTrigger"
    ]);
    expect(signed.every((value) => value.signature.length === 132)).toBe(true);
  });
});

describe("EIP-7702 authorization", () => {
  const goldenSignature = {
    r: "0x022e97771a237d09a9ccf821b6995f8388ddd8f9c730a27aa3603b77aa0a9d80",
    s: "0x1225d3a73d6505c2c545ada3803b2ac675bfead5fb387f18f426592d9f17111c",
    yParity: 0
  } as const;

  it("matches the pinned authorization digest", () => {
    expect(hashEip7702Authorization({ chainId: 143, delegate, nonce: 7n })).toBe(
      "0x9313b61d120343e4f444c13a83248850aefc17fca2245ce9d6fdf38d0d95f4b0"
    );
  });

  it("uses an explicit nonce without calling a public client", async () => {
    const getTransactionCount = vi.fn();
    const signAuthorization = vi.fn().mockResolvedValue(goldenSignature);
    const signed = await signEip7702Authorization({
      authority: wallet,
      chainId: 143,
      delegate,
      nonce: 7n,
      publicClient: { getTransactionCount },
      signer: { address: wallet, signAuthorization }
    });

    expect(getTransactionCount).not.toHaveBeenCalled();
    expect(signAuthorization).toHaveBeenCalledOnce();
    expect(signed).toMatchObject({ authority: wallet, delegate, nonce: 7n, yParity: 0 });
  });

  it("fetches the pending authority nonce exactly once when omitted", async () => {
    const getTransactionCount = vi.fn().mockResolvedValue(7);
    const signAuthorization = vi.fn().mockResolvedValue(goldenSignature);
    await signEip7702Authorization({
      authority: wallet,
      chainId: 143,
      delegate,
      publicClient: { getTransactionCount },
      signer: { address: wallet, signAuthorization }
    });

    expect(getTransactionCount).toHaveBeenCalledOnce();
    expect(getTransactionCount).toHaveBeenCalledWith({ address: wallet, blockTag: "pending" });
    expect(signAuthorization).toHaveBeenCalledOnce();
  });

  it("supports the Viem private-key account adapter", async () => {
    const account = privateKeyToAccount(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    );
    const signed = await signEip7702Authorization({
      authority: account.address,
      chainId: 143,
      delegate,
      nonce: 7n,
      signer: createLocalAccountAuthorizationSigner(account)
    });
    expect(signed.authority).toBe(account.address.toLowerCase());
    expect(signed.nonce).toBe(7n);
  });

  it("fails closed when the optional nonce has no resolver", async () => {
    await expect(
      signEip7702Authorization({
        authority: wallet,
        chainId: 143,
        delegate,
        signer: { address: wallet, signAuthorization: vi.fn() }
      })
    ).rejects.toMatchObject({ code: "MISSING_NONCE_RESOLVER" });
  });

  it("wraps nonce lookup failures without asking the signer to sign", async () => {
    const signAuthorization = vi.fn();
    await expect(
      signEip7702Authorization({
        authority: wallet,
        chainId: 143,
        delegate,
        nonceResolver: vi.fn().mockRejectedValue(new Error("rpc unavailable")),
        signer: { address: wallet, signAuthorization }
      })
    ).rejects.toMatchObject({ code: "NONCE_RESOLUTION_FAILED" });
    expect(signAuthorization).not.toHaveBeenCalled();
  });
});

function validBatchInput() {
  return {
    wallet,
    chainId: 143,
    header: headerInput,
    orders,
    cancelSlotIdxs,
    expectedOrderIds
  } as const;
}
