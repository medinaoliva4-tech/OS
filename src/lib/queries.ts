import "server-only";
import { db } from "@/lib/db";
import { OPEN_DEAL_STAGES } from "@/lib/domain";

/** Weighted pipeline: value × probability, the only forecast worth quoting. */
export function weighted(deals: { value: number; probability: number }[]): number {
  return Math.round(
    deals.reduce((sum, deal) => sum + deal.value * (deal.probability / 100), 0),
  );
}

export async function getDashboardData() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86_400_000);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    accounts,
    openDeals,
    wonDeals,
    tasks,
    overdueTasks,
    upcomingContent,
    pipelineSteps,
    integrations,
    activity,
  ] = await Promise.all([
    db.account.findMany({
      where: { kind: { not: "INTERNAL" } },
      include: {
        owner: { select: { name: true, avatarHue: true } },
        _count: { select: { tasks: true, contentItems: true, assets: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.deal.findMany({
      where: { stage: { in: OPEN_DEAL_STAGES } },
      include: { account: { select: { name: true, slug: true, brandHex: true } } },
      orderBy: { value: "desc" },
    }),
    db.deal.findMany({ where: { stage: "WON" } }),
    db.task.findMany({
      where: { status: { not: "DONE" } },
      include: {
        account: { select: { name: true, slug: true, brandHex: true } },
        assignee: { select: { name: true, avatarHue: true } },
      },
      orderBy: [{ dueDate: "asc" }],
    }),
    db.task.count({
      where: { status: { not: "DONE" }, dueDate: { lt: startOfToday } },
    }),
    db.contentItem.findMany({
      where: {
        scheduledFor: { gte: startOfToday, lte: in7Days },
        stage: { not: "PUBLISHED" },
      },
      include: { account: { select: { name: true, slug: true, brandHex: true } } },
      orderBy: { scheduledFor: "asc" },
      take: 8,
    }),
    db.contentPipelineStep.findMany({
      include: { account: { select: { name: true, slug: true, brandHex: true } } },
      orderBy: [{ accountId: "asc" }, { position: "asc" }],
    }),
    db.integration.findMany({ orderBy: { position: "asc" } }),
    db.activity.findMany({
      include: { actor: { select: { name: true, avatarHue: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const mrr = accounts
    .filter((a) => a.status === "ACTIVE")
    .reduce((sum, a) => sum + a.mrr, 0);

  return {
    accounts,
    openDeals,
    wonValue: wonDeals.reduce((sum, d) => sum + d.value, 0),
    tasks,
    overdueTasks,
    upcomingContent,
    pipelineSteps,
    integrations,
    activity,
    mrr,
    weightedPipeline: weighted(openDeals),
  };
}

export type BrandProgress = {
  done: number;
  total: number;
  blocked: number;
  inProgress: number;
};

/** Per-brand progress through the nine content-system checkpoints. */
export function pipelineProgress(
  steps: { accountId: string; status: string }[],
): Map<string, BrandProgress> {
  const map = new Map<string, BrandProgress>();

  for (const step of steps) {
    const entry = map.get(step.accountId) ?? {
      done: 0,
      total: 0,
      blocked: 0,
      inProgress: 0,
    };
    entry.total += 1;
    if (step.status === "DONE") entry.done += 1;
    if (step.status === "BLOCKED") entry.blocked += 1;
    if (step.status === "IN_PROGRESS") entry.inProgress += 1;
    map.set(step.accountId, entry);
  }

  return map;
}
