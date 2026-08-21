/**
 * Token endpoint (RFC 6749 §4.1.3 + PKCE, RFC 7636).
 *
 * Exchanges the one-time code from /oauth/authorize for a bearer credential.
 * That credential isn't a separate OAuth-token type — it's a freshly minted
 * ApiToken row (the same kind Settings → API tokens creates), so /api/mcp's
 * existing auth check (src/app/api/mcp/route.ts) needs nothing extra to
 * accept it. No refresh token: the access token doesn't expire, matching
 * every other ApiToken, and is revoked the same way (Settings, or
 * revokeApiToken).
 */
import "server-only";
import { db } from "@/lib/db";
import { verifyPkce } from "@/lib/oauth";
import { generateApiToken, hashApiToken, last4 } from "@/lib/api-tokens";

function oauthError(error: string, status = 400) {
  return Response.json({ error }, { status });
}

async function readBody(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = await req.json().catch(() => ({}));
    return typeof json === "object" && json ? (json as Record<string, string>) : {};
  }
  const form = await req.formData();
  return Object.fromEntries(form.entries()) as Record<string, string>;
}

export async function POST(req: Request) {
  const body = await readBody(req);

  if (body.grant_type !== "authorization_code") {
    return oauthError("unsupported_grant_type");
  }
  const { code, redirect_uri: redirectUri, client_id: clientId, code_verifier: codeVerifier } = body;
  if (!code || !redirectUri || !clientId || !codeVerifier) {
    return oauthError("invalid_request");
  }

  const record = await db.oAuthCode.findUnique({ where: { code } });
  if (
    !record ||
    record.consumedAt ||
    record.expiresAt < new Date() ||
    record.clientId !== clientId ||
    record.redirectUri !== redirectUri
  ) {
    return oauthError("invalid_grant");
  }

  if (!verifyPkce(codeVerifier, record.codeChallenge, record.codeChallengeMethod)) {
    return oauthError("invalid_grant");
  }

  // Single-use: consume before minting anything, so a retried/duplicated
  // request can't hand out two tokens for one code.
  const { count } = await db.oAuthCode.updateMany({
    where: { id: record.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (count === 0) return oauthError("invalid_grant");

  const client = await db.oAuthClient.findUnique({ where: { id: clientId } });
  const rawToken = generateApiToken();
  await db.apiToken.create({
    data: {
      name: `OAuth — ${client?.name || "connected app"}`,
      tokenHash: hashApiToken(rawToken),
      last4: last4(rawToken),
      userId: record.userId,
    },
  });

  return Response.json({
    access_token: rawToken,
    token_type: "Bearer",
  });
}
