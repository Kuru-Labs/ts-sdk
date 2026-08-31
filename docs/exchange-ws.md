# Exchange WebSocket decoding

Exchange Gateway control messages are JSON, while stream data messages are fixed-width binary
frames. Use the shared decoder instead of parsing those frames in application or React-store code.
Wire version 1 carries a big-endian `feedEpoch` in every frame. The decoder exposes it as `bigint`;
sequence cursors are only meaningful within that feed epoch.

```ts
import { decodeExchangeWsMessage } from "@kuru-labs/ts-sdk/exchange-ws";

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
        console.log(frame.globalUserSeq, frame.upserts);
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
import { decodeL2BookFrame, decodeUserTradesFrame } from "@kuru-labs/ts-sdk/exchange-ws";
```

They perform the same validation as the generic decoder and also reject a valid frame of the wrong
kind.

## Numeric units

All decoded `u64`, `i64`, `u128`, and `i128` fields are JavaScript `bigint`. Do not coerce them to
`number`.

Persist replay cursors as `(feedEpoch, marketSeq)` or `(feedEpoch, globalUserSeq)`. When a frame's
`feedEpoch` differs from the installed store epoch, discard the old state and resynchronize instead
of comparing the two epochs' sequence numbers.

- L2 book, BBO, and all-mids fields named `priceX18`, `totalBaseX18`, or `midpointX18` are already
  x18 fixed-point values on the wire.
- L2 deltas, market trades, user orders, and user trades expose native `priceTick` and base-quantity
  values. Converting those fields requires the market's price and size precision metadata.
- User balances remain in each token's native decimal domain.

Market and user trade frames both expose `recordIndex`. The stable identity of a market fill is
`(marketAddress, tradeId, recordIndex)`; do not substitute its array position inside a batch.

## User-order slots

User-order snapshots and delta upserts expose the physical order-book slot as `slotIdx`. Delta
removals carry the same field, so clients can remove an order using its exact
`(marketAddress, orderId, slotIdx)` identity without recovering the slot from prior local state.

```ts
if (frame.kind === "userOrders") {
  for (const order of frame.upserts) {
    console.log(order.marketAddress, order.orderId, order.slotIdx);
  }
  for (const removal of frame.removals) {
    console.log(removal.marketAddress, removal.orderId, removal.slotIdx);
  }
}
```

## Lifecycle frames

Lifecycle kind `4` is an internal stream-control frame, not a subscribable topic. The generic
decoder still returns it so stream coordinators can advance their cursors and apply replay logic.
The `scope` discriminator identifies its market or user prefix. Most UI code should consume a
higher-level stream coordinator rather than render lifecycle frames.
`parentBlockId` is `null` for `blockVoted` and `blockFinalized`, whose fixed-width parent slot is
zero-filled by Exchange Core.

## Validation

The decoder fails closed with `KuruSdkError` when a frame has an invalid magic value, unsupported
version, unknown enum, impossible count, malformed optional value, nonzero reserved field,
truncation, or trailing data. Treat such an error as a resync/reconnect boundary; do not apply a
partially decoded frame.
