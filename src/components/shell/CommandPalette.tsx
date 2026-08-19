"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_NAV_ITEMS } from "@/lib/nav";
import { Icon } from "@/components/ui/Icon";
import { BrandDot } from "@/components/ui/Chip";

export type PaletteEntry = {
  id: string;
  label: string;
  hint: string;
  href: string;
  group: string;
  hex?: string;
};

/** Nav items that lead to a money screen — hidden entirely from MEMBER. */
const FINANCIAL_HREFS = new Set(["/pipeline", "/finance"]);

/**
 * Cmd/Ctrl-K navigation. The entries for brands are passed in from the server
 * layout so "nao" jumps straight to the NAO workspace without a round trip.
 */
export function CommandPalette({
  brands,
  hideFinancial = false,
}: {
  brands: PaletteEntry[];
  hideFinancial?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const entries = useMemo<PaletteEntry[]>(
    () => [
      ...ALL_NAV_ITEMS.filter(
        (item) => !hideFinancial || !FINANCIAL_HREFS.has(item.href),
      ).map((item) => ({
        id: `nav:${item.href}`,
        label: item.label,
        hint: item.hint,
        href: item.href,
        group: "Go to",
      })),
      ...brands,
    ],
    [brands, hideFinancial],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 9);
    return entries
      .filter(
        (entry) =>
          entry.label.toLowerCase().includes(q) ||
          entry.hint.toLowerCase().includes(q) ||
          entry.group.toLowerCase().includes(q),
      )
      .slice(0, 9);
  }, [entries, query]);

  // Resetting here rather than in an effect keeps `open` from having to be
  // mirrored into query/cursor, which would cost a second render every time.
  const openPalette = useCallback(() => {
    setQuery("");
    setCursor(0);
    setOpen(true);
    // Focus once the dialog has painted.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((wasOpen) => {
          if (wasOpen) return false;
          setQuery("");
          setCursor(0);
          requestAnimationFrame(() => inputRef.current?.focus());
          return true;
        });
        return;
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Derived, not stored: a stale cursor can never outlive a shorter result set.
  const activeIndex = results.length === 0 ? -1 : Math.min(cursor, results.length - 1);

  function go(entry: PaletteEntry | undefined) {
    if (!entry) return;
    setOpen(false);
    router.push(entry.href);
  }

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor(Math.min(activeIndex + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor(Math.max(activeIndex - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[activeIndex]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="focusable flex w-full max-w-xs items-center gap-2 rounded-[9px] border px-2.5 py-1.5 text-left text-[13px] transition-colors"
        style={{
          background: "var(--bg)",
          borderColor: "var(--line-strong)",
          color: "var(--text-faint)",
        }}
      >
        <Icon name="search" size={15} />
        <span className="flex-1 truncate">Search…</span>
        <kbd
          className="rounded border px-1 py-px font-mono text-[10px]"
          style={{ borderColor: "var(--line-strong)" }}
        >
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="surface animate-in w-full max-w-lg overflow-hidden"
            style={{ boxShadow: "0 24px 60px -12px rgb(0 0 0 / 0.6)" }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div
              className="flex items-center gap-2.5 border-b px-4 py-3"
              style={{ borderColor: "var(--line)" }}
            >
              <Icon name="search" size={17} className="opacity-60" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCursor(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Jump to a screen or a brand…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text)" }}
                aria-label="Search"
              />
              <kbd
                className="rounded border px-1.5 py-0.5 font-mono text-[10px]"
                style={{ borderColor: "var(--line-strong)", color: "var(--text-faint)" }}
              >
                esc
              </kbd>
            </div>

            <ul className="max-h-[46vh] overflow-y-auto p-1.5">
              {results.length === 0 && (
                <li
                  className="px-3 py-6 text-center text-sm"
                  style={{ color: "var(--text-faint)" }}
                >
                  Nothing matches “{query}”.
                </li>
              )}
              {results.map((entry, index) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => go(entry)}
                    className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2 text-left transition-colors"
                    style={{
                      background:
                        index === activeIndex ? "var(--bg-hover)" : "transparent",
                    }}
                  >
                    {entry.hex ? (
                      <BrandDot hex={entry.hex} size={12} />
                    ) : (
                      <Icon
                        name="arrowRight"
                        size={14}
                        className="opacity-50"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {entry.label}
                      </span>
                      <span
                        className="block truncate text-[11px]"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {entry.hint}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-[10px] uppercase tracking-wider"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {entry.group}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
