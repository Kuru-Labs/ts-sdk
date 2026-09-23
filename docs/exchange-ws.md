# Exchange WebSocket decoding

Exchange Gateway control messages are JSON, while stream data messages are fixed-width binary
frames. Use the shared decoder instead of parsing those frames in application or React-store code.
Wire version 1 carries a big-endian `feedEpoch` in every frame. The decoder exposes it as `bigint`;
sequence cursors are only meaningful within that feed epoch.

```ts
import { decodeExchangeWsMessage } from "@toxicflow-labs/ts-sdk/exchange-ws";

const socket = new WebSocket("wss://example.test/ws");
socket.binaryType = "arraybuffer";

socket.onmessage = async (message) => {
  if (typeof message.data === "string") {
    // Handle the JSON control-plane acknowledgement or error.
    return;
  }

  const frame = await decodeExchangeWsMessage(message.data);
  switch (frame.kind) {
    case "l2Book":
      console.log(frame.marketAddress, frame.bids, frame.asks);
      break;
    case "userOrders":
      if (frame.snapshot) {
        // Replace local order state at this authoritative same-view stream cut.
        console.log(frame.globalUserSeq, frame.orders);
      } else {
        // Apply causal created/trade/cancelled/RAB-reduced events in array order.
        console.log(frame.globalUserSeq, frame.events);
      }
      break;
  }
};
```

`decodeExchangeWsFrame` is the synchronous variant for `ArrayBuffer`, `Buffer`, `Uint8Array`,
`DataView`, and other array-buffer views. `decodeExchangeWsMessage` additionally accepts browser
`Blob` values through their `arrayBuffer()` method.

Topic-specific helpers are available when the subscription already identifies the expected frame:

```ts
import { decodeL2BookFrame, decodeUserTradesFrame } from "@toxicflow-labs/ts-sdk/exchange-ws";
```

They perform the same validation as the generic decoder and also reject a valid frame of the wrong
kind.

## Numeric units

All decoded `u64`, `i64`, `u128`, and `i128` fields are JavaScript `bigint`. Do not coerce them to
`number`.

Persist replay cursors as `(feedEpoch, marketSeq)` or `(feedEpoch, globalUserSeq)`. When a frame's
`feedEpoch` differs from the installed store epoch, discard the old state and resynchronize instead
of comparing the two epochs' sequence numbers.

Replayable market frames (`l2Delta`, market `trades`, and market-scoped lifecycle frames) expose
`previousMarketSeq`. A zero wire value decodes to `null`; otherwise it identifies the previous
publication in that exact `(market, view, topic)` stream. For an explicit replay cut `R`, accept the
first frame only when `marketSeq > R` and `previousMarketSeq === null || previousMarketSeq <= R`.
After that bridge, require every frame's `previousMarketSeq` to equal the last accepted
`marketSeq`. The predecessor may be much lower than `marketSeq`; never derive it as
`marketSeq - 1n`.

User orders, balances, and trades use the same sparse-cut rule with `previousGlobalUserSeq` and
`globalUserSeq`. Their sequence and predecessor fields are unchanged. After accepting the first replay frame, require
exact predecessor equality for every subsequent frame.

- Every public price (`price`, `lowPrice`, `midpoint`) is in native market price precision (pp). Do not scale it again.
- Every market/order/trade base quantity remains a native integer in market size precision, not
  token decimals or x18. Snapshot and BBO fields are `totalBase`, `activeBase`, and `passiveBase`.
- Native grouping `tickSize` is still a protocol tick count.
- Wire version remains 1 for a coordinated testnet rollout. Native event prices use i64;
  formatted L2/BBO/mid prices use i128. L2 delta tuples are 61 bytes, market trades 43,
  snapshot orders 104, and active/passive user trades 159/153. The intermediate x18
  event-price widening is removed. Older snapshot consumers assuming x18 units must
  also update, even where widths are unchanged. Deploy server and SDK together.
- User balances remain in each token's native decimal domain.

Market and user trade frames both expose `recordIndex`. The stable identity of a market fill is
`(marketAddress, tradeId, recordIndex)`; do not substitute its array position inside a batch.
Each user trade also exposes `users` as `[takerUserId, makerUserId]`. Passive-band fills use `0n`
for the maker because they have no individual maker; self-fills repeat the same user ID.

## User-order events

User-order snapshots expose complete open orders through `orders`, including
`createdAt: bigint` (original creation-block Unix seconds). Preserve it through
later updates; initialize it from a created delta’s `blockTimestamp`. Delta frames expose causal,
discriminated `events`: `created`, `trade`, `cancelled`, and `rab-reduced`. Every event retains its
canonical source tuple (`txHash`, `txIdx`, `logIdx`, `recordIdx`), and every affected order
retains its physical `slotIdx`.

```ts
if (frame.kind === "userOrders") {
  if (frame.snapshot) {
    for (const order of frame.orders) {
      console.log(order.marketAddress, order.orderId, order.slotIdx);
    }
  } else {
    for (const event of frame.events) {
      console.log(event.kind, event.source, event.marketAddress, event.orderId, event.slotIdx);
    }
  }
}
```

## Lifecycle frames

Lifecycle kind `4` is an internal stream-control frame, not a subscribable topic. The generic
decoder still returns it so stream coordinators can advance their cursors and apply replay logic.
The `scope` discriminator identifies its market or user prefix. Most UI code should consume a
higher-level stream coordinator rather than render lifecycle frames.
Market-scoped lifecycle frames carry `previousMarketSeq`; user-scoped lifecycle frames retain
`previousGlobalUserSeq`.
`parentBlockId` is `null` for `blockVoted` and `blockFinalized`, whose fixed-width parent slot is
zero-filled by Exchange Core.

## Validation

The decoder fails closed with `KuruSdkError` when a frame has an invalid magic value, unsupported
version, unknown enum, impossible count, malformed optional value, nonzero reserved field,
truncation, or trailing data. Treat such an error as a resync/reconnect boundary; do not apply a
partially decoded frame.

## User-trade fees and source identity (KUR-1717)

Kind 9 now exposes `txHash`, `txIdx`, `logIdx`, `effectiveTakerFeePps`,
`builderFeePps`, and `matchEnd` on each trade. Active FIFO liquidity additionally
exposes `liquidity.makerFeePps`; passive liquidity has no maker fee field.
Rates are historical event inputs in PPS (denominator 10,000,000).

A packed log is normalized into individual trade records. The current projector
emits one trade per publication; iterate `trades` in order without assuming an
entire match fits in one frame. Takers receive their active, passive, and self
fills. Makers receive only their own fills and may not receive the terminal row.
`matchEnd` closes one match; a log can contain several matches. Source identity
uses the block context, transaction/log fields, and existing `recordIndex`.

The decoder exposes inputs only; accounting and unfinished-match state belong to
the client. Preserve that state with its replay cursor, or replay from before an
unfinished match if the buffer is lost. Existing epoch/cursor semantics are unchanged.

Wire version remains 1 for testnet. This replaces the old 98/96-byte kind-9 rows;
coordinate server and decoder deployment. Do not use this decoder against the
old layout. See [the response changelog](user-trades-changelog.md).

## Canonical event time

`trades` and `userTrades` rows and all four `userOrders.events` variants expose
`blockTimestamp` as a bigint in Unix seconds. It is retained from the source
block proposal, so replay and live delivery agree even after newer blocks arrive.
Order snapshots and the shared block-context shape are unchanged.
See the [timestamp wire changelog](user-trades-changelog.md#kur-1719-canonical-event-timestamps).
