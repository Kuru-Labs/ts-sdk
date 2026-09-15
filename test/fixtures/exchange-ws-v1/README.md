# Exchange WebSocket v1 golden frames

These files are copied byte-for-byte from Exchange Core's
`crates/publisher/tests/fixtures/exchange-ws-v1` corpus. Exchange Core generates them through the
production Publisher encoders and verifies them against fresh encoder output in its Rust tests.

The SDK tests decode these files unchanged. Do not replace the happy-path corpus with frames
constructed in TypeScript; local writers remain useful only for malformed-frame and decoder-edge
tests.

`trades.bin` models a lifecycle-promoted market frame containing multiple records from one
packed match. The `user-trades*.bin` fixtures cover taker, active-maker, mixed-maker, self-fill,
and passive-liquidity routing. Their `users` tuple is always ordered as taker then maker, with
zero as the passive-maker sentinel.

`l2-delta.bin`, `trades.bin`, and `lifecycle-market.bin` carry deliberately non-adjacent
`previousMarketSeq` values. They pin that replay linkage is scoped to the exact
`(market, view, topic)` stream and must not be inferred as `marketSeq - 1`.

User-order snapshots contain complete open-order state. `user-orders-delta.bin` contains a
`created` event, while `user-orders-trade.bin`, `user-orders-cancelled.bin`, and
`user-orders-rab-reduced.bin` each pin one causal event variant and its exact source tuple.

The five user-trades fixtures were refreshed from Exchange Core KUR-1717 commit
`abe3014`. Active rows are 151 bytes and passive rows are 145 bytes. They pin
historical fees, match termination, and distinct source hashes/indices across
variants; transaction hashes differ from the frame's block ID.

KUR-1719 refreshes `trades.bin`, all five user-trade fixtures and all four user-order
delta fixtures with per-event Unix-seconds timestamps (1,700,000,000). These are
copied from the authoritative Rust encoder; other fixtures are unchanged.

KUR-1726 appends snapshot `createdAt` at row offset 96, making each row 104 bytes.
