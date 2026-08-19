/** Shared formatting so numbers and dates look the same on every screen. */

export function formatMoney(
  amount: number,
  currency = "USD",
  opts: { compact?: boolean } = {},
): string {
  // `minimumFractionDigits: 0` is load-bearing, not cosmetic. Without it,
  // Node's ICU renders compact currency as "$18.0K" while Chromium's renders
  // "$18K" — which hydration-mismatches any client component showing a money
  // value. Pinning both bounds makes the two runtimes agree exactly.
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: opts.compact ? "compact" : "standard",
    minimumFractionDigits: 0,
    maximumFractionDigits: opts.compact ? 1 : 0,
  }).format(amount);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDayMonth(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatRelative(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return formatDate(date);
}

/**
 * Days until a date. Negative means overdue.
 *
 * Anchored to UTC midnight, matching `formatDate`. Using local midnight would
 * make the answer depend on the viewer's timezone, so a server in UTC and a
 * browser in UTC-6 would render different text for the same task — a
 * hydration mismatch, and a wrong due-date badge for anyone not on UTC.
 */
export function daysUntil(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;

  const startOfTodayUtc = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  );
  const dateUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.round((dateUtc - startOfTodayUtc) / 86_400_000);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function parseLabels(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
}

export function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
