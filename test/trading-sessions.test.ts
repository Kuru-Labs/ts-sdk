import { describe, expect, it } from "vitest";

import { getTradingSessions } from "../src";

const timezone = "America/New_York";
const at = (iso: string) => getTradingSessions("US", timezone, new Date(iso));

describe("getTradingSessions", () => {
  it("returns the frontend contract for a November overnight session", () => {
    expect(at("2026-11-17T03:00:00Z")).toEqual({
      exchangeRegion: "US",
      exchangeTimezone: timezone,
      status: { phase: "overnight", state: "open" },
      sessions: [
        {
          id: "overnight-2026-11-17",
          phase: "overnight",
          tradingDate: "2026-11-17",
          startsAt: "2026-11-17T01:00:00Z",
          endsAt: "2026-11-17T09:00:00Z"
        },
        {
          id: "pre-market-2026-11-17",
          phase: "pre_market",
          tradingDate: "2026-11-17",
          startsAt: "2026-11-17T09:00:00Z",
          endsAt: "2026-11-17T14:30:00Z"
        },
        {
          id: "regular-2026-11-17",
          phase: "regular",
          tradingDate: "2026-11-17",
          startsAt: "2026-11-17T14:30:00Z",
          endsAt: "2026-11-17T21:00:00Z"
        },
        {
          id: "post-market-2026-11-17",
          phase: "post_market",
          tradingDate: "2026-11-17",
          startsAt: "2026-11-17T21:00:00Z",
          endsAt: "2026-11-18T01:00:00Z"
        }
      ]
    });
  });

  it.each([
    ["2026-11-17T08:59:59.999Z", "overnight", "2026-11-17"],
    ["2026-11-17T09:00:00Z", "pre_market", "2026-11-17"],
    ["2026-11-17T14:30:00Z", "regular", "2026-11-17"],
    ["2026-11-17T21:00:00Z", "post_market", "2026-11-17"],
    ["2026-11-18T01:00:00Z", "overnight", "2026-11-18"]
  ])("advances the phase at %s", (instant, phase, tradingDate) => {
    const result = at(instant);
    expect(result?.status).toEqual({ phase, state: "open" });
    expect(result?.sessions[0]?.tradingDate).toBe(tradingDate);
  });

  it.each([
    ["2026-11-21T01:00:00Z", "Friday evening"],
    ["2026-11-23T00:59:59Z", "Sunday before the overnight open"],
    ["2026-11-26T01:00:00Z", "the overnight session heading into Thanksgiving"],
    ["2026-11-26T16:00:00Z", "Thanksgiving"],
    ["2028-04-14T15:00:00Z", "Good Friday"]
  ])("reports a closed schedule at %s (%s)", (instant) => {
    expect(at(instant)).toMatchObject({
      status: { phase: null, state: "closed" },
      sessions: []
    });
  });

  it("reopens for the early-close trading date and uses its shortened daytime hours", () => {
    expect(at("2026-11-27T01:00:00Z")?.status).toEqual({ phase: "overnight", state: "open" });
    const result = at("2026-11-27T18:00:00Z");
    expect(result?.status).toEqual({ phase: "post_market", state: "open" });
    expect(result?.sessions[2]?.endsAt).toBe("2026-11-27T18:00:00Z");
    expect(result?.sessions[3]?.endsAt).toBe("2026-11-27T22:00:00Z");
    expect(at("2026-11-27T22:00:00Z")?.status).toEqual({ phase: null, state: "closed" });
  });

  it.each([
    ["2026-03-09T00:00:00Z", "2026-03-09T13:30:00Z"],
    ["2026-11-02T01:00:00Z", "2026-11-02T14:30:00Z"]
  ])("uses the new UTC offset after the DST transition at %s", (overnight, regular) => {
    const result = at(overnight);
    expect(result?.status).toEqual({ phase: "overnight", state: "open" });
    expect(result?.sessions[0]?.startsAt).toBe(overnight);
    expect(result?.sessions[2]?.startsAt).toBe(regular);
  });

  it("returns null when there is no supported schedule", () => {
    expect(getTradingSessions(null, null)).toBeNull();
    expect(getTradingSessions("GB", "Europe/London")).toBeNull();
    expect(getTradingSessions("US", "America/Chicago")).toBeNull();
    expect(at("2029-01-02T15:00:00Z")).toBeNull();
    expect(at("invalid date")).toBeNull();
  });
});
