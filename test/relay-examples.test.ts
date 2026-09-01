import { describe, expect, it } from "vitest";

import { stringifyForInspection } from "../examples/relay/inspect";

describe("Relay CLI inspection output", () => {
  it("serializes bigint fields in EIP-7702 authorization output", () => {
    const output = stringifyForInspection({
      accountAuthorization: "0x1234",
      authorization7702: { chainId: 10143, nonce: 7n }
    });

    expect(JSON.parse(output)).toEqual({
      accountAuthorization: "0x1234",
      authorization7702: { chainId: 10143, nonce: "7" }
    });
  });
});
