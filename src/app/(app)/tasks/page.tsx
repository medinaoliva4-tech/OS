import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  TASK_BOARD_COLUMNS,
  TASK_STATUSES,
  PRIORITY_RANK,
  option,
} from "@/lib/domain";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/Card";
import { BrandDot, Chip } from "@/components/ui/Chip";
import { TaskCard, type TaskCardData } from "./TaskCard";
import { NewTaskForm } from "./NewTaskForm";

export const metadata = { title: "Pendientes" };
export const dynamic = "force-dynamic";

type Search = {
  brand?: string;
  owner?: string;
  due?: string;
  focus?: string;
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const [accounts, members] = await Promise.all([
    db.account.findMany({
      where: { kind: { not: "INTERNAL" } },
      select: { id: true, name: true, slug: true, brandHex: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const brandFilter = accounts.find((a) => a.slug === params.brand);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const tasks = await db.task.findMany({
    where: {
      ...(brandFilter ? { accountId: brandFilter.id } : {}),
      ...(params.owner === "me" && user ? { assigneeId: user.id } : {}),
      ...(params.owner === "none" ? { assigneeId: null } : {}),
      ...(params.due === "overdue"
        ? { dueDate: { lt: startOfToday }, status: { not: "DONE" } }
        : {}),
    },
    include: {
      account: { select: { name: true, slug: true, brandHex: true } },
      assignee: { select: { name: true, avatarHue: true } },
    },
    orderBy: [{ position: "asc" }, { dueDate: "asc" }],
  });

  // Sort within a column by priority, then by how soon it is due.
  const sorted = [...tasks].sort((a, b) => {
    const byPriority =
      (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    if (byPriority !== 0) return byPriority;
    const aDue = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDue = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aDue - bDue;
  });

  const byStatus = new Map<string, TaskCardData[]>();
  for (const status of TASK_BOARD_COLUMNS) byStatus.set(status, []);
  for (const task of sorted) {
    byStatus.get(task.status)?.push(task as TaskCardData);
  }

  const overdueCount = tasks.filter(
    (t) => t.status !== "DONE" && t.dueDate && t.dueDate < startOfToday,
  ).length;
  const openCount = tasks.filter((t) => t.status !== "DONE").length;

  function filterHref(next: Partial<Search>): string {
    const merged = { ...params, ...next };
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value && key !== "focus") qs.set(key, value);
    }
    const query = qs.toString();
    return query ? `/tasks?${query}` : "/tasks";
  }

  const filterPill =
    "focusable rounded-full border px-2.5 py-1 text-[11.5px] transition-colors";

  return (
    <>
      <PageHeader
        eyebrow="Production"
        title="Pendientes"
        description={
          brandFilter
            ? `Everything outstanding for ${brandFilter.name}.`
            : "Everything outstanding, across every brand. Click a card to open it."
        }
        actions={
          <NewTaskForm
            accounts={accounts}
            members={members}
            defaultAccountId={brandFilter?.id}
          />
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Brand filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label mr-1">Brand</span>
            <Link
              href={filterHref({ brand: undefined })}
              className={filterPill}
              style={{
                borderColor: !brandFilter ? "var(--accent)" : "var(--line-strong)",
                color: !brandFilter ? "var(--accent)" : "var(--text-muted)",
                background: !brandFilter
                  ? "color-mix(in oklab, var(--accent) 12%, transparent)"
                  : "transparent",
              }}
            >
              All
            </Link>
            {accounts.map((account) => {
              const active = brandFilter?.id === account.id;
              return (
                <Link
                  key={account.id}
                  href={filterHref({ brand: active ? undefined : account.slug })}
                  className={`${filterPill} inline-flex items-center gap-1.5`}
                  style={{
                    borderColor: active ? account.brandHex : "var(--line-strong)",
                    color: active ? account.brandHex : "var(--text-muted)",
                    background: active
                      ? `color-mix(in oklab, ${account.brandHex} 12%, transparent)`
                      : "transparent",
                  }}
                >
                  <BrandDot hex={account.brandHex} size={7} />
                  {account.name}
                </Link>
              );
            })}
          </div>

          {/* Owner + due filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label mr-1">Filter</span>
            {[
              { key: "owner", value: "me", label: "Mine" },
              { key: "owner", value: "none", label: "Unassigned" },
              { key: "due", value: "overdue", label: "Overdue" },
            ].map((filter) => {
              const active =
                params[filter.key as "owner" | "due"] === filter.value;
              return (
                <Link
                  key={`${filter.key}-${filter.value}`}
                  href={filterHref({
                    [filter.key]: active ? undefined : filter.value,
                  })}
                  className={filterPill}
                  style={{
                    borderColor: active ? "var(--accent)" : "var(--line-strong)",
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    background: active
                      ? "color-mix(in oklab, var(--accent) 12%, transparent)"
                      : "transparent",
                  }}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>

          <span
            className="ml-auto text-[11.5px] tabular-nums"
            style={{ color: "var(--text-faint)" }}
          >
            {openCount} open
            {overdueCount > 0 && (
              <>
                {" · "}
                <span style={{ color: "var(--color-danger)" }}>
                  {overdueCount} overdue
                </span>
              </>
            )}
          </span>
        </div>
      </PageHeader>

      {tasks.length === 0 ? (
        <EmptyState
          title="Nothing here"
          hint={
            brandFilter
              ? `${brandFilter.name} has no tasks matching these filters.`
              : "No tasks match these filters."
          }
          action={
            <Link href="/tasks" className="btn btn-ghost focusable">
              Clear filters
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {TASK_BOARD_COLUMNS.map((status) => {
            const column = byStatus.get(status) ?? [];
            const meta = option(TASK_STATUSES, status);

            return (
              <section key={status} className="min-w-0">
                <header className="mb-2.5 flex items-center justify-between gap-2 px-0.5">
                  <span className="flex items-center gap-2">
                    <Chip tone={meta.tone} dot>
                      {meta.label}
                    </Chip>
                  </span>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {column.length}
                  </span>
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
                    column.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        members={members}
                        highlighted={params.focus === task.id}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
