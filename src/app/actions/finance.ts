"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { canViewFinancials } from "@/lib/policy";
import { logActivity } from "@/lib/activity";

/** Everything here is money — same gate as deals and MRR. */
function requireFinancialAccess(user: { role: string }) {
  if (!canViewFinancials(user.role)) {
    throw new Error("You don't have access to financial data.");
  }
}

function numberOf(formData: FormData, key: string): number {
  const n = Number(formData.get(key) ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

// ---------------------------------------------------------------------------
// Costs
// ---------------------------------------------------------------------------

export async function createCost(formData: FormData) {
  const user = await requireUser();
  requireFinancialAccess(user);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const cost = await db.cost.create({
    data: {
      name,
      category: String(formData.get("category") ?? "OTHER"),
      amount: numberOf(formData, "amount"),
      currency: String(formData.get("currency") ?? "USD"),
      recurrence: String(formData.get("recurrence") ?? "MONTHLY"),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "created",
    entityType: "Cost",
    entityId: cost.id,
    summary: `New cost “${name}”`,
  });

  revalidatePath("/finance");
}

export async function deleteCost(costId: string) {
  const user = await requireUser();
  requireFinancialAccess(user);
  const cost = await db.cost.delete({ where: { id: costId } });

  await logActivity({
    actorId: user.id,
    verb: "deleted",
    entityType: "Cost",
    entityId: costId,
    summary: `Deleted cost “${cost.name}”`,
  });

  revalidatePath("/finance");
}

// ---------------------------------------------------------------------------
// Salaries — one row per person, upserted by userId.
// ---------------------------------------------------------------------------

export async function upsertSalary(formData: FormData) {
  const user = await requireUser();
  requireFinancialAccess(user);

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  const data = {
    amount: numberOf(formData, "amount"),
    currency: String(formData.get("currency") ?? "USD"),
    cadence: String(formData.get("cadence") ?? "MONTHLY"),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };

  const salary = await db.salary.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    include: { user: { select: { name: true } } },
  });

  await logActivity({
    actorId: user.id,
    verb: "updated",
    entityType: "Salary",
    entityId: salary.id,
    summary: `Set pay for ${salary.user.name}`,
  });

  revalidatePath("/finance");
}

export async function deleteSalary(salaryId: string) {
  const user = await requireUser();
  requireFinancialAccess(user);
  const salary = await db.salary.delete({
    where: { id: salaryId },
    include: { user: { select: { name: true } } },
  });

  await logActivity({
    actorId: user.id,
    verb: "deleted",
    entityType: "Salary",
    entityId: salaryId,
    summary: `Removed pay record for ${salary.user.name}`,
  });

  revalidatePath("/finance");
}

// ---------------------------------------------------------------------------
// Reinvestments
// ---------------------------------------------------------------------------

export async function createReinvestment(formData: FormData) {
  const user = await requireUser();
  requireFinancialAccess(user);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const dateRaw = String(formData.get("date") ?? "");

  const reinvestment = await db.reinvestment.create({
    data: {
      title,
      amount: numberOf(formData, "amount"),
      currency: String(formData.get("currency") ?? "USD"),
      date: dateRaw ? new Date(dateRaw) : new Date(),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "created",
    entityType: "Reinvestment",
    entityId: reinvestment.id,
    summary: `Reinvestment logged: ${title}`,
  });

  revalidatePath("/finance");
}

export async function deleteReinvestment(reinvestmentId: string) {
  const user = await requireUser();
  requireFinancialAccess(user);
  const reinvestment = await db.reinvestment.delete({ where: { id: reinvestmentId } });

  await logActivity({
    actorId: user.id,
    verb: "deleted",
    entityType: "Reinvestment",
    entityId: reinvestmentId,
    summary: `Deleted reinvestment “${reinvestment.title}”`,
  });

  revalidatePath("/finance");
}
