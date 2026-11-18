export type TradingSessionPhase = "overnight" | "pre_market" | "regular" | "post_market";

export interface TradingSession {
  id: string;
  phase: TradingSessionPhase;
  tradingDate: string;
  startsAt: string;
  endsAt: string;
}

export interface TradingSessions {
  exchangeRegion: string;
  exchangeTimezone: string;
  status: { phase: TradingSessionPhase; state: "open" } | { phase: null; state: "closed" };
  sessions: TradingSession[];
}

const newYork = "America/New_York";
const minuteMs = 60_000;
const dayMs = 24 * 60 * minuteMs;
const offsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: newYork,
  timeZoneName: "shortOffset"
});

// NYSE's published 2026–2028 calendar. Early closes use NYSE Arca's late session.
// https://www.nyse.com/trade/hours-calendars
const firstTradingDate = Date.UTC(2026, 0, 1);
const endTradingDate = Date.UTC(2029, 0, 1);
const holidays = new Set([
  "2026-01-01",
  "2026-01-19",
  "2026-02-16",
  "2026-04-03",
  "2026-05-25",
  "2026-06-19",
  "2026-07-03",
  "2026-09-07",
  "2026-11-26",
  "2026-12-25",
  "2027-01-01",
  "2027-01-18",
  "2027-02-15",
  "2027-03-26",
  "2027-05-31",
  "2027-06-18",
  "2027-07-05",
  "2027-09-06",
  "2027-11-25",
  "2027-12-24",
  "2028-01-17",
  "2028-02-21",
  "2028-04-14",
  "2028-05-29",
  "2028-06-19",
  "2028-07-04",
  "2028-09-04",
  "2028-11-23",
  "2028-12-25"
]);
const earlyCloses = new Set(["2026-11-27", "2026-12-24", "2027-11-26", "2028-07-03", "2028-11-24"]);

// The supported zone has only whole-hour offsets (GMT-4 and GMT-5).
function newYorkOffsetMs(at: number): number {
  const offset = offsetFormatter.formatToParts(at).find((part) => part.type === "timeZoneName");
  if (!offset) throw new Error("Intl could not determine the America/New_York offset.");
  return Number(offset.value.slice(3)) * 60 * minuteMs;
}

// A wall time is represented on the UTC calendar until its zone offset is applied.
// The session boundaries below are unambiguous, including Sunday evening after a DST change.
function sessionTimestamp(wallTime: number): string {
  const guess = wallTime - newYorkOffsetMs(wallTime);
  const instant = wallTime - newYorkOffsetMs(guess);
  return new Date(instant).toISOString().replace(".000Z", "Z");
}

/**
 * Get the scheduled U.S. equity sessions for the exchange trading date at an
 * instant. A session starts inclusive and ends exclusive. The overnight
 * window belongs to the following New York calendar day.
 *
 * Returns null for unsupported exchange metadata or dates outside the
 * published calendar. Closed dates return a closed status and no sessions.
 */
export function getTradingSessions(
  exchangeRegion: string | null | undefined,
  exchangeTimezone: string | null | undefined,
  at: Date = new Date()
): TradingSessions | null {
  if (exchangeRegion !== "US" || exchangeTimezone !== newYork) return null;

  const now = at.getTime();
  if (!Number.isFinite(now)) return null;

  const localTime = now + newYorkOffsetMs(now);
  const localDay = Math.floor(localTime / dayMs) * dayMs;
  const overnightStart = 20 * 60 * minuteMs;
  const tradingDay = localTime - localDay >= overnightStart ? localDay + dayMs : localDay;
  if (tradingDay < firstTradingDate || tradingDay >= endTradingDate) return null;

  const date = new Date(tradingDay);
  const tradingDate = date.toISOString().slice(0, 10);
  const weekday = date.getUTCDay();
  if (weekday === 0 || weekday === 6 || holidays.has(tradingDate)) {
    return {
      exchangeRegion,
      exchangeTimezone,
      status: { phase: null, state: "closed" },
      sessions: []
    };
  }

  const earlyClose = earlyCloses.has(tradingDate);
  const preMarketOpen = tradingDay + 4 * 60 * minuteMs;
  const regularOpen = tradingDay + (9 * 60 + 30) * minuteMs;
  const regularClose = tradingDay + (earlyClose ? 13 : 16) * 60 * minuteMs;
  const postMarketClose = tradingDay + (earlyClose ? 17 : 20) * 60 * minuteMs;
  // Blue Ocean's Sunday–Thursday session runs before eligible trade dates.
  // https://my.blueocean-tech.io/faq/how-does-blue-oceanats-operate
  const windows = [
    ["overnight", tradingDay - dayMs + overnightStart, preMarketOpen],
    ["pre_market", preMarketOpen, regularOpen],
    ["regular", regularOpen, regularClose],
    ["post_market", regularClose, postMarketClose]
  ] as const;
  const active = windows.find(([, start, end]) => start <= localTime && localTime < end);
  const sessions = windows.map(([phase, start, end]) => ({
    id: `${phase.replace("_", "-")}-${tradingDate}`,
    phase,
    tradingDate,
    startsAt: sessionTimestamp(start),
    endsAt: sessionTimestamp(end)
  }));
  return {
    exchangeRegion,
    exchangeTimezone,
    status: active ? { phase: active[0], state: "open" } : { phase: null, state: "closed" },
    sessions
  };
}
