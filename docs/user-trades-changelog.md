# userTrades response changelog

## KUR-1717: userTrades fee and source fields

This testnet change extends only `userTrades` (binary kind 9). Wire version
remains **1**, so update Gateway and SDK consumers together. The updated decoder
expects the new layout; it does not negotiate or decode the previous layout.

| Decoded field           | Previous response | Updated response                |
| ----------------------- | ----------------- | ------------------------------- |
| `liquidity.makerFeePps` | Absent            | `number`, active FIFO only      |
| `effectiveTakerFeePps`  | Absent            | `number`, every trade           |
| `builderFeePps`         | Absent            | `number`, every trade           |
| `matchEnd`              | Absent            | `boolean`, every trade          |
| `txHash`                | Absent            | 32-byte hex string, every trade |
| `txIdx`                 | Absent            | `number`, every trade           |
| `logIdx`                | Absent            | `number`, every trade           |

All existing fields retain their meaning. `users` remains `[takerId, makerId]`;
passive fills use maker ID `0n`. `recordIndex` keeps its existing name and source
position. Prices and sizes remain in market price/size precision. Fee rates are
historical event inputs in PPS, with denominator **10,000,000**. Passive fills
have no `makerFeePps` field. Builder address and calculated fee/position amounts
are not included.

### Binary layout

All integer fields are big-endian. The first trade row still begins at frame
offset 92. Row-relative offsets:

| Field                  | Active FIFO offset | Passive-band offset | Width          |
| ---------------------- | ------------------ | ------------------- | -------------- |
| `makerFeePps`          | 98                 | Not present         | 4 bytes        |
| `txHash`               | 102                | 96                  | 32 bytes       |
| `txIdx`                | 134                | 128                 | 4 bytes        |
| `logIdx`               | 138                | 132                 | 4 bytes        |
| `effectiveTakerFeePps` | 142                | 136                 | 4 bytes        |
| `builderFeePps`        | 146                | 140                 | 4 bytes        |
| `matchEnd`             | 150                | 144                 | 1 byte: 0 or 1 |

Active rows grow from **98 to 151 bytes**; passive rows grow from **96 to 145
bytes**. Advance by the row's liquidity-specific size. Existing fields retain
their offsets. The frame envelope, subscription request, epoch, sequence and
predecessor fields are unchanged.

### Delivery and integration

A packed log is normalized into separate trade records. The current projector
emits one trade per publication; clients should still iterate the `trades`
array. A match can span frames. Takers receive their active, passive and self
fills in order; makers receive only their own fills. `matchEnd` terminates the
source match, not a frame or a maker's filtered stream. One packed log can
contain multiple matches. Makers do not wait for another user's terminal fill.

Keep unfinished taker-match state consistent with the saved replay cursor. If
that buffer is lost, replay from the cursor before the unfinished match, or
bootstrap again when history is unavailable. Existing delivery and replay
mechanics are unchanged. No match buffering or position accounting is added to
Core or the SDK decoder. Public `trades`, `userOrders`, and other stream layouts
are unchanged.

## KUR-1719: canonical event timestamps

Each `trades` and `userTrades` row and each `userOrders.events` delta event now
exposes `blockTimestamp: bigint`: the canonical source block-header time in
Unix seconds. Live delivery, finalization promotion, and retained replay use the
same original value. This is not delivery time or finalization time.

An eight-byte big-endian `u64` is appended to each row/event:

| Row/event          | Timestamp offset | Previous size | New size |
| ------------------ | ---------------- | ------------- | -------- |
| Market trade       | 35               | 35            | 43       |
| Active user trade  | 151              | 151           | 159      |
| Passive user trade | 145              | 145           | 153      |
| Order created      | 147              | 147           | 155      |
| Order trade        | 128              | 128           | 136      |
| Order cancelled    | 80               | 80            | 88       |
| Order rab-reduced  | 96               | 96            | 104      |

Offsets are relative to each row/event. Existing fields and frame envelopes
keep their offsets. Order snapshots and all other stream layouts are unchanged.
Snapshot state time is not substituted for an order's historical creation time.

Wire version remains 1 for the coordinated testnet rollout. Update server and
decoder together; the older timestamp-free rows are incompatible with this
layout. Timestamp zero is a valid Unix epoch value. Missing timestamp metadata
fails server encoding; it is not replaced with zero or the current time.

## KUR-1726: open-order creation time

Every `userOrders` snapshot order exposes `createdAt: bigint`, the original
creation-block timestamp in Unix seconds. It remains unchanged through partial
fills and subsequent order updates and survives checkpoints and restarts.

The snapshot order row appends an eight-byte big-endian u64 at offset 96,
increasing its size from 96 to 104 bytes. Wire version remains 1 for testnet;
roll out the Gateway and SDK decoder together. Delta event layouts remain
unchanged: on a `created` event, use `blockTimestamp` to initialize the order's
`createdAt`; preserve that value when applying later trade or reduction events.
