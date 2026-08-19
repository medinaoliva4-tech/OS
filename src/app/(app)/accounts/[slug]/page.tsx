import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney, formatRelative } from "@/lib/format";
import {
  ACCOUNT_STATUSES,
  ACCOUNT_TIERS,
  ASSET_STAGES,
  CONTENT_STAGES,
  DEAL_STAGES,
  TASK_PRIORITIES,
  option,
} from "@/lib/domain";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, EmptyState, Stat } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { PipelineTracker, type PipelineStep } from "./PipelineTracker";
import { GuidelineChecklist, type GuidelineRow } from "./GuidelineChecklist";
import { NoteComposer } from "./NoteComposer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const account = await db.account.findUnique({
    where: { slug },
    select: { name: true },
  });
  return { title: account?.name ?? "Brand" };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const account = await db.account.findUnique({
    where: { slug },
    include: {
      owner: { select: { name: true, avatarHue: true } },
      contacts: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
      deals: { orderBy: { value: "desc" } },
      guidelines: { orderBy: { position: "asc" } },
      pipelineSteps: { orderBy: { position: "asc" } },
      tasks: {
        include: { assignee: { select: { name: true, avatarHue: true } } },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      },
      contentItems: { orderBy: { scheduledFor: "asc" } },
      assets: { orderBy: { createdAt: "desc" } },
      notes: {
        include: { author: { select: { name: true, avatarHue: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!account) notFound();

  const status = option(ACCOUNT_STATUSES, account.status);
  const tier = option(ACCOUNT_TIERS, account.tier);

  const openTasks = account.tasks.filter((t) => t.status !== "DONE");
  const openDeals = account.deals.filter(
    (d) => !["WON", "LOST"].includes(d.stage),
  );
  const stepsDone = account.pipelineSteps.filter(
    (s) => s.status === "DONE",
  ).length;
  const finalAssets = account.assets.filter((a) => a.stage === "FINAL").length;
  const published = account.contentItems.filter(
    (c) => c.stage === "PUBLISHED",
  ).length;

  // The external links that make this a hub rather than another silo.
  const links = [
    account.githubRepo && {
      label: "GitHub",
      href: `https://github.com/${account.githubRepo}${account.githubPath && account.githubPath !== "/" ? `/tree/main${account.githubPath}` : ""}`,
      icon: "github" as const,
      detail: account.githubRepo,
    },
    account.driveFolderUrl && {
      label: "Drive",
      href: account.driveFolderUrl,
      icon: "drive" as const,
      detail: "Raw media",
    },
    account.jockeyWorkspace && {
      label: "Jockey",
      href: null,
      icon: "book" as const,
      detail: account.jockeyWorkspace,
    },
    account.figmaFileUrl && {
      label: "Figma",
      href: account.figmaFileUrl,
      icon: "assets" as const,
      detail: "Design file",
    },
  ].filter(Boolean) as {
    label: string;
    href: string | null;
    icon: "github" | "drive" | "book" | "assets";
    detail: string;
  }[];

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-1.5">
            <Link href="/accounts" className="link-quiet">
              Brands
            </Link>
            <span aria-hidden>/</span>
            <span>{account.name}</span>
          </span>
        }
        title={
          <span className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-sm font-bold"
              style={{
                background: `color-mix(in oklab, ${account.brandHex} 18%, transparent)`,
                color: account.brandHex,
                border: `1px solid color-mix(in oklab, ${account.brandHex} 34%, transparent)`,
              }}
            >
              {account.name.slice(0, 2).toUpperCase()}
            </span>
            {account.name}
            <Chip tone={status.tone} dot>
              {status.label}
            </Chip>
            <Chip tone={tier.tone}>{tier.label}</Chip>
          </span>
        }
        description={account.summary}
        actions={
          <>
            <Link
              href={`/tasks?brand=${account.slug}`}
              className="btn btn-ghost focusable"
            >
              <Icon name="tasks" size={15} />
              Pendientes
            </Link>
            <Link
              href={`/calendar?brand=${account.slug}`}
              className="btn btn-ghost focusable"
            >
              <Icon name="calendar" size={15} />
              Calendar
            </Link>
            <Link
              href={`/accounts/${account.slug}/edit`}
              className="btn btn-primary focusable"
            >
              Edit
            </Link>
          </>
        }
      />

      {/* Where this brand lives */}
      {links.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {links.map((link) =>
            link.href ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="surface-flat focusable inline-flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors hover:bg-[var(--bg-hover)]"
              >
                <Icon name={link.icon} size={14} filled={link.icon === "github"} />
                <span className="font-medium">{link.label}</span>
                <span style={{ color: "var(--text-faint)" }}>{link.detail}</span>
                <Icon name="external" size={12} className="opacity-50" />
              </a>
            ) : (
              <span
                key={link.label}
                className="surface-flat inline-flex items-center gap-2 px-3 py-1.5 text-[12px]"
              >
                <Icon name={link.icon} size={14} />
                <span className="font-medium">{link.label}</span>
                <span style={{ color: "var(--text-faint)" }}>{link.detail}</span>
              </span>
            ),
          )}
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="MRR" value={formatMoney(account.mrr, account.currency)} />
        <Stat
          label="Content system"
          value={`${stepsDone}/${account.pipelineSteps.length}`}
          sub="checkpoints done"
        />
        <Stat
          label="Open pendientes"
          value={openTasks.length}
          tone={openTasks.length > 0 ? "var(--color-warn)" : "var(--color-ok)"}
        />
        <Stat label="Final assets" value={finalAssets} sub={`${account.assets.length} tracked`} />
        <Stat label="Published" value={published} sub={`${account.contentItems.length} planned`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="min-w-0 space-y-5 xl:col-span-2">
          <Card>
            <CardHeader
              title="Content system"
              subtitle="Click a marker to advance a checkpoint."
            />
            <PipelineTracker
              steps={account.pipelineSteps as PipelineStep[]}
              brandHex={account.brandHex}
            />
          </Card>

          <Card>
            <CardHeader
              title="Pendientes"
              subtitle={`${openTasks.length} open · ${account.tasks.length - openTasks.length} done`}
              action={
                <Link
                  href={`/tasks?brand=${account.slug}`}
                  className="btn btn-quiet focusable"
                >
                  Board
                  <Icon name="chevronRight" size={13} />
                </Link>
              }
            />
            {openTasks.length === 0 ? (
              <EmptyState
                title="All clear"
                hint={`Nothing outstanding for ${account.name}.`}
              />
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
                {openTasks.slice(0, 10).map((task) => {
                  const priority = option(TASK_PRIORITIES, task.priority);
                  return (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 py-2.5 first:pt-0"
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          background:
                            priority.tone === "danger"
                              ? "var(--color-danger)"
                              : priority.tone === "warn"
                                ? "var(--color-warn)"
                                : "var(--text-faint)",
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[12.5px]">
                        {task.title}
                      </span>
                      {task.dueDate && (
                        <span
                          className="shrink-0 text-[11px] tabular-nums"
                          style={{ color: "var(--text-faint)" }}
                        >
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                      {task.assignee && (
                        <Avatar
                          name={task.assignee.name}
                          hue={task.assignee.avatarHue}
                          size={20}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Content"
              subtitle={`${account.contentItems.length} planned`}
              action={
                <Link href="/content" className="btn btn-quiet focusable">
                  Board
                  <Icon name="chevronRight" size={13} />
                </Link>
              }
            />
            {account.contentItems.length === 0 ? (
              <EmptyState title="Nothing planned" hint="Add pieces from the content board." />
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
                {account.contentItems.slice(0, 8).map((item) => {
                  const stage = option(CONTENT_STAGES, item.stage);
                  return (
                    <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium">
                          {item.title}
                        </span>
                        <span
                          className="block text-[11px]"
                          style={{ color: "var(--text-faint)" }}
                        >
                          {item.format.toLowerCase()} · {item.channel.toLowerCase()}
                          {item.origin ? ` · via ${item.origin.toLowerCase()}` : ""}
                        </span>
                      </span>
                      <Chip tone={stage.tone}>{stage.label}</Chip>
                      <span
                        className="w-20 shrink-0 text-right text-[11px] tabular-nums"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {formatDate(item.scheduledFor)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Assets"
              subtitle={`${account.assets.length} tracked · ${finalAssets} final`}
              action={
                <Link
                  href={`/assets?brand=${account.slug}`}
                  className="btn btn-quiet focusable"
                >
                  Library
                  <Icon name="chevronRight" size={13} />
                </Link>
              }
            />
            {account.assets.length === 0 ? (
              <EmptyState title="No assets yet" hint="Register files as they land." />
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
                {account.assets.slice(0, 8).map((asset) => {
                  const stage = option(ASSET_STAGES, asset.stage);
                  return (
                    <li key={asset.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px]">
                          {asset.name}
                        </span>
                        <span
                          className="block truncate font-mono text-[10.5px]"
                          style={{ color: "var(--text-faint)" }}
                        >
                          {asset.source.toLowerCase()}
                          {asset.path ? ` · ${asset.path}` : ""}
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

        {/* Right rail */}
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader title="Guidelines" subtitle="Click a section to advance it." />
            <GuidelineChecklist
              guidelines={account.guidelines as GuidelineRow[]}
              brandHex={account.brandHex}
            />
          </Card>

          <Card>
            <CardHeader
              title="Deals"
              subtitle={`${openDeals.length} open`}
              action={
                <Link href="/pipeline" className="btn btn-quiet focusable">
                  Pipeline
                  <Icon name="chevronRight" size={13} />
                </Link>
              }
            />
            {account.deals.length === 0 ? (
              <EmptyState title="No deals" hint="Add one from the pipeline." />
            ) : (
              <ul className="space-y-2.5">
                {account.deals.map((deal) => {
                  const stage = option(DEAL_STAGES, deal.stage);
                  return (
                    <li key={deal.id}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="min-w-0 flex-1 text-[12.5px] leading-snug">
                          {deal.title}
                        </span>
                        <span className="shrink-0 text-[12.5px] font-semibold tabular-nums">
                          {formatMoney(deal.value, deal.currency, { compact: true })}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Chip tone={stage.tone}>{stage.label}</Chip>
                        <span
                          className="text-[11px] tabular-nums"
                          style={{ color: "var(--text-faint)" }}
                        >
                          {deal.probability}% · {formatDate(deal.expectedCloseDate)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Contacts"
              subtitle={`${account.contacts.length} people`}
              action={
                <Link href="/contacts" className="btn btn-quiet focusable">
                  All
                  <Icon name="chevronRight" size={13} />
                </Link>
              }
            />
            {account.contacts.length === 0 ? (
              <EmptyState title="No contacts" hint="Add the people you actually talk to." />
            ) : (
              <ul className="space-y-2.5">
                {account.contacts.map((contact) => (
                  <li key={contact.id} className="flex items-center gap-2.5">
                    <Avatar name={contact.name} hue={200} size={26} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[12.5px] font-medium">
                          {contact.name}
                        </span>
                        {contact.isPrimary && <Chip tone="accent">Primary</Chip>}
                      </span>
                      <span
                        className="block truncate text-[11px]"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {contact.title ?? contact.email ?? "—"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Notes" subtitle="Context worth keeping." />
            <NoteComposer accountId={account.id} />
            {account.notes.length > 0 && (
              <ul className="mt-4 space-y-3.5">
                {account.notes.map((note) => (
                  <li key={note.id} className="flex gap-2.5">
                    {note.author && (
                      <Avatar
                        name={note.author.name}
                        hue={note.author.avatarHue}
                        size={22}
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] leading-relaxed">
                        {note.body}
                      </span>
                      <span
                        className="text-[10.5px]"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {note.author?.name.split(" ")[0]} ·{" "}
                        {formatRelative(note.createdAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
