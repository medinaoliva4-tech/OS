/**
 * Inherent OS — remote MCP endpoint (Streamable HTTP transport).
 *
 * Lets cloud-hosted MCP clients — the Claude.ai custom connector and the
 * ChatGPT MCP custom connector — reach the same tools as the local stdio
 * server (mcp/server.ts, mcp/tools.ts), since neither of those clients can
 * spawn a subprocess: they need a URL.
 *
 * Auth: per-user personal access tokens (ApiToken, minted from Settings →
 * API tokens), plus MCP_CONNECTOR_TOKEN as a single fallback shared secret
 * for anyone who hasn't set one up. Either travels as
 * `Authorization: Bearer <token>` or as a `?token=<token>` query param.
 *
 * The query param exists because Claude.ai's and ChatGPT's custom-connector
 * setup treat a 401 response with `WWW-Authenticate: Bearer` as "this server
 * speaks OAuth" and prompt for an OAuth client ID/secret we don't have — this
 * isn't an OAuth server, just bearer secrets. So unauthenticated requests get
 * a plain 403 (no WWW-Authenticate header), and the token travels in the
 * connector URL instead: https://<host>/api/mcp?token=<token>.
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
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { hashApiToken } from "@/lib/api-tokens";
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

function unauthorized() {
  // Deliberately no WWW-Authenticate header: it makes Claude.ai/ChatGPT's
  // connector setup try to negotiate OAuth, which this server doesn't speak.
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized" },
      id: null,
    }),
    { status: 403, headers: { "content-type": "application/json" } },
  );
}

function buildServer() {
  const server = new McpServer({ name: "inherent-os", version: "1.0.0" });
  registerTools(server, db);
  return server;
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) return unauthorized();

  const server = buildServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  const response = await transport.handleRequest(req);
  return response;
}

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) return unauthorized();
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }),
    { status: 405, headers: { "content-type": "application/json" } },
  );
}

export async function DELETE(req: Request) {
  if (!(await isAuthorized(req))) return unauthorized();
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }),
    { status: 405, headers: { "content-type": "application/json" } },
  );
}
