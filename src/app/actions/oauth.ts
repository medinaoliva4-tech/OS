"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { generateAuthCode, OAUTH_CODE_TTL_MS } from "@/lib/oauth";
import { logActivity } from "@/lib/activity";

type AuthorizeParams = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string | null;
};

function readParams(formData: FormData): AuthorizeParams {
  return {
    clientId: String(formData.get("client_id") ?? ""),
    redirectUri: String(formData.get("redirect_uri") ?? ""),
    codeChallenge: String(formData.get("code_challenge") ?? ""),
    codeChallengeMethod: String(formData.get("code_challenge_method") ?? "S256"),
    state: formData.get("state") ? String(formData.get("state")) : null,
  };
}

function withState(url: string, extra: Record<string, string>, state: string | null): string {
  const target = new URL(url);
  for (const [key, value] of Object.entries(extra)) target.searchParams.set(key, value);
  if (state) target.searchParams.set("state", state);
  return target.toString();
}

/**
 * The user clicked "Allow" on the consent screen. Re-validates the client
 * and redirect_uri server-side — the hidden form fields are just a courtesy,
 * not the actual gate, since a client could tamper with them in transit.
 */
export async function approveOAuth(formData: FormData): Promise<never> {
  const user = await requireUser();
  const { clientId, redirectUri, codeChallenge, codeChallengeMethod, state } = readParams(formData);

  const client = await db.oAuthClient.findUnique({ where: { id: clientId } });
  if (!client || !client.redirectUris.includes(redirectUri)) {
    redirect("/oauth/authorize/error?reason=invalid_client");
  }

  const code = generateAuthCode();
  await db.oAuthCode.create({
    data: {
      code,
      clientId,
      userId: user.id,
      redirectUri,
      codeChallenge,
      codeChallengeMethod,
      expiresAt: new Date(Date.now() + OAUTH_CODE_TTL_MS),
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "connected",
    entityType: "OAuthClient",
    entityId: clientId,
    summary: `${user.name} connected ${client.name ?? "an MCP client"} via OAuth`,
  });

  redirect(withState(redirectUri, { code }, state));
}

export async function denyOAuth(formData: FormData): Promise<never> {
  await requireUser();
  const { clientId, redirectUri, state } = readParams(formData);

  const client = await db.oAuthClient.findUnique({ where: { id: clientId } });
  if (!client || !client.redirectUris.includes(redirectUri)) {
    redirect("/oauth/authorize/error?reason=invalid_client");
  }

  redirect(withState(redirectUri, { error: "access_denied" }, state));
}
