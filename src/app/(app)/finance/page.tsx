import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { canViewFinancials } from "@/lib/policy";
import { toMonthly } from "@/lib/domain";
import { FALLBACK_USD_TO_GTQ } from "@/lib/currency";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, Stat } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { CostsSection } from "./CostsSection";
import { SalariesSection } from "./SalariesSection";
import { ReinvestmentsSection } from "./ReinvestmentsSection";

export const metadata = { title: "Finance" };
export const dynamic = "force-dynamic";

/** Normalizes any stored amount to USD using the same fallback rate the
 * currency switch uses when it has no live one — good enough for a P&L
 * total, which is directionally right rather than to-the-cent anyway. */
function toUsd(amount: number, currency: string): number {
  return currency === "GTQ" ? amount / FALLBACK_USD_TO_GTQ : amount;
}

export default async function FinancePage() {
  const user = await requireUser();
  if (!canViewFinancials(user.role)) redirect("/");

  const [accounts, costs, salaries, reinvestments, members] = await Promise.all([
    db.account.findMany({
      where: { status: "ACTIVE", kind: { not: "INTERNAL" } },
      select: { mrr: true, currency: true },
    }),
    db.cost.findMany({ orderBy: [{ recurrence: "asc" }, { name: "asc" }] }),
    db.salary.findMany({
      include: { user: { select: { id: true, name: true, avatarHue: true, avatarUrl: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    db.reinvestment.findMany({ orderBy: { date: "desc" } }),
    db.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const monthlyRevenue = accounts.reduce(
    (sum, a) => sum + toUsd(a.mrr, a.currency),
    0,
  );
  const monthlyCosts = costs.reduce(
    (sum, c) => sum + toUsd(toMonthly(c.amount, c.recurrence), c.currency),
    0,
  );
  const monthlySalaries = salaries.reduce(
    (sum, s) => sum + toUsd(toMonthly(s.amount, s.cadence), s.currency),
    0,
  );
  const netMonthly = monthlyRevenue - monthlyCosts - monthlySalaries;
  const totalReinvested = reinvestments.reduce(
    (sum, r) => sum + toUsd(r.amount, r.currency),
    0,
  );

  return (
    <>
      <PageHeader
        eyebrow="Revenue"
        title="Finance"
        description="Costs, pay, and reinvestments — visible to owners and admins only."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Monthly revenue" value={<Money amount={monthlyRevenue} />} sub="Active MRR" />
        <Stat
          label="Monthly costs + pay"
          value={<Money amount={monthlyCosts + monthlySalaries} />}
          sub={
            <>
              <Money amount={monthlyCosts} compact /> costs ·{" "}
              <Money amount={monthlySalaries} compact /> pay
            </>
          }
        />
        <Stat
          label="Net / month"
          value={<Money amount={netMonthly} />}
          tone={netMonthly >= 0 ? "var(--color-ok)" : "var(--color-danger)"}
        />
        <Stat
          label="Reinvested"
          value={<Money amount={totalReinvested} />}
          sub={`${reinvestments.length} entries, all time`}
        />
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader title="Costs" subtitle="Recurring and one-off business costs." />
          <CostsSection costs={costs} />
        </Card>

        <Card>
          <CardHeader title="Salaries" subtitle="Current pay, per person." />
          <SalariesSection salaries={salaries} members={members} />
        </Card>

        <Card>
          <CardHeader title="Reinvestments" subtitle="Money put back into the business." />
          <ReinvestmentsSection reinvestments={reinvestments} />
        </Card>
      </div>
    </>
  );
}
