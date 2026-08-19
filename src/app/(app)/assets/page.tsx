import Link from "next/link";
import { db } from "@/lib/db";
import { ASSET_STAGES } from "@/lib/domain";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, EmptyState, Stat } from "@/components/ui/Card";
import { BrandDot } from "@/components/ui/Chip";
import { AssetRow, type AssetRowData } from "./AssetRow";
import { NewAssetForm } from "./NewAssetForm";

export const metadata = { title: "Assets" };
export const dynamic = "force-dynamic";

type Search = { brand?: string; stage?: string; source?: string };

export default async function AssetsPage({
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
  const stageFilter = ASSET_STAGES.find((s) => s.value === params.stage);

  const assets = await db.asset.findMany({
    where: {
      ...(brandFilter ? { accountId: brandFilter.id } : {}),
      ...(stageFilter ? { stage: stageFilter.value } : {}),
      ...(params.source ? { source: params.source } : {}),
    },
    include: { account: { select: { name: true, slug: true, brandHex: true } } },
    orderBy: { createdAt: "desc" },
  });

  const all = await db.asset.findMany({ select: { stage: true } });
  const counts = ASSET_STAGES.map((stage) => ({
    ...stage,
    count: all.filter((a) => a.stage === stage.value).length,
  }));

  function href(overrides: Partial<Search>): string {
    const merged = { ...params, ...overrides };
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) qs.set(key, value);
    }
    const query = qs.toString();
    return query ? `/assets?${query}` : "/assets";
  }

  const filterPill =
    "focusable rounded-full border px-2.5 py-1 text-[11.5px] transition-colors";

  return (
    <>
      <PageHeader
        eyebrow="Production"
        title="Assets"
        description="Every file, where it lives and how far along it is. Raw → generated → approved → final."
        actions={
          <NewAssetForm accounts={accounts} defaultAccountId={brandFilter?.id} />
        }
      >
        <div className="flex flex-wrap items-center gap-4">
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
              All
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

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label mr-1">Stage</span>
            {ASSET_STAGES.map((stage) => {
              const active = params.stage === stage.value;
              return (
                <Link
                  key={stage.value}
                  href={href({ stage: active ? undefined : stage.value })}
                  className={filterPill}
                  title={stage.hint}
                  style={{
                    borderColor: active ? "var(--accent)" : "var(--line-strong)",
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    background: active
                      ? "color-mix(in oklab, var(--accent) 12%, transparent)"
                      : "transparent",
                  }}
                >
                  {stage.label}
                </Link>
              );
            })}
          </div>
        </div>
      </PageHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {counts.map((stage) => (
          <Stat
            key={stage.value}
            label={stage.label}
            value={stage.count}
            sub={stage.hint}
            href={href({ stage: stage.value })}
          />
        ))}
      </div>

      {assets.length === 0 ? (
        <EmptyState
          title="No assets match"
          hint="Register a file, or clear the filters."
          action={
            <Link href="/assets" className="btn btn-ghost focusable">
              Clear filters
            </Link>
          }
        />
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr
                  className="border-b text-left"
                  style={{ borderColor: "var(--line)" }}
                >
                  <th className="label px-5 py-3">Asset</th>
                  <th className="label py-3 pr-3">Brand</th>
                  <th className="label py-3 pr-3">Kind</th>
                  <th className="label py-3 pr-3">Lives in</th>
                  <th className="label py-3 pr-3">Stage</th>
                  <th className="label py-3 pr-3">Added</th>
                  <th className="label py-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
                {assets.map((asset) => (
                  <AssetRow key={asset.id} asset={asset as AssetRowData} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
