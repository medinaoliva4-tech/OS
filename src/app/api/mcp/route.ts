/**
 * Inherent OS — remote MCP endpoint (Streamable HTTP transport).
 *
 * Lets cloud-hosted MCP clients — the Claude.ai custom connector and the
 * ChatGPT MCP custom connector — reach the same tools as the local stdio
 * server (mcp/server.ts, mcp/tools.ts), since neither of those clients can
 * spawn a subprocess: they need a URL.
 *
 * Auth: a bearer token, checked against ApiToken — minted either by hand
 * from Settings → API tokens, or by the OAuth flow at src/app/oauth/* (which
 * both Claude.ai and ChatGPT require for their custom-connector UI — neither
 * offers a plain API-key field, so a real OAuth 2.1 + PKCE authorization
 * server is mandatory, not optional, for those two). MCP_CONNECTOR_TOKEN is
 * a single fallback shared secret for anyone who hasn't set one up. The
 * token travels as `Authorization: Bearer <token>` or, for clients that
 * can't set custom headers, a `?token=<token>` query param.
 *
 * Unauthenticated requests get a real 401 with a WWW-Authenticate header
 * pointing at the protected-resource metadata (RFC 9728), which points at
 * the authorization server metadata (RFC 8414) — that chain is what lets
 * Claude.ai/ChatGPT discover /oauth/register, /oauth/authorize, /oauth/token
 * on their own instead of asking the user for an OAuth client ID by hand.
 *
 * Whoever holds a valid token gets the same read/write access to
 * Account/Contact/Deal/... this whole surface grants for every user, not
 * just its owner — the tools aren't scoped per-account. A token only
 * identifies "some authorized person is calling," the same as
 * MCP_CONNECTOR_TOKEN did before per-user tokens existed.
 *
 * Stateless: a fresh McpServer + transport per request. Serverless functions
 * don't share memory across invocations, so there's no session to keep warm
 * anyway — every request already carries the full JSON-RPC message.
 */

import "server-only";
import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { hashApiToken } from "@/lib/api-tokens";
import { originFromHost } from "@/lib/oauth";
import { registerTools } from "../../../../mcp/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

function matchesSharedSecret(candidate: string | null): boolean {
  const expected = process.env.MCP_CONNECTOR_TOKEN;
  if (!expected || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function extractToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const [scheme, headerToken] = header.split(" ");
  if (scheme === "Bearer" && headerToken) return headerToken;
  return new URL(req.url).searchParams.get("token");
}

async function isAuthorized(req: Request): Promise<boolean> {
  const token = extractToken(req);
  if (!token) return false;

  if (matchesSharedSecret(token)) return true;

  const record = await db.apiToken.findUnique({ where: { tokenHash: hashApiToken(token) } });
  if (!record || record.revokedAt) return false;

  // Fire-and-forget: a slow/failed write here shouldn't hold up the request.
  db.apiToken
    .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
    .catch((error) => console.error("[mcp] failed to record token use", error));

  return true;
}

async function unauthorized() {
  const origin = originFromHost((await headers()).get("host"));
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized" },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "content-type": "application/json",
        "www-authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
      },
    },
  );
}

function buildServer() {
  const server = new McpServer({ name: "inherent-os", version: "1.0.0" });
  registerTools(server, db);
  return server;
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) return await unauthorized();

  const server = buildServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  const response = await transport.handleRequest(req);
  return response;
}

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) return await unauthorized();
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }),
    { status: 405, headers: { "content-type": "application/json" } },
  );
}

export async function DELETE(req: Request) {
  if (!(await isAuthorized(req))) return await unauthorized();
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }),
    { status: 405, headers: { "content-type": "application/json" } },
  );
}
