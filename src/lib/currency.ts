/**
 * Client-side USD/GTQ display currency — a viewer preference, not stored
 * data. Every amount in the database stays in whatever currency it was
 * entered in; this only controls what `<Money>` converts it to for display,
 * using a live exchange rate cached in localStorage.
 *
 * Mirrors ThemeToggle's pattern: the DOM/localStorage is the source of
 * truth, read through `useSyncExternalStore` rather than React state, so two
 * open tabs (and the rate refreshing itself) stay in sync for free.
 */

const CURRENCY_KEY = "inherent-os-currency";
const RATE_KEY = "inherent-os-usd-gtq-rate";
const RATE_TTL_MS = 6 * 60 * 60 * 1000; // 6h — exchange rates don't move fast enough to justify more.
const EVENT = "inherent-os-currency-change";

export type Currency = "USD" | "GTQ";

/** Used until the live rate loads (or if it never does) — better than a blank amount. */
const FALLBACK_USD_TO_GTQ = 7.75;

type RateCache = { rate: number; fetchedAt: number };

let cachedRate: RateCache | null = null;
let inflight: Promise<void> | null = null;

function readCurrency(): Currency {
  try {
    return window.localStorage.getItem(CURRENCY_KEY) === "GTQ" ? "GTQ" : "USD";
  } catch {
    return "USD";
  }
}

function readRate(): RateCache | null {
  try {
    const raw = window.localStorage.getItem(RATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RateCache>;
    return typeof parsed.rate === "number" && typeof parsed.fetchedAt === "number"
      ? (parsed as RateCache)
      : null;
  } catch {
    return null;
  }
}

function currentRate(): number {
  if (cachedRate) return cachedRate.rate;
  const stored = typeof window !== "undefined" ? readRate() : null;
  if (stored) {
    cachedRate = stored;
    return stored.rate;
  }
  return FALLBACK_USD_TO_GTQ;
}

export function getCurrency(): Currency {
  return typeof window === "undefined" ? "USD" : readCurrency();
}

export function setCurrency(next: Currency): void {
  try {
    window.localStorage.setItem(CURRENCY_KEY, next);
  } catch {
    // Private-mode storage failures must not break the toggle.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeCurrency(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * A single string snapshot (currency + rate) so `useSyncExternalStore`
 * re-renders `<Money>` both when the viewer flips the switch and when the
 * background rate fetch resolves — a plain `getCurrency()` snapshot would
 * miss the second case, since the currency itself hasn't changed.
 */
export function getDisplaySnapshot(): string {
  return `${getCurrency()}|${currentRate()}`;
}

export function getServerDisplaySnapshot(): string {
  return `USD|${FALLBACK_USD_TO_GTQ}`;
}

/**
 * Fetches the live USD→GTQ rate at most once per TTL and caches it in
 * localStorage. Never throws: a failed fetch just leaves the stale/fallback
 * rate in place, so the switch keeps working, only less fresh.
 */
export function ensureRate(): void {
  if (typeof window === "undefined" || inflight) return;
  const stored = readRate();
  if (stored && Date.now() - stored.fetchedAt < RATE_TTL_MS) {
    cachedRate = stored;
    return;
  }

  inflight = fetch("https://open.er-api.com/v6/latest/USD")
    .then((res) => {
      if (!res.ok) throw new Error(`rate request failed: ${res.status}`);
      return res.json() as Promise<{ rates?: Record<string, number> }>;
    })
    .then((data) => {
      const rate = data.rates?.GTQ;
      if (!rate || !Number.isFinite(rate)) throw new Error("no GTQ rate in response");
      const entry: RateCache = { rate, fetchedAt: Date.now() };
      cachedRate = entry;
      try {
        window.localStorage.setItem(RATE_KEY, JSON.stringify(entry));
      } catch {
        // Ignore — the in-memory cache still covers the rest of this session.
      }
      window.dispatchEvent(new Event(EVENT));
    })
    .catch(() => {
      // Keep whatever rate (stale cache or fallback) is already in use.
    })
    .finally(() => {
      inflight = null;
    });
}
