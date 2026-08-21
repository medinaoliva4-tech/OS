import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { canViewFinancials } from "@/lib/policy";
import { checkDatabase } from "@/lib/db-health";
import { SetupRequired } from "@/components/SetupRequired";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import type { PaletteEntry } from "@/components/shell/CommandPalette";

// Same reason as the login page: the setup check short-circuits before any
// dynamic API, so this must be pinned dynamic or build-time database state
// gets baked into the shell.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // A first deploy fails for boring reasons — no connection string, or a
  // schema nobody migrated. Say which, instead of rendering a bare 500.
  const health = await checkDatabase();
  if (!health.ok) return <SetupRequired status={health} />;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const hideFinancial = !canViewFinancials(user.role);

  // Sidebar counters and palette entries in one round of queries — these run
  // on every authenticated page, so they stay deliberately cheap. The open
  // deals count is money-adjacent, so it's skipped entirely for a viewer who
  // can't see financials rather than fetched and just not displayed.
  const [openTasks, openDeals, needsAttention, brandRows] = await Promise.all([
    db.task.count({ where: { status: { notIn: ["DONE"] } } }),
    hideFinancial
      ? Promise.resolve(0)
      : db.deal.count({ where: { stage: { notIn: ["WON", "LOST"] } } }),
    db.integration.count({
      where: { status: { in: ["NEEDS_SETUP", "ERROR", "DEGRADED"] } },
    }),
    db.account.findMany({
      where: { kind: { not: "INTERNAL" } },
      select: { name: true, slug: true, brandHex: true, status: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const brands: PaletteEntry[] = brandRows.map((row) => ({
    id: `brand:${row.slug}`,
    label: row.name,
    hint: `Open the ${row.name} workspace`,
    href: `/accounts/${row.slug}`,
    group: "Brand",
    hex: row.brandHex,
  }));

  const counts: Record<string, number> = {
    "/tasks": openTasks,
    "/connections": needsAttention,
    ...(hideFinancial ? {} : { "/pipeline": openDeals }),
  };

  return (
    <div className="min-h-dvh">
      <Sidebar counts={counts} hideFinancial={hideFinancial} />
      {/* overflow-x: clip (not hidden) contains a wide table's scroll area
          without turning this into a scroll container, which would break the
          sticky topbar. */}
      <div className="[overflow-x:clip] lg:pl-[228px]">
        <Topbar user={user} brands={brands} hideFinancial={hideFinancial} />
        <main className="animate-in px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
