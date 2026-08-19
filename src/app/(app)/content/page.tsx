import Link from "next/link";
import { db } from "@/lib/db";
import { CONTENT_BOARD_COLUMNS, CONTENT_STAGES, option } from "@/lib/domain";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/Card";
import { BrandDot, Chip } from "@/components/ui/Chip";
import { ContentCard, type ContentCardData } from "./ContentCard";
import { NewContentForm } from "./NewContentForm";

export const metadata = { title: "Content" };
export const dynamic = "force-dynamic";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const params = await searchParams;

  const accounts = await db.account.findMany({
    where: { kind: { not: "INTERNAL" } },
    select: { id: true, name: true, slug: true, brandHex: true },
    orderBy: { name: "asc" },
  });

  const brandFilter = accounts.find((a) => a.slug === params.brand);

  const items = await db.contentItem.findMany({
    where: brandFilter ? { accountId: brandFilter.id } : {},
    include: { account: { select: { name: true, slug: true, brandHex: true } } },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
  });

  const byStage = new Map<string, ContentCardData[]>();
  for (const stage of CONTENT_BOARD_COLUMNS) byStage.set(stage, []);
  for (const item of items) byStage.get(item.stage)?.push(item as ContentCardData);

  const filterPill =
    "focusable rounded-full border px-2.5 py-1 text-[11.5px] transition-colors";

  return (
    <>
      <PageHeader
        eyebrow="Production"
        title="Content"
        description="Idea to published. Move a piece with its stage select — the calendar and the brand page follow along."
        actions={
          <NewContentForm accounts={accounts} defaultAccountId={brandFilter?.id} />
        }
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label mr-1">Brand</span>
          <Link
            href="/content"
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
                href={active ? "/content" : `/content?brand=${account.slug}`}
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

      {items.length === 0 ? (
        <EmptyState
          title="Nothing planned"
          hint="Plan the first piece and it flows through to the calendar."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {CONTENT_BOARD_COLUMNS.map((stage) => {
            const column = byStage.get(stage) ?? [];
            const meta = option(CONTENT_STAGES, stage);

            return (
              <section key={stage} className="min-w-0">
                <header className="mb-2.5 flex items-center justify-between gap-2 px-0.5">
                  <Chip tone={meta.tone} dot>
                    {meta.label}
                  </Chip>
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
                    column.map((item) => (
                      <ContentCard key={item.id} item={item} />
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
