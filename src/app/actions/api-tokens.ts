"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { generateApiToken, hashApiToken, last4 } from "@/lib/api-tokens";
import { logActivity } from "@/lib/activity";

export type ApiTokenState = { error?: string; ok?: string; token?: string };

/**
 * Mints a personal access token for the remote MCP connector. The raw value
 * is returned once in `token` — only its hash is ever stored — so the UI
 * must show it to the user immediately and can't recover it afterward.
 */
export async function createApiToken(
  _prev: ApiTokenState,
  formData: FormData,
): Promise<ApiTokenState> {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name the token so you can recognize it later." };

  const rawToken = generateApiToken();

  await db.apiToken.create({
    data: {
      name,
      tokenHash: hashApiToken(rawToken),
      last4: last4(rawToken),
      userId: user.id,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "created",
    entityType: "ApiToken",
    entityId: user.id,
    summary: `${user.name} created a new API token ("${name}")`,
  });

  revalidatePath("/settings");
  return { ok: "Token created — copy it now, it won't be shown again.", token: rawToken };
}

export async function revokeApiToken(
  _prev: ApiTokenState,
  formData: FormData,
): Promise<ApiTokenState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing token id." };

  const existing = await db.apiToken.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { error: "Token not found." };
  }

  await db.apiToken.update({ where: { id }, data: { revokedAt: new Date() } });

  await logActivity({
    actorId: user.id,
    verb: "revoked",
    entityType: "ApiToken",
    entityId: id,
    summary: `${user.name} revoked an API token ("${existing.name}")`,
  });

  revalidatePath("/settings");
  return { ok: "Token revoked." };
}
