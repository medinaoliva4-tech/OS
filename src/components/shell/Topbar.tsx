import Link from "next/link";
import { CommandPalette, type PaletteEntry } from "./CommandPalette";
import { CurrencySwitch } from "./CurrencySwitch";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import type { SessionUser } from "@/lib/session";

export function Topbar({
  user,
  brands,
  hideFinancial = false,
}: {
  user: SessionUser;
  brands: PaletteEntry[];
  hideFinancial?: boolean;
}) {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur lg:px-6"
      style={{
        background: "color-mix(in oklab, var(--bg) 88%, transparent)",
        borderColor: "var(--line)",
      }}
    >
      <div className="w-10 lg:hidden" aria-hidden />
      <div className="flex-1">
        <CommandPalette brands={brands} hideFinancial={hideFinancial} />
      </div>
      <Link href="/tasks?due=overdue" className="btn btn-ghost focusable hidden sm:inline-flex">
        Today
      </Link>
      <CurrencySwitch />
      <ThemeToggle />
      <UserMenu user={user} />
    </header>
  );
}
