import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getDashboardData, pipelineProgress } from "@/lib/queries";
import { formatDate, formatMoney, formatRelative, daysUntil } from "@/lib/format";
import { CONTENT_STAGES, DEAL_STAGES, TASK_PRIORITIES, option } from "@/lib/domain";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, EmptyState, Meter, Stat } from "@/components/ui/Card";
import { BrandDot, Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const data = await getDashboardData();
  const progress = pipelineProgress(data.pipelineSteps);

  const needsAttention = data.integrations.filter((i) =>
    ["NEEDS_SETUP", "ERROR", "DEGRADED"].includes(i.status),
  );

  const myTasks = data.tasks.filter((t) => t.assigneeId === user?.id).slice(0, 6);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 19 ? "Good afternoon" : "Good evening";
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }).format(new Date())}
        title={`${greeting}, ${firstName}.`}
        description={
          data.overdueTasks > 0
            ? `${data.overdueTasks} ${data.overdueTasks === 1 ? "item is" : "items are"} past due. Everything else is on track.`
            : "Nothing is past due. Here is where the work stands."
        }
        actions={
          <>
            <Link href="/tasks" className="btn btn-ghost focusable">
              <Icon name="tasks" size={15} />
              Pendientes
            </Link>
            <Link href="/accounts/new" className="btn btn-primary focusable">
              <Icon name="plus" size={15} />
              New brand
            </Link>
          </>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* Headline numbers                                                  */}
      {/* ---------------------------------------------------------------- */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Monthly recurring"
          value={formatMoney(data.mrr)}
          sub={`${data.accounts.filter((a) => a.status === "ACTIVE").length} active brands`}
        />
        <Stat
          label="Weighted pipeline"
          value={formatMoney(data.weightedPipeline, "USD", { compact: true })}
          sub={`${data.openDeals.length} open · ${formatMoney(
            data.openDeals.reduce((s, d) => s + d.value, 0),
            "USD",
            { compact: true },
          )} unweighted`}
          href="/pipeline"
        />
        <Stat
          label="Open pendientes"
          value={data.tasks.length}
          sub={
            data.overdueTasks > 0 ? `${data.overdueTasks} overdue` : "None overdue"
          }
          tone={data.overdueTasks > 0 ? "var(--color-danger)" : undefined}
          href="/tasks"
        />
        <Stat
          label="Connections"
          value={`${data.integrations.length - needsAttention.length}/${data.integrations.length}`}
          sub={
            needsAttention.length > 0
              ? `${needsAttention.length} need setup`
              : "All connected"
          }
          tone={needsAttention.length > 0 ? "var(--color-warn)" : "var(--color-ok)"}
          href="/connections"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* -------------------------------------------------------------- */}
        {/* Content system per brand — the pendientes, as a machine         */}
        {/* -------------------------------------------------------------- */}
        <div className="min-w-0 space-y-5 xl:col-span-2">
          <Card>
            <CardHeader
              title="Content system"
              subtitle="Every brand's progress through the nine checkpoints, from guidelines to scheduled."
              action={
                <Link href="/connections" className="btn btn-quiet focusable">
                  Pipes
                  <Icon name="chevronRight" size={13} />
                </Link>
              }
            />

            {data.accounts.length === 0 ? (
              <EmptyState
                title="No brands yet"
                hint="Add your first client brand to start tracking its content system."
                action={
                  <Link href="/accounts/new" className="btn btn-primary focusable">
                    Add a brand
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-3">
                {data.accounts.map((account) => {
                  const p = progress.get(account.id) ?? {
                    done: 0,
                    total: 0,
                    blocked: 0,
                    inProgress: 0,
                  };
                  const openForBrand = data.tasks.filter(
                    (t) => t.accountId === account.id,
                  ).length;

                  return (
                    <li key={account.id}>
                      <Link
                        href={`/accounts/${account.slug}`}
                        className="surface-flat focusable block p-3.5 transition-colors hover:bg-[var(--bg-hover)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2.5">
                            <BrandDot hex={account.brandHex} size={12} />
                            <span className="truncate text-[13px] font-semibold">
                              {account.name}
                            </span>
                            {account.status !== "ACTIVE" && (
                              <Chip tone="warn">{account.status.toLowerCase()}</Chip>
                            )}
                            {p.blocked > 0 && (
                              <Chip tone="danger" dot>
                                {p.blocked} blocked
                              </Chip>
                            )}
                          </span>
                          <span
                            className="shrink-0 text-xs tabular-nums"
                            style={{ color: "var(--text-faint)" }}
                          >
                            {p.done}/{p.total} done
                            {p.inProgress > 0 && ` · ${p.inProgress} in flight`}
                            {` · ${openForBrand} open`}
                          </span>
                        </div>
                        <div className="mt-2.5">
                          <Meter
                            value={p.done}
                            total={p.total}
                            inFlight={p.inProgress}
                            tone={account.brandHex}
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* ------------------------------------------------------------ */}
          {/* This week's content                                          */}
          {/* ------------------------------------------------------------ */}
          <Card>
            <CardHeader
              title="Publishing this week"
              subtitle="Scheduled and in-flight across every brand."
              action={
                <Link href="/calendar" className="btn btn-quiet focusable">
                  Calendar
                  <Icon name="chevronRight" size={13} />
                </Link>
              }
            />

            {data.upcomingContent.length === 0 ? (
              <EmptyState
                title="Nothing scheduled in the next seven days"
                hint="Plan a piece from the content board and it will appear here."
                action={
                  <Link href="/content" className="btn btn-ghost focusable">
                    Open content
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
                {data.upcomingContent.map((item) => {
                  const stage = option(CONTENT_STAGES, item.stage);
                  const days = daysUntil(item.scheduledFor);
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/calendar?brand=${item.account.slug}`}
                        className="row-hover focusable -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors"
                      >
                        <BrandDot hex={item.account.brandHex} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium">
                            {item.title}
                          </span>
                          <span
                            className="block truncate text-[11px]"
                            style={{ color: "var(--text-faint)" }}
                          >
                            {item.account.name} · {item.format.toLowerCase()} ·{" "}
                            {item.channel.toLowerCase()}
                          </span>
                        </span>
                        <Chip tone={stage.tone}>{stage.label}</Chip>
                        <span
                          className="w-16 shrink-0 text-right text-[11px] tabular-nums"
                          style={{ color: "var(--text-faint)" }}
                        >
                          {days === 0
                            ? "today"
                            : days === 1
                              ? "tomorrow"
                              : `in ${days}d`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Activity" subtitle="Everything that moved." />
            {data.activity.length === 0 ? (
              <EmptyState title="Nothing yet" hint="Actions across the OS show up here." />
            ) : (
              <ul className="space-y-3">
                {data.activity.slice(0, 8).map((entry) => (
                  <li key={entry.id} className="flex gap-2.5">
                    {entry.actor ? (
                      <Avatar
                        name={entry.actor.name}
                        hue={entry.actor.avatarHue}
                        size={22}
                      />
                    ) : (
                      <span
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--text-faint)" }}
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] leading-snug">
                        {entry.summary}
                      </span>
                      <span
                        className="text-[10.5px]"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {formatRelative(entry.createdAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Right rail                                                     */}
        {/* -------------------------------------------------------------- */}
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader
              title="Assigned to you"
              subtitle={
                myTasks.length === 0
                  ? "You are clear."
                  : `${myTasks.length} of ${data.tasks.filter((t) => t.assigneeId === user?.id).length} shown`
              }
            />
            {myTasks.length === 0 ? (
              <EmptyState title="Nothing on your plate" hint="Everything assigned to you is done." />
            ) : (
              <ul className="space-y-1.5">
                {myTasks.map((task) => {
                  const priority = option(TASK_PRIORITIES, task.priority);
                  const days = daysUntil(task.dueDate);
                  const overdue = days !== null && days < 0;

                  return (
                    <li key={task.id}>
                      <Link
                        href={`/tasks?focus=${task.id}`}
                        className="row-hover focusable -mx-2 flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{
                            background:
                              priority.tone === "danger"
                                ? "var(--color-danger)"
                                : priority.tone === "warn"
                                  ? "var(--color-warn)"
                                  : "var(--text-faint)",
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] leading-snug">
                            {task.title}
                          </span>
                          <span
                            className="mt-0.5 flex items-center gap-1.5 text-[11px]"
                            style={{
                              color: overdue
                                ? "var(--color-danger)"
                                : "var(--text-faint)",
                            }}
                          >
                            {task.account && (
                              <>
                                <BrandDot hex={task.account.brandHex} size={7} />
                                {task.account.name}
                              </>
                            )}
                            {task.dueDate && (
                              <>
                                <span aria-hidden>·</span>
                                {overdue
                                  ? `${Math.abs(days!)}d overdue`
                                  : formatDate(task.dueDate)}
                              </>
                            )}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {needsAttention.length > 0 && (
            <Card>
              <CardHeader
                title="Needs attention"
                subtitle="Pipes that are not carrying anything yet."
                action={
                  <Link href="/connections" className="btn btn-quiet focusable">
                    Fix
                    <Icon name="chevronRight" size={13} />
                  </Link>
                }
              />
              <ul className="space-y-1.5">
                {needsAttention.map((integration) => (
                  <li
                    key={integration.id}
                    className="flex items-center justify-between gap-2 text-[12.5px]"
                  >
                    <span className="truncate">{integration.name}</span>
                    <Chip tone={integration.status === "ERROR" ? "danger" : "warn"}>
                      {integration.status === "ERROR" ? "error" : "setup"}
                    </Chip>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader title="Open deals" subtitle="Largest first." />
            {data.openDeals.length === 0 ? (
              <EmptyState title="No open deals" hint="Add one from the pipeline." />
            ) : (
              <ul className="space-y-2.5">
                {data.openDeals.slice(0, 5).map((deal) => {
                  const stage = option(DEAL_STAGES, deal.stage);
                  return (
                    <li key={deal.id}>
                      <Link
                        href="/pipeline"
                        className="row-hover focusable -mx-2 block rounded-lg px-2 py-1.5"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[12.5px] font-medium">
                            {deal.account.name}
                          </span>
                          <span className="shrink-0 text-[12.5px] font-semibold tabular-nums">
                            {formatMoney(deal.value, deal.currency, { compact: true })}
                          </span>
                        </span>
                        <span className="mt-1 flex items-center gap-2">
                          <Chip tone={stage.tone}>{stage.label}</Chip>
                          <span
                            className="text-[11px] tabular-nums"
                            style={{ color: "var(--text-faint)" }}
                          >
                            {deal.probability}%
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

        </div>
      </div>
    </>
  );
}
