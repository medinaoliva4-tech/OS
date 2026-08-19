"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { canViewFinancials } from "@/lib/policy";
import { logActivity } from "@/lib/activity";
import { DEAL_STAGES } from "@/lib/domain";

const VALID_STAGES = DEAL_STAGES.map((s) => s.value);

/** Deals are money — every mutation here is off-limits below ADMIN. */
function requireFinancialAccess(user: { role: string }) {
  if (!canViewFinancials(user.role)) {
    throw new Error("You don't have access to financial data.");
  }
}

export async function setDealStage(dealId: string, stage: string) {
  const user = await requireUser();
  requireFinancialAccess(user);
  if (!VALID_STAGES.includes(stage)) {
    throw new Error(`Unknown deal stage: ${stage}`);
  }

  const isClosed = stage === "WON" || stage === "LOST";

  const deal = await db.deal.update({
    where: { id: dealId },
    data: {
      stage,
      closedAt: isClosed ? new Date() : null,
      // Closing a deal makes probability a statement of fact, not a guess.
      probability: stage === "WON" ? 100 : stage === "LOST" ? 0 : undefined,
    },
    include: { account: { select: { name: true } } },
  });

  await logActivity({
    actorId: user.id,
    verb: "moved",
    entityType: "Deal",
    entityId: deal.id,
    summary: `${deal.title} → ${stage.toLowerCase()}`,
    meta: { account: deal.account.name, stage, value: deal.value },
  });

  revalidatePath("/", "layout");
}

export async function createDeal(formData: FormData) {
  const user = await requireUser();
  requireFinancialAccess(user);

  const title = String(formData.get("title") ?? "").trim();
  const accountId = String(formData.get("accountId") ?? "");
  if (!title || !accountId) return;

  const value = Number(formData.get("value") ?? 0);
  const probability = Number(formData.get("probability") ?? 20);
  const stage = String(formData.get("stage") ?? "LEAD");
  const closeRaw = String(formData.get("expectedCloseDate") ?? "");

  const deal = await db.deal.create({
    data: {
      title,
      accountId,
      stage: VALID_STAGES.includes(stage) ? stage : "LEAD",
      value: Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0,
      probability: Number.isFinite(probability)
        ? Math.min(100, Math.max(0, Math.round(probability)))
        : 20,
      source: String(formData.get("source") ?? "") || null,
      expectedCloseDate: closeRaw ? new Date(closeRaw) : null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      ownerId: user.id,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "created",
    entityType: "Deal",
    entityId: deal.id,
    summary: `New deal “${title}”`,
    meta: { value: deal.value },
  });

  revalidatePath("/", "layout");
}

export async function deleteDeal(dealId: string) {
  const user = await requireUser();
  requireFinancialAccess(user);
  const deal = await db.deal.delete({ where: { id: dealId } });

  await logActivity({
    actorId: user.id,
    verb: "deleted",
    entityType: "Deal",
    entityId: dealId,
    summary: `Deleted deal “${deal.title}”`,
  });

  revalidatePath("/", "layout");
}
