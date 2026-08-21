"use client";

import { useEffect, useSyncExternalStore } from "react";
import { formatMoney } from "@/lib/format";
import {
  ensureRate,
  getDisplaySnapshot,
  getServerDisplaySnapshot,
  subscribeCurrency,
  type Currency,
} from "@/lib/currency";

/**
 * Renders a stored amount in whatever currency the viewer has switched to
 * (see `CurrencySwitch`), converting live via `<Money>`'s own USD/GTQ rate.
 * Everything else (server-authored `currency` values outside USD/GTQ) is
 * shown as-is — this component only knows how to convert between the two.
 */
export function Money({
  amount,
  currency = "USD",
  compact = false,
}: {
  amount: number;
  currency?: string;
  compact?: boolean;
}) {
  const snapshot = useSyncExternalStore(
    subscribeCurrency,
    getDisplaySnapshot,
    getServerDisplaySnapshot,
  );

  useEffect(() => {
    ensureRate();
  }, []);

  if (currency !== "USD" && currency !== "GTQ") {
    return <>{formatMoney(amount, currency, { compact })}</>;
  }

  const [display, rateRaw] = snapshot.split("|") as [Currency, string];
  const rate = Number(rateRaw);
  const amountInUsd = currency === "GTQ" ? amount / rate : amount;
  const shown = display === "GTQ" ? amountInUsd * rate : amountInUsd;

  return <>{formatMoney(shown, display, { compact })}</>;
}
