#!/usr/bin/env node
/**
 * Inherent OS — local MCP server (stdio transport).
 *
 * Gives an agent running on this machine (Claude Code, Codex) direct
 * read/write access to the CRM/OS data — accounts, deals, tasks, content,
 * guidelines — so the seeded placeholder rows can be edited into real data
 * without hand-writing SQL or going through the UI.
 *
 * Tool definitions live in mcp/tools.ts, shared with the HTTP transport at
 * src/app/api/mcp/route.ts (for the Claude.ai and ChatGPT custom connectors,
 * which run in the cloud and need a URL instead of a subprocess).
 *
 * Runs over stdio, the same way the Supabase MCP server was wired up for
 * this project — no network exposure, no separate auth: it inherits
 * whatever DATABASE_URL the shell (or a `.env` file) already has.
 *
 *   npx tsx mcp/server.ts
 *   claude mcp add --scope project inherent-os -- npx tsx mcp/server.ts
 */

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { registerTools } from "./tools";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const server = new McpServer({
  name: "inherent-os",
  version: "1.0.0",
});

registerTools(server, db);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Inherent OS MCP server failed to start:", error);
  process.exit(1);
});
