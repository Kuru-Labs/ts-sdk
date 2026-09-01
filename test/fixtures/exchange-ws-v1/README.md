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

User-order snapshots contain complete open-order state. `user-orders-delta.bin` contains a
`created` event, while `user-orders-trade.bin`, `user-orders-cancelled.bin`, and
`user-orders-rab-reduced.bin` each pin one causal event variant and its exact source tuple.
