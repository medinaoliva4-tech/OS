import Link from "next/link";
import { db } from "@/lib/db";
import { CONTENT_STAGES, option } from "@/lib/domain";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, EmptyState } from "@/components/ui/Card";
import { BrandDot, Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { NewContentForm } from "../content/NewContentForm";

export const metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

type Search = { brand?: string; month?: string };

/** Monday-first grid covering the whole month plus the padding days. */
function buildGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const startOffset = (first.getUTCDay() + 6) % 7; // Mon = 0
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - startOffset);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    cells.push(date);
  }
  // Trim a trailing all-padding week so short months don't render a dead row.
  const trimmed = cells.slice(0, 35);
  const lastWeek = cells.slice(35);
  return lastWeek.some((d) => d.getUTCMonth() === month) ? cells : trimmed;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;

  const accounts = await db.account.findMany({
    where: { kind: { not: "INTERNAL" } },
    select: { id: true, name: true, slug: true, brandHex: true },
    orderBy: { name: "asc" },
  });

  const brandFilter = accounts.find((a) => a.slug === params.brand);

  // month param is YYYY-MM; default to the current month.
  const today = new Date();
  const parsed = /^(\d{4})-(\d{2})$/.exec(params.month ?? "");
  const year = parsed ? Number(parsed[1]) : today.getUTCFullYear();
  const month = parsed ? Number(parsed[2]) - 1 : today.getUTCMonth();

  const rangeStart = new Date(Date.UTC(year, month, 1));
  const rangeEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
  const grid = buildGrid(year, month);
  const gridStart = grid[0];
  const gridEnd = new Date(grid[grid.length - 1]);
  gridEnd.setUTCHours(23, 59, 59);

  const items = await db.contentItem.findMany({
    where: {
      ...(brandFilter ? { accountId: brandFilter.id } : {}),
      scheduledFor: { gte: gridStart, lte: gridEnd },
    },
    include: { account: { select: { name: true, slug: true, brandHex: true } } },
    orderBy: { scheduledFor: "asc" },
  });

  // Bucket by UTC calendar day so a piece lands on the day it is scheduled.
  const byDay = new Map<string, typeof items>();
  for (const item of items) {
    if (!item.scheduledFor) continue;
    const key = item.scheduledFor.toISOString().slice(0, 10);
    const bucket = byDay.get(key) ?? [];
    bucket.push(item);
    byDay.set(key, bucket);
  }

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(rangeStart);

  const prev = new Date(Date.UTC(year, month - 1, 1));
  const next = new Date(Date.UTC(year, month + 1, 1));
  const monthParam = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

  function href(overrides: Partial<Search>): string {
    const merged = { brand: params.brand, month: params.month, ...overrides };
    const qs = new URLSearchParams();
    if (merged.brand) qs.set("brand", merged.brand);
    if (merged.month) qs.set("month", merged.month);
    const query = qs.toString();
    return query ? `/calendar?${query}` : "/calendar";
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const inMonth = items.filter(
    (i) => i.scheduledFor && i.scheduledFor >= rangeStart && i.scheduledFor <= rangeEnd,
  );

  const filterPill =
    "focusable rounded-full border px-2.5 py-1 text-[11.5px] transition-colors";

  return (
    <>
      <PageHeader
        eyebrow="Production"
        title={brandFilter ? `${brandFilter.name} calendar` : "Calendar"}
        description={`${inMonth.length} ${inMonth.length === 1 ? "piece" : "pieces"} scheduled in ${monthLabel}.`}
        actions={
          <>
            <Link href={href({ month: monthParam(prev) })} className="btn btn-ghost focusable" aria-label="Previous month">
              ‹
            </Link>
            <Link href={href({ month: undefined })} className="btn btn-ghost focusable">
              Today
            </Link>
            <Link href={href({ month: monthParam(next) })} className="btn btn-ghost focusable" aria-label="Next month">
              ›
            </Link>
            <NewContentForm accounts={accounts} defaultAccountId={brandFilter?.id} />
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label mr-1">Brand</span>
          <Link
            href={href({ brand: undefined })}
            className={filterPill}
            style={{
              borderColor: !brandFilter ? "var(--accent)" : "var(--line-strong)",
              color: !brandFilter ? "var(--accent)" : "var(--text-muted)",
              background: !brandFilter
                ? "color-mix(in oklab, var(--accent) 12%, transparent)"
                : "transparent",
            }}
          >
            All brands
          </Link>
          {accounts.map((account) => {
            const active = brandFilter?.id === account.id;
            return (
              <Link
                key={account.id}
                href={href({ brand: active ? undefined : account.slug })}
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
      </PageHeader>

      <Card padded={false} className="overflow-hidden">
        <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--line)" }}>
          {DAY_NAMES.map((day) => (
            <div key={day} className="label px-3 py-2.5 text-center">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((date, index) => {
            const key = date.toISOString().slice(0, 10);
            const dayItems = byDay.get(key) ?? [];
            const isCurrentMonth = date.getUTCMonth() === month;
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                className="min-h-[104px] border-b border-r p-1.5 last:border-r-0"
                style={{
                  borderColor: "var(--line)",
                  background: isCurrentMonth ? "transparent" : "var(--bg-overlay)",
                  borderRightWidth: (index + 1) % 7 === 0 ? 0 : 1,
                }}
              >
                <div className="mb-1 flex items-center justify-between px-0.5">
                  <span
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-medium tabular-nums"
                    style={{
                      background: isToday ? "var(--accent)" : "transparent",
                      color: isToday
                        ? "var(--accent-ink)"
                        : isCurrentMonth
                          ? "var(--text-muted)"
                          : "var(--text-faint)",
                    }}
                  >
                    {date.getUTCDate()}
                  </span>
                  {dayItems.length > 2 && (
                    <span
                      className="text-[10px] tabular-nums"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {dayItems.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayItems.slice(0, 3).map((item) => {
                    const stage = option(CONTENT_STAGES, item.stage);
                    return (
                      <Link
                        key={item.id}
                        href={`/content?brand=${item.account.slug}`}
                        title={`${item.account.name} · ${item.title} · ${stage.label}`}
                        className="focusable block truncate rounded-[6px] px-1.5 py-1 text-[10.5px] leading-tight transition-opacity hover:opacity-80"
                        style={{
                          background: `color-mix(in oklab, ${item.account.brandHex} 16%, transparent)`,
                          borderLeft: `2px solid ${item.account.brandHex}`,
                          color: "var(--text)",
                        }}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                  {dayItems.length > 3 && (
                    <p
                      className="px-1.5 text-[10px]"
                      style={{ color: "var(--text-faint)" }}
                    >
                      +{dayItems.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Agenda strip — the calendar answers "when", this answers "what next". */}
      <div className="mt-5">
        <Card>
          <CardHeader
            title="Up next"
            subtitle="The next pieces due, in order."
            action={
              <Link href="/content" className="btn btn-quiet focusable">
                Board
                <Icon name="chevronRight" size={13} />
              </Link>
            }
          />
          {inMonth.length === 0 ? (
            <EmptyState
              title={`Nothing scheduled in ${monthLabel}`}
              hint="Plan a piece and it appears on the grid."
            />
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
              {inMonth.slice(0, 10).map((item) => {
                const stage = option(CONTENT_STAGES, item.stage);
                return (
                  <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                    <span
                      className="w-14 shrink-0 text-[11px] tabular-nums"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      }).format(item.scheduledFor!)}
                    </span>
                    <BrandDot hex={item.account.brandHex} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium">
                        {item.title}
                      </span>
                      <span
                        className="block text-[11px]"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {item.account.name} · {item.format.toLowerCase()} ·{" "}
                        {item.channel.toLowerCase()}
                      </span>
                    </span>
                    <Chip tone={stage.tone}>{stage.label}</Chip>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
