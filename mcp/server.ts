#!/usr/bin/env node
/**
 * Inherent OS — local MCP server.
 *
 * Gives an agent (Claude Code, Codex, any MCP client) direct read/write
 * access to the CRM/OS data — accounts, deals, tasks, content, guidelines —
 * so the seeded placeholder rows can be edited into real data without
 * hand-writing SQL or going through the UI.
 *
 * Deliberately excludes User and Session: an agent should never be able to
 * touch passwordHash, role, or session tokens through this surface.
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
import { z } from "zod";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// The editable surface. Business data only — no User, no Session.
// ---------------------------------------------------------------------------

const MODELS = {
  Account: db.account,
  Contact: db.contact,
  Deal: db.deal,
  Project: db.project,
  Task: db.task,
  ContentItem: db.contentItem,
  Asset: db.asset,
  Guideline: db.guideline,
  ContentPipelineStep: db.contentPipelineStep,
  Integration: db.integration,
  Note: db.note,
  Activity: db.activity,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as const satisfies Record<string, any>;

type ModelName = keyof typeof MODELS;
const MODEL_NAMES = Object.keys(MODELS) as [ModelName, ...ModelName[]];

/** Short field reference so an agent can guess a shape without reading schema.prisma. */
const MODEL_FIELDS: Record<ModelName, string> = {
  Account:
    "id, name, slug*, kind(CLIENT|PROSPECT|PARTNER|INTERNAL), status(ACTIVE|ONBOARDING|PAUSED|CHURNED), tier(FOUNDING|GROWTH|ENTERPRISE), industry, website, summary, brandHex, logoUrl, mrr(int), currency, githubRepo, githubPath, driveFolderUrl, jockeyWorkspace, figmaFileUrl, notionUrl, ownerId(User.id), startedAt",
  Contact:
    "id, name, email, phone, title, isPrimary(bool), linkedin, notes, accountId*(Account.id)",
  Deal:
    "id, title, stage(LEAD|QUALIFIED|PROPOSAL|NEGOTIATION|WON|LOST), value(int), currency, probability(0-100), source(REFERRAL|INBOUND|OUTBOUND|NETWORK|EXISTING), expectedCloseDate, closedAt, lostReason, notes, accountId*(Account.id), ownerId(User.id)",
  Project:
    "id, name, summary, status(PLANNING|ACTIVE|BLOCKED|DONE), startDate, dueDate, accountId*(Account.id), ownerId(User.id)",
  Task:
    "id, title, description, status(BACKLOG|TODO|IN_PROGRESS|BLOCKED|REVIEW|DONE), priority(LOW|MEDIUM|HIGH|URGENT), dueDate, completedAt, labels(comma-separated), pipelineKey, position(int), accountId(Account.id), projectId(Project.id), assigneeId(User.id), createdById(User.id)",
  ContentItem:
    "id, title, caption, format(REEL|POST|CAROUSEL|STORY|VIDEO|UGC|STILL), channel(INSTAGRAM|TIKTOK|YOUTUBE|LINKEDIN|WEB|EMAIL), stage(IDEA|BRIEF|GENERATING|REVIEW|APPROVED|SCHEDULED|PUBLISHED), scheduledFor, publishedAt, origin(JOCKEY|HIGGSFIELD|SHOT|EXTERNAL), hook, accountId*(Account.id), ownerId(User.id)",
  Asset:
    "id, name, kind(IMAGE|VIDEO|DOC|GUIDELINE|AUDIO|OTHER), stage(RAW|GENERATED|APPROVED|FINAL|ARCHIVED), source(DRIVE|JOCKEY|HIGGSFIELD|GITHUB|FIGMA|LOCAL), url, path, mimeType, sizeBytes, notes, accountId*(Account.id), contentItemId(ContentItem.id)",
  Guideline:
    "id, section, status(MISSING|DRAFT|REVIEW|DONE), content, sourceUrl, position(int), accountId*(Account.id)",
  ContentPipelineStep:
    "id, key, label, status(NOT_STARTED|IN_PROGRESS|BLOCKED|DONE), position(int), toolKey, note, updatedBy, accountId*(Account.id)",
  Integration:
    "id, key*, name, category(SOURCE|KNOWLEDGE|GENERATION|AUTOMATION|DELIVERY|COMMS|DESIGN), status(CONNECTED|NEEDS_SETUP|DEGRADED|ERROR|DISABLED), summary, role, docsUrl, envKey, config(JSON string), lastSyncAt, lastError, position(int)",
  Note: "id, body, entityType, entityId, authorId(User.id), accountId(Account.id)",
  Activity:
    "id, verb, entityType, entityId, summary, meta(JSON string), actorId(User.id) — read-mostly, the feed every mutation writes to",
};

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "inherent-os",
  version: "1.0.0",
});

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

server.registerTool(
  "list_models",
  {
    title: "List editable models",
    description:
      "Lists every model this server can read and write, with a short field reference for each. Fields marked with * are required on create.",
  },
  async () => textResult(MODEL_FIELDS),
);

server.registerTool(
  "list_records",
  {
    title: "List records",
    description:
      "Lists rows for one model, optionally filtered. `where` and `orderBy` are passed straight through to Prisma (e.g. where: {status: \"ACTIVE\"}, orderBy: {createdAt: \"desc\"}).",
    inputSchema: {
      model: z.enum(MODEL_NAMES),
      where: z.record(z.string(), z.unknown()).optional(),
      orderBy: z.record(z.string(), z.unknown()).optional(),
      take: z.number().int().min(1).max(200).default(50),
    },
  },
  async ({ model, where, orderBy, take }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = await (MODELS[model] as any).findMany({ where, orderBy, take });
      return textResult(rows);
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "get_record",
  {
    title: "Get one record",
    description: "Fetches a single row of a model by its id.",
    inputSchema: { model: z.enum(MODEL_NAMES), id: z.string() },
  },
  async ({ model, id }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = await (MODELS[model] as any).findUnique({ where: { id } });
      if (!row) return errorResult(`No ${model} with id "${id}".`);
      return textResult(row);
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "create_record",
  {
    title: "Create a record",
    description:
      "Creates one row of a model. Call list_models first if unsure of the fields — required ones are marked *.",
    inputSchema: {
      model: z.enum(MODEL_NAMES),
      data: z.record(z.string(), z.unknown()),
    },
  },
  async ({ model, data }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = await (MODELS[model] as any).create({ data });
      return textResult(row);
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "update_record",
  {
    title: "Update a record",
    description: "Updates one or more fields on a single row of a model, by id.",
    inputSchema: {
      model: z.enum(MODEL_NAMES),
      id: z.string(),
      data: z.record(z.string(), z.unknown()),
    },
  },
  async ({ model, id, data }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = await (MODELS[model] as any).update({ where: { id }, data });
      return textResult(row);
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "delete_record",
  {
    title: "Delete a record",
    description:
      "Deletes one row of a model by id. Deleting an Account cascades to everything hanging off it (contacts, deals, content, assets, guidelines, pipeline steps) — use with care.",
    inputSchema: { model: z.enum(MODEL_NAMES), id: z.string() },
  },
  async ({ model, id }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = await (MODELS[model] as any).delete({ where: { id } });
      return textResult(row);
    } catch (error) {
      return errorResult(error);
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Inherent OS MCP server failed to start:", error);
  process.exit(1);
});
