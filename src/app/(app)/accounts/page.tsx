import Link from "next/link";
import { db } from "@/lib/db";
import { pipelineProgress } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { canViewFinancials } from "@/lib/policy";
import { ACCOUNT_STATUSES, ACCOUNT_TIERS, option } from "@/lib/domain";
import { toUsdAmount } from "@/lib/currency";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, EmptyState, Meter } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { Chip } from "@/components/ui/Chip";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Brands" };
export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const user = await getCurrentUser();
  const canView = user ? canViewFinancials(user.role) : false;

  const [accounts, steps] = await Promise.all([
    db.account.findMany({
      include: {
        owner: { select: { name: true, avatarHue: true } },
        _count: {
          select: { contacts: true, contentItems: true, assets: true, deals: true },
        },
        tasks: { where: { status: { not: "DONE" } }, select: { id: true } },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    db.contentPipelineStep.findMany({
      select: { accountId: true, status: true },
    }),
  ]);

  const progress = pipelineProgress(steps);
  const totalMrr = accounts
    .filter((a) => a.status === "ACTIVE")
    .reduce((sum, a) => sum + toUsdAmount(a.mrr, a.currency), 0);

  return (
    <>
      <PageHeader
        eyebrow="Revenue"
        title="Brands"
        description={
          canView ? (
            <>
              {accounts.length} {accounts.length === 1 ? "brand" : "brands"} ·{" "}
              <Money amount={totalMrr} /> monthly recurring across the active ones.
            </>
          ) : (
            `${accounts.length} ${accounts.length === 1 ? "brand" : "brands"}.`
          )
        }
        actions={
          <Link href="/accounts/new" className="btn btn-primary focusable">
            <Icon name="plus" size={15} />
            New brand
          </Link>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          title="No brands yet"
          hint="Every piece of work in the OS hangs off a brand. Add the first one."
          action={
            <Link href="/accounts/new" className="btn btn-primary focusable">
              Add a brand
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const status = option(ACCOUNT_STATUSES, account.status);
            const tier = option(ACCOUNT_TIERS, account.tier);
            const p = progress.get(account.id) ?? {
              done: 0,
              total: 0,
              blocked: 0,
              inProgress: 0,
            };
            const openTasks = account.tasks.length;

            return (
              <Link
                key={account.id}
                href={`/accounts/${account.slug}`}
                className="focusable block"
              >
                <Card className="h-full transition-colors hover:bg-[var(--bg-hover)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <BrandLogo
                        name={account.name}
                        hex={account.brandHex}
                        logoUrl={account.logoUrl}
                        size={36}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {account.name}
                        </p>
                        <p
                          className="truncate text-[11px]"
                          style={{ color: "var(--text-faint)" }}
                        >
                          {account.industry ?? "—"}
                        </p>
                      </div>
                    </div>
                    <Chip tone={status.tone} dot>
                      {status.label}
                    </Chip>
                  </div>

                  {account.summary && (
                    <p
                      className="mt-3 line-clamp-2 text-[12px] leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {account.summary}
                    </p>
                  )}

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="label">Content system</span>
                      <span
                        className="text-[11px] tabular-nums"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {p.done}/{p.total}
                      </span>
                    </div>
                    <Meter
                      value={p.done}
                      total={p.total}
                      inFlight={p.inProgress}
                      tone={account.brandHex}
                    />
                  </div>

                  <dl
                    className={`mt-4 grid gap-2 border-t pt-3 text-center ${canView ? "grid-cols-3" : "grid-cols-2"}`}
                    style={{ borderColor: "var(--line)" }}
                  >
                    {canView && (
                      <div>
                        <dt className="label">MRR</dt>
                        <dd className="mt-0.5 text-[13px] font-semibold tabular-nums">
                          {account.mrr > 0 ? (
                            <Money amount={account.mrr} currency={account.currency} compact />
                          ) : (
                            "—"
                          )}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="label">Open</dt>
                      <dd
                        className="mt-0.5 text-[13px] font-semibold tabular-nums"
                        style={
                          openTasks > 0 ? { color: "var(--color-warn)" } : undefined
                        }
                      >
                        {openTasks}
                      </dd>
                    </div>
                    <div>
                      <dt className="label">Assets</dt>
                      <dd className="mt-0.5 text-[13px] font-semibold tabular-nums">
                        {account._count.assets}
                      </dd>
                    </div>
                  </dl>

                  <div
                    className="mt-3 flex items-center justify-between gap-2 border-t pt-3"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <Chip tone={tier.tone}>{tier.label}</Chip>
                    {account.owner && (
                      <span
                        className="flex items-center gap-1.5 text-[11px]"
                        style={{ color: "var(--text-faint)" }}
                      >
                        <Avatar
                          name={account.owner.name}
                          hue={account.owner.avatarHue}
                          size={18}
                        />
                        {account.owner.name.split(" ")[0]}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
