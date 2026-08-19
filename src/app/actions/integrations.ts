"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { INTEGRATION_STATUSES } from "@/lib/domain";

const VALID_STATUSES = INTEGRATION_STATUSES.map((s) => s.value);

export async function setIntegrationStatus(
  integrationId: string,
  status: string,
) {
  const user = await requireUser();
  if (!VALID_STATUSES.includes(status)) return;

  const integration = await db.integration.update({
    where: { id: integrationId },
    data: {
      status,
      lastSyncAt: status === "CONNECTED" ? new Date() : undefined,
      lastError: status === "ERROR" ? undefined : null,
    },
  });

  await db.syncEvent.create({
    data: {
      integrationId: integration.id,
      level: status === "CONNECTED" ? "OK" : status === "ERROR" ? "ERROR" : "WARN",
      message: `Marked ${status.toLowerCase().replace("_", " ")} by ${user.name}`,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "connected",
    entityType: "Integration",
    entityId: integration.id,
    summary: `${integration.name} → ${status.toLowerCase().replace("_", " ")}`,
  });

  revalidatePath("/", "layout");
}

export async function updateIntegrationConfig(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const raw = String(formData.get("config") ?? "{}").trim() || "{}";

  // Store only valid JSON so the Connections screen can always render it.
  let config = "{}";
  try {
    config = JSON.stringify(JSON.parse(raw));
  } catch {
    await db.integration.update({
      where: { id },
      data: { lastError: "Config was not valid JSON and was not saved." },
    });
    revalidatePath("/connections");
    return;
  }

  const integration = await db.integration.update({
    where: { id },
    data: {
      config,
      summary: String(formData.get("summary") ?? "").trim() || null,
      docsUrl: String(formData.get("docsUrl") ?? "").trim() || null,
      lastError: null,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "updated",
    entityType: "Integration",
    entityId: integration.id,
    summary: `Updated ${integration.name} config`,
  });

  revalidatePath("/connections");
}

/**
 * Record a sync attempt. Real sync jobs call this; the button on the
 * Connections screen calls it too so the log reflects manual checks.
 */
export async function recordSync(integrationId: string) {
  const user = await requireUser();

  const integration = await db.integration.findUnique({
    where: { id: integrationId },
  });
  if (!integration) return;

  const configured = integration.envKey
    ? Boolean(process.env[integration.envKey])
    : integration.status === "CONNECTED";

  await db.integration.update({
    where: { id: integrationId },
    data: {
      lastSyncAt: new Date(),
      status: configured ? "CONNECTED" : "NEEDS_SETUP",
      lastError: configured
        ? null
        : `${integration.envKey ?? "Credentials"} is not set in the environment.`,
    },
  });

  await db.syncEvent.create({
    data: {
      integrationId,
      level: configured ? "OK" : "WARN",
      message: configured
        ? `Checked by ${user.name} — credentials present`
        : `Checked by ${user.name} — ${integration.envKey ?? "credentials"} missing`,
    },
  });

  revalidatePath("/connections");
}
