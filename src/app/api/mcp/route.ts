/**
 * Inherent OS — remote MCP endpoint (Streamable HTTP transport).
 *
 * Lets cloud-hosted MCP clients — the Claude.ai custom connector and the
 * ChatGPT MCP custom connector — reach the same tools as the local stdio
 * server (mcp/server.ts, mcp/tools.ts), since neither of those clients can
 * spawn a subprocess: they need a URL.
 *
 * Auth: a single static token (MCP_CONNECTOR_TOKEN), accepted either as
 * `Authorization: Bearer <token>` or as a `?token=<token>` query param.
 *
 * The query param exists because Claude.ai's and ChatGPT's custom-connector
 * setup treat a 401 response with `WWW-Authenticate: Bearer` as "this server
 * speaks OAuth" and prompt for an OAuth client ID/secret we don't have — this
 * isn't an OAuth server, just a shared secret. So unauthenticated requests
 * get a plain 403 (no WWW-Authenticate header), and the token travels in the
 * connector URL instead: https://<host>/api/mcp?token=<token>.
 *
 * Anyone with the token gets the same read/write access to
 * Account/Contact/Deal/... this whole surface grants — generate it with
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * and keep it out of source control (Vercel env var only).
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
import { registerTools } from "../../../../mcp/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

function matches(candidate: string | null, expected: string): boolean {
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isAuthorized(req: Request): boolean {
  const expected = process.env.MCP_CONNECTOR_TOKEN;
  if (!expected) return false;

  const header = req.headers.get("authorization") ?? "";
  const [scheme, headerToken] = header.split(" ");
  if (scheme === "Bearer" && matches(headerToken, expected)) return true;

  const queryToken = new URL(req.url).searchParams.get("token");
  return matches(queryToken, expected);
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
  if (!isAuthorized(req)) return unauthorized();

  const server = buildServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  const response = await transport.handleRequest(req);
  return response;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }),
    { status: 405, headers: { "content-type": "application/json" } },
  );
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }),
    { status: 405, headers: { "content-type": "application/json" } },
  );
}
