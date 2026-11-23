# Frontend migration to named SDK methods

Use this guide when replacing contract ABI imports and raw contract calls in `kuru-frontend-v2`.
It describes the SDK source in this repository. Publish or link a build containing these changes
before updating the frontend; the published `0.3.0` package does not contain the new methods.

## Client setup

Keep the frontend's existing Monad public client and RPC URL. Create one SDK client for reads,
without a wallet or trading session. Keep the current signer-linked SDK client for order signing
and submission paths.

```ts
import { createKuruClient, type KuruClientConfig } from "@toxicflow-labs/ts-sdk";

export const kuruReadClient = createKuruClient({
  publicClient: kuruPublicClient as unknown as KuruClientConfig["publicClient"],
  addresses: { accountCore: ACCOUNT_CORE_ADDRESS as Address }
});
```

The existing `getKuruClient()` throws before a trading signer is linked. Do not use it in
disconnected estimates, onboarding, or balance queries. Use the same `kuruPublicClient` in both
SDK clients so they share the frontend's RPC configuration.

## Replace contract reads

| Frontend caller | SDK call | Keep in the frontend |
| --- | --- | --- |
| `services/v2/orders/index.ts` | `kuruReadClient.spot.getLimitOrderSettings({ market, accountId: userId })` | Return the existing `{ tickSize, makerFee, takerFee, feeMultiplier }` shape to query consumers. Map `effectiveMakerFeePps` and `effectiveTakerFeePps` to the current fee names. |
| `hooks/contracts/order-execution.ts` | `kuru.account.getLastSeenOrderNonce({ wallet: session.account.address })` and `kuru.spot.getLimitOrderSettings({ market, accountId })` | Session/account checks, deadline checks, nonce reservation, and authorization epoch read. |
| `hooks/contracts/use-place-limit-order.ts` | Use the execution-time settings' `effectiveMakerFeePps` and `effectiveTakerFeePps` | Maker/taker selection and `expectedQuantity` mismatch rejection. Do not use a cached preview fee for submission. |
| `queries/use-estimate-market-order.ts` | `kuruReadClient.spot.estimateSwap(request)` | Zod validation, query key, debounce, retry setting, and formatting. The result has `bigint` `amountInUsed` and `amountOut`. |
| `services/v2/account/index.ts` | `account.getSignerAuthorizationNonce({ account: rootOwner })`, `account.allowance({ token, owner, spender })`, `account.getRootAccountId({ rootOwner })`, `account.isAuthorizedAccountSignerById({ accountId, signer, permission: 1 })` | Signer message, zero-root check (`0n`), permission, and session checks. These methods already existed in 0.3.0. |
| `services/v2/account/index.ts`, `queries/use-native-token-details.ts` | `kuruReadClient.account.getAssetBalance({ owner, token })` | Display formatting, query keys, refresh timing, and static MON/WMON metadata. Zero-address token reads native MON; other tokens read external ERC-20 `balanceOf`, not the internal Kuru account balance. |

`getLimitOrderSettings` reads market fees, then computes effective fees for the supplied account.
Its reads do not share a guaranteed block snapshot. Keep the current execution-time reread and
preview-quantity guard. Keep amounts, fees, and nonces as `bigint` until the existing display or
signature boundary.

For EIP-7702 onboarding, replace the separate code and pending-nonce reads with:

```ts
const delegation = await kuruReadClient.account.getDelegationState({
  authority: wallet.address,
  delegate: TRADING_WALLET_DELEGATE as Address
});
if (delegation.isDelegated) return undefined;

return signEip7702Authorization({
  authority: wallet.address,
  chainId: CHAIN_ID,
  delegate: TRADING_WALLET_DELEGATE as Address,
  nonce: delegation.pendingNonce,
  signer: createLocalAccountAuthorizationSigner(wallet)
});
```

The SDK checks the exact delegation target and reads the pending nonce only when delegation is
needed. Signing and the caller's current-session checks remain in the frontend.

## Prepare approval and deposit, then submit with the wallet

The preparation methods simulate and return only `{ to, data, value }`. They do not send a
transaction or wait for a receipt. Replace `writeContract` with the wallet's `sendTransaction`
for these requests. Keep the existing guard immediately before each wallet call.

```ts
if (!isAddressEqual(token, zeroAddress)) {
  const allowance = await kuruReadClient.account.allowance({
    token,
    owner: account,
    spender: ACCOUNT_CORE_ADDRESS as Address
  });

  if (allowance < amount) {
    const approval = await kuruReadClient.account.prepareTokenApproval({
      owner: account,
      token,
      spender: ACCOUNT_CORE_ADDRESS as Address,
      amount
    });
    assertNotGhostMode();
    const approvalHash = await walletClient.sendTransaction({
      ...approval,
      account,
      chain: monad
    });
    // Wait for the receipt, then reread allowance before depositing.
  }
}

const deposit = await kuruReadClient.account.prepareDeposit({ owner: account, token, amount });
assertNotGhostMode();
const depositHash = await walletClient.sendTransaction({ ...deposit, account, chain: monad });
```

`prepareDeposit` sets `value` to
`amount` for native MON and `0n` for ERC-20. Keep the separate approval/deposit hashes,
receipt checks, transaction tracking, and any current-session checks in the frontend. After an
approval receipt, reread `allowance` and require it to cover `amount`: simulation can succeed
before a later transaction returns `false` on-chain without reverting.

For LiFi, replace the bridge widget's account-core ABI encoding with the pure SDK method:

```ts
const call = kuruReadClient.account.encodeDepositCall({
  owner: rootOwner,
  token: usdcAddress,
  amount
});
```

Use `call.toContractAddress` and `call.toContractCallData` in the existing LiFi `ContractCall`.
The helper also returns `call.value`: native deposits need `amount`, while ERC-20 deposits use
`0n`. LiFi's `ContractCall` type has no value field, so the current USDC bridge path uses only
the address and calldata. Keep the widget's gas limit, approval target, one-unit probe, and
actual-amount quote logic.

## Keep receipt and generic RPC handling in the platform

The SDK methods added for this migration do not wait for receipts or decode receipt logs.
Keep `waitForTrackedReceipt`, onramp receipt polling, subaccount creation parsing, and chase/scale
outcome matching in the frontend. The frontend can keep the existing SDK packed-record decoders;
if the SDK ABI exports are later removed, keep only the event ABI fragments needed for receipt
parsing in the platform. A successful receipt alone does not confirm a resting or filled order.

Leave the generic nonce-store, block pulse, fee-reserve, and receipt RPC calls on the existing
frontend public client. Wallet connection and chain checks also stay in the frontend.
