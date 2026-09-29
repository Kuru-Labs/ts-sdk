import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPublicClient,
  createWalletClient,
  createTestClient,
  http,
  encodeFunctionData,
  zeroAddress,
  zeroHash,
  type Abi,
  type Address,
  type Hex
} from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import * as sdk from "../../src";
import { contractAbis as abis, contractMetadata } from "../../src/generated";

const contractsDir = process.env.KURU_CONTRACTS_DIR;
describe.skipIf(!contractsDir)("pinned contracts integration", () => {
  const mnemonic = "test test test test test test test test test test test junk";
  const owner = mnemonicToAccount(mnemonic);
  const delegate = mnemonicToAccount(mnemonic, { addressIndex: 1 });
  const maker = mnemonicToAccount(mnemonic, { addressIndex: 2 });
  let anvil: ChildProcess | undefined;
  let publicClient: sdk.PublicClient;
  let wallet: ReturnType<typeof createWalletClient>;
  let testClient: ReturnType<typeof createTestClient>;
  let core: Address, market: Address, quote: Address, limiter: Address;
  let childId: bigint, rootId: bigint, makerId: bigint;
  let client: ReturnType<typeof sdk.createKuruClient>;
  let nonce = 1n;
  const signer = sdk.createLocalAccountWalletIntentSigner(delegate);
  const domain = { wallet: delegate.address, chainId: foundry.id };
  function artifact(name: string, file = name) {
    return JSON.parse(
      readFileSync(resolve(contractsDir!, "out", `${file}.sol`, `${name}.json`), "utf8")
    ) as { abi: Abi; bytecode: { object: Hex } };
  }
  async function receipt(hash: Hex) {
    const result = await publicClient.waitForTransactionReceipt({ hash });
    expect(result.status).toBe("success");
    return result;
  }
  async function deploy(name: string, args: readonly unknown[] = [], file = name) {
    const a = artifact(name, file);
    return (
      await receipt(
        await wallet.deployContract({
          abi: a.abi,
          bytecode: a.bytecode.object,
          args,
          account: owner,
          chain: foundry,
          gas: 30_000_000n
        })
      )
    ).contractAddress!;
  }
  async function send(request: sdk.KuruContractRequest, account = owner) {
    const simulation = await publicClient.simulateContract({ ...request, account } as any);
    return receipt(
      await wallet.writeContract({ ...simulation.request, account, chain: foundry } as any)
    );
  }
  async function call(
    address: Address,
    abi: Abi,
    functionName: string,
    args: readonly unknown[] = []
  ) {
    return send({ address, abi, functionName, args });
  }
  async function read(
    address: Address,
    abi: Abi,
    functionName: string,
    args: readonly unknown[] = []
  ) {
    return publicClient.readContract({ address, abi, functionName, args });
  }
  async function header() {
    return {
      accountId: childId,
      market,
      authNonce: await client.account.getAccountAuthorizationEpoch({ accountId: childId }),
      nonce: nonce++,
      deadline: (await publicClient.getBlock()).timestamp + 3600n,
      clientOrderId: zeroHash
    };
  }
  function logs(result: Awaited<ReturnType<typeof receipt>>) {
    return result.logs.flatMap((log) => {
      try {
        return [sdk.decodeKuruEventLog(log)];
      } catch {
        return [];
      }
    });
  }
  beforeAll(async () => {
    expect(
      execFileSync("git", ["rev-parse", "HEAD"], { cwd: contractsDir!, encoding: "utf8" }).trim()
    ).toBe(contractMetadata.contractsCommit);
    for (const [name, metadata] of Object.entries(contractMetadata.artifacts)) {
      const built = JSON.parse(
        readFileSync(resolve(contractsDir!, "out", metadata.artifact), "utf8")
      ) as { abi: Abi };
      expect(abis[name as keyof typeof abis]).toEqual(built.abi);
    }
    const reservation = createServer().listen(0, "127.0.0.1");
    await once(reservation, "listening");
    const port = (reservation.address() as { port: number }).port;
    await new Promise<void>((resolve) => reservation.close(() => resolve()));
    anvil = spawn(
      "anvil",
      [
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--chain-id",
        String(foundry.id),
        "--hardfork",
        "prague",
        "--disable-code-size-limit",
        "--gas-limit",
        "100000000",
        "--silent"
      ],
      { stdio: "pipe" }
    );
    let output = "";
    anvil.stderr?.on("data", (chunk) => {
      output += String(chunk);
    });
    const transport = http(`http://127.0.0.1:${port}`, { retryCount: 0 });
    publicClient = createPublicClient({ chain: foundry, transport, pollingInterval: 10 });
    wallet = createWalletClient({ chain: foundry, transport });
    testClient = createTestClient({ chain: foundry, transport, mode: "anvil" });
    for (let attempt = 0; ; attempt++) {
      if (anvil.exitCode !== null) throw new Error(`Anvil exited: ${output}`);
      try {
        await publicClient.getChainId();
        break;
      } catch {
        if (attempt === 100) throw new Error(`Anvil did not start: ${output}`);
        await delay(50);
      }
    }
    const authority = await deploy("ProtocolAuthority", [
      owner.address,
      owner.address,
      owner.address,
      owner.address
    ]);
    const coreImpl = await deploy("AccountCore");
    core = await deploy("ERC1967Proxy", [
      coreImpl,
      encodeFunctionData({
        abi: abis.AccountCore,
        functionName: "initialize",
        args: [owner.address, owner.address]
      })
    ]);
    await call(core, abis.AccountCore, "setAuthority", [authority]);
    limiter = await deploy("ERC1967Proxy", [
      await deploy("WithdrawalLimiter", [core]),
      encodeFunctionData({
        abi: abis.WithdrawalLimiter,
        functionName: "initialize",
        args: [owner.address, 10n ** 30n, 0n]
      })
    ]);
    await call(core, abis.AccountCore, "bindWithdrawalLimiter", [limiter]);
    const source = await deploy("ManualPriceSource", [core, 86400, [owner.address]]);
    await call(source, artifact("ManualPriceSource").abi, "publishPrice", [
      10n ** 18n,
      (await publicClient.getBlock()).timestamp
    ]);
    quote = await deploy("MockERC20", ["Quote", "QUOTE", 6], "SpotTestBase.t");
    for (const token of [zeroAddress, quote]) {
      await call(limiter, abis.WithdrawalLimiter, "setPriceSource", [token, source]);
      await call(core, abis.AccountCore, "configureSpotToken", [token, true]);
    }
    const router = await deploy("ERC1967Proxy", [
      await deploy("SpotRouter"),
      encodeFunctionData({
        abi: abis.SpotRouter,
        functionName: "initialize",
        args: [owner.address, core]
      })
    ]);
    await call(router, abis.SpotRouter, "setAuthority", [authority]);
    await call(core, abis.AccountCore, "setSpotRouter", [router]);
    await call(router, abis.SpotRouter, "setSpotOrderBookImplementation", [
      await deploy("OrderBook")
    ]);
    for (const token of [zeroAddress, quote])
      await call(router, abis.SpotRouter, "whitelistSpotToken", [token, true]);
    const deployed = await call(router, abis.SpotRouter, "deploySpotMarket", [
      zeroAddress,
      quote,
      100_000_000n,
      100,
      1,
      1,
      1n,
      10n ** 18n,
      0n,
      0n
    ]);
    const registered = logs(deployed).find(
      (log) => log.eventName === "SpotMarketRegistered" && "sizePrecision" in (log.args as object)
    );
    market = (registered!.args as any).orderBook as Address;
    client = sdk.createKuruClient({
      publicClient,
      walletClient: wallet,
      account: owner,
      addresses: { accountCore: core }
    });
    await receipt(
      await client.account.depositToOwner({
        rootOwner: owner.address,
        token: zeroAddress,
        amount: 10n ** 18n
      })
    );
    rootId = await client.account.getRootAccountId({ rootOwner: owner.address });
    await receipt(await client.account.createSubaccount({ rootOwner: owner.address }));
    childId = (await client.account.getSubaccounts({ rootAccountId: rootId }))[0]!;
    await receipt(
      await client.account.authorizeAccountSigner({
        account: owner.address,
        signer: delegate.address,
        permissions: 1,
        expiry: 0n
      })
    );
    const keeper = await deploy("KeeperAuthority", [owner.address]);
    await call(keeper, artifact("KeeperAuthority").abi, "grantKeeper", [owner.address]);
    const implementation = await deploy("KuruTradingWallet", [core, keeper, 3_600_000n]);
    const authorization = await wallet.signAuthorization({
      account: delegate,
      contractAddress: implementation,
      executor: owner.address
    });
    await receipt(
      await wallet.sendTransaction({
        account: owner,
        chain: foundry,
        to: owner.address,
        authorizationList: [authorization]
      })
    );
    const quoteAbi = artifact("MockERC20", "SpotTestBase.t").abi;
    await call(quote, quoteAbi, "mint", [maker.address, 1_000_000_000n]);
    await send(
      { address: quote, abi: quoteAbi, functionName: "approve", args: [core, 1_000_000_000n] },
      maker
    );
    await receipt(
      await client.account.depositToOwner({
        rootOwner: maker.address,
        token: quote,
        amount: 1_000_000_000n,
        account: maker
      })
    );
    makerId = await client.account.getRootAccountId({ rootOwner: maker.address });
  }, 120_000);
  afterAll(async () => {
    if (anvil && anvil.exitCode === null) {
      anvil.kill("SIGTERM");
      await once(anvil, "exit");
    }
  });

  it("funds a child, signs a wallet-v2 order, trades, returns funds and pays an explicit recipient", async () => {
    await receipt(
      await client.account.transferBetweenAccounts({
        fromAccountId: rootId,
        toAccountId: childId,
        token: zeroAddress,
        amount: 10n ** 18n
      })
    );
    expect(await client.spot.getBaseSizeMultiplier({ market })).toBe(10n ** 10n);
    const intent = await sdk.signPreparedWalletIntent(
      sdk.prepareBatchIntent({
        ...domain,
        header: await header(),
        orders: [{ side: "sell", quantity: 100_000_000n, price: 100n, tif: "gtc" }],
        cancelSlotIdxs: [],
        expectedOrderIds: []
      }),
      signer
    );
    // Test v1 rejection before consuming this nonce, to isolate the domain mismatch.
    const v1 = { ...intent.typedData, domain: { ...intent.typedData.domain, version: "1" } };
    await expect(
      publicClient.simulateContract({
        address: delegate.address,
        abi: abis.KuruTradingWallet,
        functionName: "executeBatch",
        args: [intent.header, intent.orders, [], [], await delegate.signTypedData(v1 as any)],
        account: owner
      } as any)
    ).rejects.toThrow();
    const placed = await call(delegate.address, abis.KuruTradingWallet, "executeBatch", [
      intent.header,
      intent.orders,
      intent.cancelSlotIdxs,
      intent.expectedOrderIds,
      intent.signature
    ]);
    const bookLog = logs(placed).find((log) => log.eventName === "BookUpdatesPacked")!;
    expect(sdk.decodeBookUpdatesPacked((bookLog.args as any).packedUpdates)[0]).toMatchObject({
      outcome: sdk.OperationOutcome.RESTED,
      operationIndex: 0,
      isSentinel: false
    });
    expect(
      await client.spot.estimateSwap({ market, userId: makerId, isBuy: true, amountIn: 1_000_000n })
    ).toMatchObject({ amountInUsed: 1_000_000n, amountOut: 10n ** 18n });
    const filled = await receipt(
      await client.spot.swap({
        market,
        userId: makerId,
        isBuy: true,
        amountIn: 1_000_000n,
        minAmountOut: 10n ** 18n,
        deadline: intent.header.deadline,
        account: maker
      })
    );
    const trade = logs(filled).find((log) => log.eventName === "TradesPacked")!;
    expect(sdk.decodeTradesPacked((trade.args as any).packedTrades)[0]).toMatchObject({
      outcome: sdk.OperationOutcome.NONE,
      operationIndex: undefined
    });
    expect(await client.account.getBalance({ accountId: childId, token: quote })).toBe(1_000_000n);
    await receipt(
      await client.account.transferBetweenAccounts({
        fromAccountId: childId,
        toAccountId: rootId,
        token: quote,
        amount: 1_000_000n
      })
    );
    await receipt(
      await client.account.withdraw({
        rootAccountId: rootId,
        token: quote,
        amount: 1_000_000n,
        recipient: delegate.address
      })
    );
    expect(
      await read(quote, artifact("MockERC20", "SpotTestBase.t").abi, "balanceOf", [
        delegate.address
      ])
    ).toBe(1_000_000n);
  }, 60_000);

  it("accepts existing replace and trigger signatures under v2 and decodes the compact trigger getter", async () => {
    const packedOps = sdk.encodePackedCancelOp(0);
    const expectedOrderIds = [(1n << 64n) - 1n];
    const replace = await sdk.signPreparedWalletIntent(
      sdk.prepareReplaceBySlotIntent({
        ...domain,
        header: await header(),
        packedOps,
        expectedOrderIds
      }),
      signer
    );
    const result = await call(
      delegate.address,
      abis.KuruTradingWallet,
      "executeReplaceBySlotPacked",
      [replace.header, replace.packedOps, replace.expectedOrderIds, replace.signature]
    );
    const book = logs(result).find((log) => log.eventName === "BookUpdatesPacked")!;
    expect(sdk.decodeBookUpdatesPacked((book.args as any).packedUpdates)[0]).toMatchObject({
      outcome: sdk.OperationOutcome.CANCEL_NOOP,
      operationIndex: 0,
      isSentinel: true
    });
    const triggerExpiry = (await publicClient.getBlock()).timestamp + 3600n;
    const trigger = await sdk.signPreparedWalletIntent(
      sdk.prepareCreateReplaceTriggerIntent({
        ...domain,
        header: await header(),
        packedOps,
        expectedOrderIds,
        triggerExpiry,
        conditionHash: zeroHash
      }),
      signer
    );
    await call(delegate.address, abis.KuruTradingWallet, "createReplaceTrigger", [
      trigger.header,
      trigger.triggerExpiry,
      trigger.conditionHash,
      trigger.packedOps,
      trigger.expectedOrderIds,
      trigger.signature
    ]);
    const stored = (await read(delegate.address, abis.KuruTradingWallet, "getTrigger", [
      trigger.digest
    ])) as any;
    expect(stored.expiry).toBe(triggerExpiry);
    expect(stored.action).toBe(1);
    expect(stored.status).toBe(1);
    const cancel = await sdk.signPreparedWalletIntent(
      sdk.prepareCancelTriggerIntent({ ...domain, ...(await header()), triggerId: trigger.digest }),
      signer
    );
    await call(delegate.address, abis.KuruTradingWallet, "cancelTrigger", [
      cancel.accountId,
      cancel.authNonce,
      cancel.nonce,
      cancel.deadline,
      cancel.triggerId,
      cancel.signature
    ]);
    const batchTrigger = await sdk.signPreparedWalletIntent(
      sdk.prepareCreateBatchTriggerIntent({
        ...domain,
        header: await header(),
        orders: [{ side: "sell", quantity: 10_000_000n, price: 110n, tif: "gtc" }],
        cancelSlotIdxs: [],
        expectedOrderIds: [],
        triggerExpiry,
        conditionHash: zeroHash
      }),
      signer
    );
    await call(delegate.address, abis.KuruTradingWallet, "createBatchTrigger", [
      batchTrigger.header,
      batchTrigger.triggerExpiry,
      batchTrigger.conditionHash,
      batchTrigger.orders,
      batchTrigger.cancelSlotIdxs,
      batchTrigger.expectedOrderIds,
      batchTrigger.signature
    ]);
  }, 60_000);

  it("accepts signed child creation and approved payouts under AccountCore v1", async () => {
    const params = {
      accountCore: core,
      chainId: foundry.id,
      rootOwner: owner.address,
      authorizer: owner.address,
      subaccountSeq: 2,
      authNonce: await client.account.getAccountAuthorizationEpoch({ accountId: rootId }),
      deadline: (await publicClient.getBlock()).timestamp + 3600n
    };
    await receipt(
      await client.account.createSubaccountBySig({
        ...params,
        signature: await owner.signTypedData(sdk.buildCreateSubaccountTypedData(params))
      })
    );
    expect(await client.account.getSubaccounts({ rootAccountId: rootId })).toHaveLength(2);
    await receipt(
      await client.account.deposit({ rootAccountId: rootId, token: zeroAddress, amount: 1_000n })
    );
    await call(core, abis.AccountCore, "setWithdrawalAuthority", [owner.address]);
    const withdrawal = {
      account: owner.address,
      token: zeroAddress,
      recipient: maker.address,
      amount: 100n,
      nonce: await client.account.getApprovedWithdrawalNonce({ rootOwner: owner.address }),
      deadline: params.deadline,
      authorityEpoch: await client.account.getWithdrawalAuthorityEpoch()
    };
    const signature = await owner.signTypedData(
      sdk.buildApprovedWithdrawalTypedData({ accountCore: core, chainId: foundry.id, withdrawal })
    );
    const before = await publicClient.getBalance({ address: maker.address });
    await send(
      sdk.buildFulfillApprovedWithdrawalRequest({ accountCore: core, withdrawal, signature })
    );
    expect(await publicClient.getBalance({ address: maker.address })).toBe(before + 100n);
    const preview = sdk.buildPreviewWithdrawalRequest({
      withdrawalLimiter: limiter,
      token: zeroAddress,
      amount: 1n
    });
    expect(
      (
        (await read(
          preview.address,
          preview.abi,
          preview.functionName,
          preview.args
        )) as readonly unknown[]
      )[2]
    ).toBe(true);
  }, 60_000);

  it("accepts all added wallet-v2 signed actions and executes a TWAP slice", async () => {
    const run = async (intent: sdk.PreparedWalletAction) =>
      send(sdk.buildWalletActionRequest(await sdk.signPreparedWalletIntent(intent, signer)));
    await receipt(
      await client.account.deposit({
        rootAccountId: rootId,
        token: zeroAddress,
        amount: 10n ** 18n
      })
    );
    await receipt(
      await client.account.transferBetweenAccounts({
        fromAccountId: rootId,
        toAccountId: childId,
        token: zeroAddress,
        amount: 10n ** 18n
      })
    );
    await receipt(
      await client.spot.batch({
        market,
        userId: makerId,
        orders: [{ side: "buy", quantity: 1_000_000_000n, price: 90n, tif: "gtc" }],
        account: maker
      })
    );
    await run(
      sdk.prepareFokSwapIntent({
        ...domain,
        header: await header(),
        order: { side: "sell", quantity: 10_000_000n, limitPrice: 90 }
      })
    );
    await run(sdk.prepareCancelAllIntent({ ...domain, header: await header() }));
    await receipt(
      await client.spot.batch({
        market,
        userId: childId,
        orders: [{ side: "sell", quantity: 10_000_000n, price: 110n, tif: "gtc" }]
      })
    );
    await run(
      sdk.prepareCancelOrdersByIdIntent({
        ...domain,
        header: await header(),
        orderIds: [await client.spot.getOrderId({ market, userId: childId, slotIdx: 0 })]
      })
    );
    const expiry = (await publicClient.getBlock()).timestamp + 3600n;
    await run(
      sdk.prepareCreateFokSwapTriggerIntent({
        ...domain,
        header: await header(),
        triggerExpiry: expiry,
        conditionHash: zeroHash,
        order: { side: "sell", quantity: 10_000_000n, limitPrice: 90 }
      })
    );
    const config = {
      side: "sell" as const,
      totalQuantity: 20_000_000n,
      limitPrice: 90,
      startTime: (await publicClient.getBlock()).timestamp + 100n,
      intervalSeconds: 10,
      sliceCount: 2
    };
    const canceled = sdk.prepareCreateTwapIntent({ ...domain, header: await header(), config });
    await run(canceled);
    await run(
      sdk.prepareCancelTwapIntent({
        ...domain,
        accountId: childId,
        authNonce: await client.account.getAccountAuthorizationEpoch({ accountId: childId }),
        nonce: nonce++,
        deadline: expiry,
        twapId: canceled.digest
      })
    );
    const active = sdk.prepareCreateTwapIntent({ ...domain, header: await header(), config });
    await run(active);
    await testClient.setNextBlockTimestamp({ timestamp: config.startTime });
    await testClient.mine({ blocks: 1 });
    await send(sdk.buildExecuteTwapSliceRequest(delegate.address, active.digest, zeroHash));
    await testClient.setNextBlockTimestamp({ timestamp: config.startTime + 20n });
    await testClient.mine({ blocks: 1 });
    await send(sdk.buildFinalizeTwapRequest(delegate.address, active.digest));
    const state = (await read(delegate.address, abis.KuruTradingWallet, "getTwap", [
      active.digest
    ])) as any;
    expect(state.status).toBe(3);
    expect(state.successfulSliceCount).toBe(1);
    await run(
      sdk.prepareEmitSignedDataIntent({ ...domain, data: "0xcafe", nonce: 0n, deadline: expiry })
    );
    expect(await read(delegate.address, abis.KuruTradingWallet, "signedDataNonce")).toBe(1n);
  }, 60_000);
});
