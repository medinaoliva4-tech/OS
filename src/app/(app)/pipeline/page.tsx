import { db } from "@/lib/db";
import { weighted } from "@/lib/queries";
import { DEAL_STAGES } from "@/lib/domain";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, Stat } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Money } from "@/components/ui/Money";
import { DealCard, type DealCardData } from "./DealCard";
import { NewDealForm } from "./NewDealForm";

export const metadata = { title: "Pipeline" };
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const [deals, accounts] = await Promise.all([
    db.deal.findMany({
      include: {
        account: { select: { name: true, slug: true, brandHex: true } },
        owner: { select: { name: true, avatarHue: true } },
      },
      orderBy: { value: "desc" },
    }),
    db.account.findMany({
      where: { kind: { not: "INTERNAL" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const open = deals.filter((d) => !["WON", "LOST"].includes(d.stage));
  const won = deals.filter((d) => d.stage === "WON");
  const lost = deals.filter((d) => d.stage === "LOST");

  const closedCount = won.length + lost.length;
  const winRate = closedCount > 0 ? Math.round((won.length / closedCount) * 100) : null;

  const byStage = new Map<string, DealCardData[]>();
  for (const stage of DEAL_STAGES) byStage.set(stage.value, []);
  for (const deal of deals) byStage.get(deal.stage)?.push(deal as DealCardData);

  return (
    <>
      <PageHeader
        eyebrow="Revenue"
        title="Pipeline"
        description="Weighted forecast is value × probability — the only number worth quoting out loud."
        actions={<NewDealForm accounts={accounts} />}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Weighted forecast"
          value={<Money amount={weighted(open)} compact />}
          sub={`${open.length} open ${open.length === 1 ? "deal" : "deals"}`}
        />
        <Stat
          label="Unweighted"
          value={<Money amount={open.reduce((s, d) => s + d.value, 0)} compact />}
          sub="If everything landed"
        />
        <Stat
          label="Closed won"
          value={<Money amount={won.reduce((s, d) => s + d.value, 0)} compact />}
          sub={`${won.length} ${won.length === 1 ? "deal" : "deals"}`}
          tone="var(--color-ok)"
        />
        <Stat
          label="Win rate"
          value={winRate === null ? "—" : `${winRate}%`}
          sub={
            closedCount === 0
              ? "Nothing closed yet"
              : `${won.length} of ${closedCount} closed`
          }
        />
      </div>

      {deals.length === 0 ? (
        <EmptyState
          title="No deals yet"
          hint="Add the first one and the forecast starts working."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {DEAL_STAGES.map((stage) => {
            const column = byStage.get(stage.value) ?? [];
            const columnValue = column.reduce((s, d) => s + d.value, 0);

            return (
              <section key={stage.value} className="min-w-0">
                <header className="mb-2.5 px-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <Chip tone={stage.tone} dot>
                      {stage.label}
                    </Chip>
                    <span
                      className="text-[11px] tabular-nums"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {column.length}
                    </span>
                  </div>
                  <p
                    className="mt-1 text-[11px] tabular-nums"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {columnValue > 0 ? <Money amount={columnValue} compact /> : "—"}
                  </p>
                </header>

                <div className="space-y-2">
                  {column.length === 0 ? (
                    <p
                      className="rounded-[10px] border border-dashed px-3 py-5 text-center text-[11.5px]"
                      style={{
                        borderColor: "var(--line)",
                        color: "var(--text-faint)",
                      }}
                    >
                      Empty
                    </p>
                  ) : (
                    column.map((deal) => <DealCard key={deal.id} deal={deal} />)
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {lost.length > 0 && (
        <p className="mt-6 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
          {lost.length} lost {lost.length === 1 ? "deal" : "deals"} worth{" "}
          <Money amount={lost.reduce((s, d) => s + d.value, 0)} compact />{" "}
          — kept for the win-rate maths, not for the forecast.
        </p>
      )}
    </>
  );
}
