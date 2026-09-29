# Development migration to auditFixes

This SDK targets contracts commit `cdac5ae1311ce4793f80d604d25f9713fcfed57d`.
The change is deliberately breaking: no old address-account APIs, wallet-v1 signing switch,
or legacy ABI aliases are retained. Configure addresses for that contract generation.

## Account operations

`depositToOwner` selects the contract's root-owner deposit entrypoint; `deposit` selects its
root-ID entrypoint. Both accept external funding only for roots. `createSubaccount` returns a
transaction hash; obtain the allocated child ID from `SubaccountCreated` or `getSubaccounts`.
Children use ledger IDs and inherit the root's trading signers. `createSubaccountBySig` uses
the expected next child sequence and root authorization epoch; creation does not advance the epoch.
Grant/revoke operations do advance it, invalidating old trading intents and standing actions.

Balance reads take `accountId`. Transfers use distinct IDs within one root family. Withdrawals
take `rootAccountId` and an explicit `recipient`; there is no implicit recipient fallback.
Positive builder fees are ordinary root free balance, so use the same withdrawal flow.

`buildApprovedWithdrawalTypedData` remains in the AccountCore version-1 domain. It requires
the root owner's signature, the root's approved-withdrawal nonce, and the current withdrawal
authority epoch. `buildFulfillApprovedWithdrawalRequest` must be submitted by that authority.
`buildInvalidateApprovedWithdrawalNonceRequest` builds owner nonce invalidation.
`buildPreviewWithdrawalRequest` queries the limiter's USD36 budget; it is informational and
does not establish balance, permission, freeze, or future execution success.

## Wallet actions

All wallet intent preparation uses EIP-712 version 2 and the delegated wallet EOA as verifying
contract. AccountCore remains version 1. EIP-7702 authorization chain ID and transaction nonce
are separate from the root authorization epoch and wallet intent nonce.

The existing batch/replace/trigger helpers now sign v2. New preparation helpers are
`prepareCancelOrdersByIdIntent`, `prepareCancelAllIntent`, `prepareFokSwapIntent`,
`prepareCreateFokSwapTriggerIntent`, `prepareCreateTwapIntent`, `prepareCancelTwapIntent`,
and `prepareEmitSignedDataIntent`. Pass their result to `signPreparedWalletIntent`, then
`buildWalletActionRequest` for direct contract submission.

TWAP quantity must divide evenly by slice count. Start time must be in the future at execution;
preparation is pure and does not fetch chain time. `buildExecuteTwapSliceRequest` is keeper-only;
`buildFinalizeTwapRequest` completes an expired schedule. Missed intervals are skipped.
Signed-data emission uses its own uint256 nonce from `signedDataNonce()`.

The existing six HTTP Relay methods are unchanged. New wallet actions have direct contract
builders; supporting them over HTTP requires matching server endpoints and a separately agreed
wire schema. The SDK does not invent relay method names.

## Units and events

Order quantities, packed sizes, and native FOK/TWAP quantities use market `sizePrecision`.
Prices use `pricePrecision`. `getBaseSizeMultiplier` gives raw base atoms per size unit.
Deposits, withdrawals, passive-mint amounts, and exact-input swap inputs/outputs use raw token
atoms. Do not convert `estimateSwap.amountIn` to price precision.

Packed decoders expose `outcome`, `operationIndex`, and (for trades) `replacementSlot`.
Untagged records have undefined metadata; native trade outcomes have no replacement slot.
`isSentinel` marks a zero-delta operation receipt and must be excluded from L2/L3 mutations.
Keep transaction log order: a call can emit several interleaved book/trade runs. Operation index
is local to the action, not globally unique. `MATCH_END` is the last fill, not proof of full fill.
Account balance snapshots are authoritative; do not additionally apply activity-event amounts.

## Contract-backed verification

Compile the pinned contracts checkout, including the existing token fixture:

```sh
forge build --skip test --skip script
forge build test/spot/SpotTestBase.t.sol
```

Then, from the SDK checkout:

```sh
KURU_CONTRACTS_DIR=/path/to/contracts pnpm exec vitest run test/integration/anvil.test.ts
```

The suite checks every committed ABI against those artifacts, starts a fresh Anvil instance,
deploys real proxies/implementations, delegates an EOA with EIP-7702, and exercises SDK calls.
Anvil uses Prague with the code-size limit disabled to accommodate the Monad contract build.
This tests ABI, signing and execution integration; it does not establish Monad gas behavior or
the state of any shared testnet deployment. Ordinary unit tests need no contracts checkout.
