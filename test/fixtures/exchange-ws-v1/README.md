# Exchange WebSocket v1 golden frames

These files are copied byte-for-byte from Exchange Core's
`crates/publisher/tests/fixtures/exchange-ws-v1` corpus. Exchange Core generates them through the
production Publisher encoders and verifies them against fresh encoder output in its Rust tests.

The SDK tests decode these files unchanged. Do not replace the happy-path corpus with frames
constructed in TypeScript; local writers remain useful only for malformed-frame and decoder-edge
tests.

`trades.bin` models a lifecycle-promoted market frame containing multiple records from one
packed match. User-trade outputs remain scoped to one source record and market, so active and
passive liquidity are represented by separate `user-trades*.bin` fixtures.
