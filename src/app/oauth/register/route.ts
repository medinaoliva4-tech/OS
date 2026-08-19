/**
 * Dynamic Client Registration (RFC 7591).
 *
 * Claude.ai / ChatGPT call this once, the first time you add the connector,
 * to get a client_id before starting the authorize/token dance. Public
 * clients only — no secret is issued, PKCE (see src/lib/oauth.ts) is what
 * actually secures the flow.
 */
import "server-only";
import { db } from "@/lib/db";

function badRequest(message: string) {
  return Response.json({ error: "invalid_client_metadata", error_description: message }, { status: 400 });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be JSON.");
  }

  if (typeof body !== "object" || body === null) return badRequest("Request body must be a JSON object.");
  const { redirect_uris, client_name } = body as Record<string, unknown>;

  if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    return badRequest("redirect_uris is required and must be a non-empty array.");
  }
  if (!redirect_uris.every((uri) => typeof uri === "string" && uri.length > 0)) {
    return badRequest("Every redirect_uri must be a non-empty string.");
  }

  const client = await db.oAuthClient.create({
    data: {
      name: typeof client_name === "string" ? client_name.slice(0, 200) : null,
      redirectUris: redirect_uris as string[],
    },
  });

  return Response.json(
    {
      client_id: client.id,
      client_name: client.name,
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
    },
    { status: 201 },
  );
}
