"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  ensureRate,
  getDisplaySnapshot,
  getServerDisplaySnapshot,
  setCurrency,
  subscribeCurrency,
  type Currency,
} from "@/lib/currency";

export function CurrencySwitch() {
  const snapshot = useSyncExternalStore(
    subscribeCurrency,
    getDisplaySnapshot,
    getServerDisplaySnapshot,
  );
  const [display] = snapshot.split("|") as [Currency, string];

  // Kick off the rate fetch as soon as the topbar mounts, not only when a
  // <Money> instance happens to render — keeps the first toggle instant.
  useEffect(() => {
    ensureRate();
  }, []);

  const toggle = () => setCurrency(display === "USD" ? "GTQ" : "USD");
  const label = `Show amounts in ${display === "USD" ? "quetzales" : "dollars"}`;

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-quiet focusable"
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      {display}
    </button>
  );
}
