"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV, activeHref } from "@/lib/nav";
import { Icon } from "@/components/ui/Icon";
import { Wordmark } from "@/components/ui/Logo";

/** Nav items that lead to a money screen — hidden entirely from MEMBER. */
const FINANCIAL_HREFS = new Set(["/pipeline"]);

export function Sidebar({
  counts,
  hideFinancial = false,
}: {
  counts: Record<string, number>;
  hideFinancial?: boolean;
}) {
  const pathname = usePathname();
  const active = activeHref(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {NAV.map((group) => {
        const items = hideFinancial
          ? group.items.filter((item) => !FINANCIAL_HREFS.has(item.href))
          : group.items;
        if (items.length === 0) return null;
        return (
        <div key={group.title}>
          <p className="label px-2.5 pb-2">{group.title}</p>
          <ul className="space-y-0.5">
            {items.map((item) => {
              const isActive = active === item.href;
              const count = counts[item.href];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className="focusable flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[13px] transition-colors"
                    style={{
                      background: isActive ? "var(--bg-hover)" : "transparent",
                      color: isActive ? "var(--text)" : "var(--text-muted)",
                      fontWeight: isActive ? 600 : 450,
                    }}
                  >
                    <Icon
                      name={item.icon}
                      size={16}
                      className={isActive ? "" : "opacity-70"}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {count !== undefined && count > 0 && (
                      <span
                        className="rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums"
                        style={{
                          background: isActive
                            ? "color-mix(in oklab, var(--accent) 22%, transparent)"
                            : "var(--bg-overlay)",
                          color: isActive ? "var(--accent)" : "var(--text-faint)",
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="btn btn-ghost focusable fixed left-3 top-3 z-40 lg:hidden"
        aria-label="Open navigation"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="block h-px w-4 bg-current" />
          <span className="block h-px w-4 bg-current" />
          <span className="block h-px w-4 bg-current" />
        </span>
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[228px] flex-col border-r transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--bg-raised)", borderColor: "var(--line)" }}
      >
        <div
          className="flex h-14 items-center border-b px-4"
          style={{ borderColor: "var(--line)" }}
        >
          <Link href="/" className="focusable min-w-0 rounded-lg">
            <Wordmark />
          </Link>
        </div>
        {nav}
      </aside>
    </>
  );
}
