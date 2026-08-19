"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { logoutAction } from "@/app/(auth)/actions";
import type { SessionUser } from "@/lib/session";

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focusable flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-[var(--bg-hover)]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar name={user.name} hue={user.avatarHue} size={28} />
      </button>

      {open && (
        <div
          role="menu"
          className="surface animate-in absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden p-1.5"
          style={{ boxShadow: "0 16px 40px -12px rgb(0 0 0 / 0.55)" }}
        >
          <div
            className="mb-1 border-b px-2.5 pb-2.5 pt-1.5"
            style={{ borderColor: "var(--line)" }}
          >
            <p className="truncate text-[13px] font-semibold">{user.name}</p>
            <p className="truncate text-[11px]" style={{ color: "var(--text-faint)" }}>
              {user.email}
            </p>
            <p className="mt-1.5 text-[10px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              {user.title ?? user.role}
            </p>
          </div>

          <Link
            href="/team"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-[13px] transition-colors hover:bg-[var(--bg-hover)]"
          >
            <Icon name="team" size={15} className="opacity-70" />
            Team
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-[13px] transition-colors hover:bg-[var(--bg-hover)]"
          >
            <Icon name="settings" size={15} className="opacity-70" />
            Settings
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="mt-0.5 flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: "var(--color-danger)" }}
            >
              <Icon name="logout" size={15} />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
