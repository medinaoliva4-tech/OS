"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import {
  ASSET_STAGES,
  CONTENT_CHANNELS,
  CONTENT_FORMATS,
  CONTENT_STAGES,
  GUIDELINE_STATUSES,
  PIPELINE_STATUSES,
} from "@/lib/domain";

const VALID_CONTENT_STAGES = CONTENT_STAGES.map((s) => s.value);
const VALID_FORMATS = CONTENT_FORMATS.map((f) => f.value);
const VALID_CHANNELS = CONTENT_CHANNELS.map((c) => c.value);
const VALID_ASSET_STAGES = ASSET_STAGES.map((s) => s.value);
const VALID_GUIDELINE_STATUSES = GUIDELINE_STATUSES.map((s) => s.value);
const VALID_PIPELINE_STATUSES = PIPELINE_STATUSES.map((s) => s.value);

function refresh() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Content items
// ---------------------------------------------------------------------------

export async function setContentStage(contentId: string, stage: string) {
  const user = await requireUser();
  if (!VALID_CONTENT_STAGES.includes(stage)) {
    throw new Error(`Unknown content stage: ${stage}`);
  }

  const item = await db.contentItem.update({
    where: { id: contentId },
    data: {
      stage,
      publishedAt: stage === "PUBLISHED" ? new Date() : null,
    },
    include: { account: { select: { name: true } } },
  });

  await logActivity({
    actorId: user.id,
    verb: "moved",
    entityType: "ContentItem",
    entityId: item.id,
    summary: `${item.title} → ${stage.toLowerCase()}`,
    meta: { account: item.account.name, stage },
  });

  refresh();
}

export async function createContentItem(formData: FormData) {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const accountId = String(formData.get("accountId") ?? "");
  if (!title || !accountId) return;

  const format = String(formData.get("format") ?? "POST");
  const channel = String(formData.get("channel") ?? "INSTAGRAM");
  const stage = String(formData.get("stage") ?? "IDEA");
  const scheduledRaw = String(formData.get("scheduledFor") ?? "");

  const item = await db.contentItem.create({
    data: {
      title,
      accountId,
      format: VALID_FORMATS.includes(format) ? format : "POST",
      channel: VALID_CHANNELS.includes(channel) ? channel : "INSTAGRAM",
      stage: VALID_CONTENT_STAGES.includes(stage) ? stage : "IDEA",
      scheduledFor: scheduledRaw ? new Date(scheduledRaw) : null,
      hook: String(formData.get("hook") ?? "").trim() || null,
      caption: String(formData.get("caption") ?? "").trim() || null,
      origin: String(formData.get("origin") ?? "") || null,
      ownerId: user.id,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "created",
    entityType: "ContentItem",
    entityId: item.id,
    summary: `Planned “${title}”`,
  });

  refresh();
}

export async function rescheduleContent(contentId: string, isoDate: string) {
  const user = await requireUser();
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return;

  const item = await db.contentItem.update({
    where: { id: contentId },
    data: { scheduledFor: date },
  });

  await logActivity({
    actorId: user.id,
    verb: "updated",
    entityType: "ContentItem",
    entityId: item.id,
    summary: `Rescheduled “${item.title}”`,
  });

  refresh();
}

export async function deleteContentItem(contentId: string) {
  const user = await requireUser();
  const item = await db.contentItem.delete({ where: { id: contentId } });

  await logActivity({
    actorId: user.id,
    verb: "deleted",
    entityType: "ContentItem",
    entityId: contentId,
    summary: `Removed “${item.title}”`,
  });

  refresh();
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export async function setAssetStage(assetId: string, stage: string) {
  const user = await requireUser();
  if (!VALID_ASSET_STAGES.includes(stage)) {
    throw new Error(`Unknown asset stage: ${stage}`);
  }

  const asset = await db.asset.update({
    where: { id: assetId },
    data: { stage },
  });

  await logActivity({
    actorId: user.id,
    verb: "moved",
    entityType: "Asset",
    entityId: asset.id,
    summary: `${asset.name} → ${stage.toLowerCase()}`,
  });

  refresh();
}

export async function createAsset(formData: FormData) {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const accountId = String(formData.get("accountId") ?? "");
  if (!name || !accountId) return;

  const asset = await db.asset.create({
    data: {
      name,
      accountId,
      kind: String(formData.get("kind") ?? "IMAGE"),
      stage: String(formData.get("stage") ?? "RAW"),
      source: String(formData.get("source") ?? "DRIVE"),
      url: String(formData.get("url") ?? "").trim() || null,
      path: String(formData.get("path") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "created",
    entityType: "Asset",
    entityId: asset.id,
    summary: `Registered “${name}”`,
  });

  refresh();
}

export async function deleteAsset(assetId: string) {
  const user = await requireUser();
  const asset = await db.asset.delete({ where: { id: assetId } });

  await logActivity({
    actorId: user.id,
    verb: "deleted",
    entityType: "Asset",
    entityId: assetId,
    summary: `Removed “${asset.name}”`,
  });

  refresh();
}

// ---------------------------------------------------------------------------
// Guidelines & pipeline
// ---------------------------------------------------------------------------

export async function setGuidelineStatus(guidelineId: string, status: string) {
  const user = await requireUser();
  if (!VALID_GUIDELINE_STATUSES.includes(status)) return;

  const guideline = await db.guideline.update({
    where: { id: guidelineId },
    data: { status },
  });

  await logActivity({
    actorId: user.id,
    verb: "updated",
    entityType: "Guideline",
    entityId: guideline.id,
    summary: `${guideline.section} → ${status.toLowerCase()}`,
  });

  refresh();
}

export async function updateGuideline(
  guidelineId: string,
  data: { content: string; sourceUrl: string },
) {
  const user = await requireUser();

  const guideline = await db.guideline.update({
    where: { id: guidelineId },
    data: {
      content: data.content.trim() || null,
      sourceUrl: data.sourceUrl.trim() || null,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "updated",
    entityType: "Guideline",
    entityId: guideline.id,
    summary: `Updated ${guideline.section} guideline content`,
  });

  refresh();
}

export async function setPipelineStepStatus(stepId: string, status: string) {
  const user = await requireUser();
  if (!VALID_PIPELINE_STATUSES.includes(status)) return;

  const step = await db.contentPipelineStep.update({
    where: { id: stepId },
    data: { status, updatedBy: user.name },
    include: { account: { select: { name: true } } },
  });

  await logActivity({
    actorId: user.id,
    verb: "moved",
    entityType: "ContentPipelineStep",
    entityId: step.id,
    summary: `${step.account.name} · ${step.label} → ${status.toLowerCase().replace("_", " ")}`,
  });

  refresh();
}
