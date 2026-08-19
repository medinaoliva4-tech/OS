"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { canViewFinancials } from "@/lib/policy";
import { logActivity } from "@/lib/activity";
import { swatchFor } from "@/lib/brand";
import { CONTENT_PIPELINE, GUIDELINE_SECTIONS } from "@/lib/pipeline-blueprint";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Accept only an inline image or an https URL — never arbitrary markup. */
const MAX_LOGO_BYTES = 512 * 1024;

function sanitizeLogo(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.length > MAX_LOGO_BYTES * 1.4) return null;

  if (/^data:image\/(svg\+xml|png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) {
    return value;
  }
  if (/^https:\/\/[^\s"'<>]+$/i.test(value)) return value;
  return null;
}

export async function createAccount(formData: FormData) {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  // Guarantee a unique slug rather than failing on the unique constraint.
  const base = slugify(name) || "brand";
  let slug = base;
  let suffix = 2;
  while (await db.account.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  // Ignored outright for a viewer without financial access — never trust a
  // hidden-field or crafted request to set MRR just because the form field
  // wasn't rendered for them.
  const canSetMrr = canViewFinancials(user.role);
  const mrr = canSetMrr ? Number(formData.get("mrr") ?? 0) : 0;

  const account = await db.account.create({
    data: {
      name,
      slug,
      kind: String(formData.get("kind") ?? "CLIENT"),
      status: String(formData.get("status") ?? "ONBOARDING"),
      tier: String(formData.get("tier") ?? "GROWTH"),
      industry: String(formData.get("industry") ?? "").trim() || null,
      website: String(formData.get("website") ?? "").trim() || null,
      summary: String(formData.get("summary") ?? "").trim() || null,
      brandHex: String(formData.get("brandHex") ?? "") || swatchFor(slug),
      logoUrl: sanitizeLogo(String(formData.get("logoUrl") ?? "")),
      mrr: Number.isFinite(mrr) ? Math.max(0, Math.round(mrr)) : 0,
      githubRepo: String(formData.get("githubRepo") ?? "").trim() || null,
      driveFolderUrl: String(formData.get("driveFolderUrl") ?? "").trim() || null,
      jockeyWorkspace: String(formData.get("jockeyWorkspace") ?? "").trim() || slug,
      ownerId: user.id,
    },
  });

  // A new brand starts with the same guideline sections and the same nine
  // content-system checkpoints as every other brand. Onboarding is not a
  // blank page.
  await db.guideline.createMany({
    data: GUIDELINE_SECTIONS.map((section, index) => ({
      accountId: account.id,
      section,
      position: index,
      status: "MISSING",
    })),
  });

  await db.contentPipelineStep.createMany({
    data: CONTENT_PIPELINE.map((step, index) => ({
      accountId: account.id,
      key: step.key,
      label: step.label,
      toolKey: step.toolKey,
      note: step.note,
      position: index,
      status: "NOT_STARTED",
    })),
  });

  await logActivity({
    actorId: user.id,
    verb: "created",
    entityType: "Account",
    entityId: account.id,
    summary: `Onboarded ${name}`,
  });

  revalidatePath("/", "layout");
  redirect(`/accounts/${slug}`);
}

export async function updateAccount(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Same rule as create: a viewer without financial access can never move
  // MRR, no matter what the request contains — `undefined` tells Prisma to
  // leave the field exactly as it is.
  const canSetMrr = canViewFinancials(user.role);
  const mrr = Number(formData.get("mrr") ?? 0);

  const account = await db.account.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim() || undefined,
      status: String(formData.get("status") ?? "ACTIVE"),
      tier: String(formData.get("tier") ?? "GROWTH"),
      industry: String(formData.get("industry") ?? "").trim() || null,
      website: String(formData.get("website") ?? "").trim() || null,
      summary: String(formData.get("summary") ?? "").trim() || null,
      brandHex: String(formData.get("brandHex") ?? "#5EEAD4"),
      logoUrl: sanitizeLogo(String(formData.get("logoUrl") ?? "")),
      mrr: canSetMrr
        ? Number.isFinite(mrr)
          ? Math.max(0, Math.round(mrr))
          : 0
        : undefined,
      githubRepo: String(formData.get("githubRepo") ?? "").trim() || null,
      githubPath: String(formData.get("githubPath") ?? "").trim() || null,
      driveFolderUrl: String(formData.get("driveFolderUrl") ?? "").trim() || null,
      jockeyWorkspace: String(formData.get("jockeyWorkspace") ?? "").trim() || null,
      figmaFileUrl: String(formData.get("figmaFileUrl") ?? "").trim() || null,
      ownerId: String(formData.get("ownerId") ?? "") || null,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "updated",
    entityType: "Account",
    entityId: account.id,
    summary: `Updated ${account.name}`,
  });

  revalidatePath("/", "layout");
}

export async function createContact(formData: FormData) {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const accountId = String(formData.get("accountId") ?? "");
  if (!name || !accountId) return;

  const contact = await db.contact.create({
    data: {
      name,
      accountId,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      title: String(formData.get("title") ?? "").trim() || null,
      linkedin: String(formData.get("linkedin") ?? "").trim() || null,
      isPrimary: formData.get("isPrimary") === "on",
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "created",
    entityType: "Contact",
    entityId: contact.id,
    summary: `Added contact ${name}`,
  });

  revalidatePath("/", "layout");
}

export async function deleteContact(contactId: string) {
  const user = await requireUser();
  const contact = await db.contact.delete({ where: { id: contactId } });

  await logActivity({
    actorId: user.id,
    verb: "deleted",
    entityType: "Contact",
    entityId: contactId,
    summary: `Removed contact ${contact.name}`,
  });

  revalidatePath("/", "layout");
}

export async function addNote(formData: FormData) {
  const user = await requireUser();

  const body = String(formData.get("body") ?? "").trim();
  const entityType = String(formData.get("entityType") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  if (!body || !entityType || !entityId) return;

  await db.note.create({
    data: {
      body,
      entityType,
      entityId,
      authorId: user.id,
      accountId: entityType === "Account" ? entityId : null,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "commented",
    entityType,
    entityId,
    summary: body.slice(0, 120),
  });

  revalidatePath("/", "layout");
}
