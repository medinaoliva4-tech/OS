/**
 * Seed for Inherent OS.
 *
 * Creates the founding team, the two live brands (NAO and Akai) with their
 * real outstanding work, and the integration rows for the tools the content
 * system actually runs on.
 *
 * Idempotent: every write is an upsert keyed on a natural key, so running it
 * twice does not duplicate anything. Re-run any time with `npm run db:seed`.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/passwords";
import { checkEmailDomain } from "../src/lib/policy";
import { CONTENT_PIPELINE, GUIDELINE_SECTIONS } from "../src/lib/pipeline-blueprint";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "Inherent2026!";

/** Dates relative to "now" so the seeded board never looks stale. */
const DAY = 86_400_000;
const now = new Date();
const day = (offset: number) => new Date(now.getTime() + offset * DAY);

async function seedUsers() {
  const people = [
    {
      email: "rodrigomedina@inherentglobal.com",
      name: "Rodrigo Medina",
      title: "Chief Executive Officer",
      role: "OWNER",
      avatarHue: 258,
    },
    {
      email: "pablorodriguez@inherentglobal.com",
      name: "Pablo Rodriguez",
      title: "Founder & Operations",
      role: "ADMIN",
      avatarHue: 152,
    },
  ];

  const passwordHash = await hashPassword(SEED_PASSWORD);
  const created = [];

  for (const person of people) {
    // The domain rule is enforced at the seed too — there is no back door that
    // creates a user the login policy would reject.
    const check = checkEmailDomain(person.email);
    if (!check.ok) {
      throw new Error(`Refusing to seed ${person.email}: ${check.reason}`);
    }

    const user = await db.user.upsert({
      where: { email: check.email },
      update: {
        name: person.name,
        title: person.title,
        role: person.role,
        avatarHue: person.avatarHue,
        active: true,
      },
      create: {
        email: check.email,
        name: person.name,
        title: person.title,
        role: person.role,
        avatarHue: person.avatarHue,
        passwordHash,
      },
    });
    created.push(user);
    console.log(`  · ${user.name} <${user.email}> — ${user.role}`);
  }

  return { rodrigo: created[0], pablo: created[1] };
}

async function seedIntegrations() {
  const tools = [
    {
      key: "github",
      name: "GitHub",
      category: "SOURCE",
      role: "Source of truth. Every brand's content-system folder lives in a repo, and Claude Code reads it from there.",
      summary: "Brand repos, content-system folders, design handoff context.",
      envKey: "GITHUB_TOKEN",
      docsUrl: "https://github.com/medinaoliva4-tech",
      config: { org: process.env.GITHUB_ORG ?? "medinaoliva4-tech" },
    },
    {
      key: "drive",
      name: "Google Drive",
      category: "SOURCE",
      role: "Where raw shoots land before they are moved into the knowledge store.",
      summary: "Inbound photo and video from shoots and clients.",
      envKey: "GOOGLE_DRIVE_ROOT_FOLDER_ID",
      docsUrl: "https://drive.google.com",
      config: {},
    },
    {
      key: "jockey",
      name: "Jockey",
      category: "KNOWLEDGE",
      role: "The knowledge store. All brand media lives here so generation has real reference material.",
      summary: "Per-brand media library, approved and generated folders.",
      envKey: "JOCKEY_API_KEY",
      config: { folders: ["raw", "generated", "approved", "final"] },
    },
    {
      key: "higgsfield",
      name: "Higgsfield",
      category: "GENERATION",
      role: "Image and video generation, fed by references pulled from Jockey through our own skill.",
      summary: "Generated stills and motion for brand content.",
      envKey: "HIGGSFIELD_API_KEY",
      config: {},
    },
    {
      key: "zapier",
      name: "Zapier",
      category: "AUTOMATION",
      role: "Moves the whole content-system folder into GitHub without anyone remembering to do it.",
      summary: "Content system folder → GitHub repo sync.",
      envKey: "ZAPIER_WEBHOOK_URL",
      config: { direction: "content-system → github" },
    },
    {
      key: "cowork",
      name: "Cowork",
      category: "DELIVERY",
      role: "Where the per-brand calendar lives and where scheduled posts are programmed.",
      summary: "Brand calendars, scheduling and programming.",
      envKey: null,
      config: {},
    },
    {
      key: "figma",
      name: "Figma",
      category: "DESIGN",
      role: "Design surface for the handoff once the repo has full context and final assets.",
      summary: "Design files per brand.",
      envKey: "FIGMA_TOKEN",
      config: {},
    },
    {
      key: "claude-code",
      name: "Claude Code",
      category: "GENERATION",
      role: "Designs and builds from the brand repo with the full content system as context.",
      summary: "Repo-aware design and build.",
      envKey: null,
      config: {},
    },
    {
      key: "slack",
      name: "Slack",
      category: "COMMS",
      role: "Where the OS shouts when something is blocked or late.",
      summary: "Alerts and daily digest.",
      envKey: "SLACK_WEBHOOK_URL",
      config: {},
    },
  ];

  for (const [index, tool] of tools.entries()) {
    // A tool counts as connected when its credential is actually present.
    const hasSecret = tool.envKey ? Boolean(process.env[tool.envKey]) : false;
    const status = hasSecret ? "CONNECTED" : "NEEDS_SETUP";

    await db.integration.upsert({
      where: { key: tool.key },
      update: {
        name: tool.name,
        category: tool.category,
        role: tool.role,
        summary: tool.summary,
        envKey: tool.envKey,
        docsUrl: tool.docsUrl ?? null,
        config: JSON.stringify(tool.config),
        position: index,
      },
      create: {
        key: tool.key,
        name: tool.name,
        category: tool.category,
        role: tool.role,
        summary: tool.summary,
        envKey: tool.envKey,
        docsUrl: tool.docsUrl ?? null,
        config: JSON.stringify(tool.config),
        status,
        position: index,
      },
    });
  }

  console.log(`  · ${tools.length} integrations registered`);
}

type Owner = { id: string };

async function seedBrand(input: {
  name: string;
  slug: string;
  brandHex: string;
  industry: string;
  summary: string;
  mrr: number;
  githubRepo: string;
  owner: Owner;
  status?: string;
}) {
  const account = await db.account.upsert({
    where: { slug: input.slug },
    update: {
      name: input.name,
      brandHex: input.brandHex,
      industry: input.industry,
      summary: input.summary,
      mrr: input.mrr,
      githubRepo: input.githubRepo,
      ownerId: input.owner.id,
    },
    create: {
      name: input.name,
      slug: input.slug,
      kind: "CLIENT",
      status: input.status ?? "ACTIVE",
      tier: "FOUNDING",
      industry: input.industry,
      summary: input.summary,
      brandHex: input.brandHex,
      mrr: input.mrr,
      currency: "USD",
      githubRepo: input.githubRepo,
      githubPath: "/content-system",
      driveFolderUrl: null,
      jockeyWorkspace: input.slug,
      ownerId: input.owner.id,
      startedAt: day(-120),
    },
  });

  // Guideline sections — this is what makes "terminar guidelines" measurable.
  for (const [index, section] of GUIDELINE_SECTIONS.entries()) {
    const existing = await db.guideline.findFirst({
      where: { accountId: account.id, section },
    });
    if (!existing) {
      await db.guideline.create({
        data: {
          accountId: account.id,
          section,
          position: index,
          status: "MISSING",
        },
      });
    }
  }

  // The nine content-system checkpoints.
  for (const [index, step] of CONTENT_PIPELINE.entries()) {
    await db.contentPipelineStep.upsert({
      where: { accountId_key: { accountId: account.id, key: step.key } },
      update: { label: step.label, toolKey: step.toolKey, position: index },
      create: {
        accountId: account.id,
        key: step.key,
        label: step.label,
        toolKey: step.toolKey,
        note: step.note,
        position: index,
        status: "NOT_STARTED",
      },
    });
  }

  return account;
}

/** The PENDIENTES, verbatim in intent, one row each, for both brands. */
const PENDIENTES: {
  title: string;
  description: string;
  pipelineKey: string;
  labels: string;
  priority: string;
  dueInDays: number;
}[] = [
  {
    title: "Terminar guidelines",
    description:
      "Close out every remaining section of the brand guidelines so generation and design have one source of truth.",
    pipelineKey: "guidelines",
    labels: "guidelines,brand",
    priority: "URGENT",
    dueInDays: 3,
  },
  {
    title: "Subir fotos y videos de Drive a Jockey (knowledge store)",
    description:
      "Move all shoot media out of Google Drive and into the Jockey knowledge store so it is available as reference for generation.",
    pipelineKey: "drive_to_jockey",
    labels: "drive,jockey,media",
    priority: "URGENT",
    dueInDays: 4,
  },
  {
    title: "Calendario por marca (en Cowork)",
    description:
      "Build the per-brand publishing calendar in Cowork and agree the cadence.",
    pipelineKey: "brand_calendar",
    labels: "cowork,calendar",
    priority: "HIGH",
    dueInDays: 6,
  },
  {
    title: "Fotos de Higgsfield (de Jockey a Higgsfield con skill creada)",
    description:
      "Push reference stills from Jockey into Higgsfield using the skill we built, and generate the first batch.",
    pipelineKey: "jockey_to_higgsfield",
    labels: "higgsfield,jockey,generation",
    priority: "HIGH",
    dueInDays: 8,
  },
  {
    title: "Subir a folder de aprobadas / generadas — Jockey",
    description:
      "File generated output into the approved and generated folders in Jockey so the state of each asset is unambiguous.",
    pipelineKey: "approved_folder",
    labels: "jockey,assets",
    priority: "MEDIUM",
    dueInDays: 9,
  },
  {
    title: "Subir guidelines al folder (con VS Code)",
    description:
      "Commit the finished guidelines into the brand's content-system folder from VS Code.",
    pipelineKey: "guidelines",
    labels: "guidelines,github",
    priority: "HIGH",
    dueInDays: 5,
  },
  {
    title: "Assets finales",
    description:
      "Lock the final cut of every asset and mark it FINAL in the asset library.",
    pipelineKey: "assets_final",
    labels: "assets,delivery",
    priority: "MEDIUM",
    dueInDays: 11,
  },
  {
    title: "Zapier sube todo el content system folder a GitHub",
    description:
      "Wire the Zap so the entire content-system folder lands in the brand's GitHub repo automatically.",
    pipelineKey: "zapier_to_github",
    labels: "zapier,github,automation",
    priority: "HIGH",
    dueInDays: 10,
  },
  {
    title: "GitHub repo → Claude Code diseña con todo el contexto y assets",
    description:
      "With the repo carrying full brand context and final assets, run the design pass in Claude Code.",
    pipelineKey: "design_handoff",
    labels: "claude-code,design,github",
    priority: "MEDIUM",
    dueInDays: 14,
  },
  {
    title: "Calendarizar — programar",
    description:
      "Schedule and programme the approved content against the brand calendar.",
    pipelineKey: "scheduled",
    labels: "cowork,calendar,scheduling",
    priority: "MEDIUM",
    dueInDays: 16,
  },
];

async function seedPendientes(
  accountId: string,
  assigneeId: string,
  createdById: string,
) {
  for (const [index, item] of PENDIENTES.entries()) {
    const existing = await db.task.findFirst({
      where: { accountId, title: item.title },
    });
    if (existing) continue;

    await db.task.create({
      data: {
        accountId,
        title: item.title,
        description: item.description,
        status: "TODO",
        priority: item.priority,
        labels: item.labels,
        pipelineKey: item.pipelineKey,
        dueDate: day(item.dueInDays),
        position: index,
        assigneeId,
        createdById,
      },
    });
  }
}

async function main() {
  console.log("\nSeeding Inherent OS\n");

  console.log("Team");
  const { rodrigo, pablo } = await seedUsers();

  console.log("\nIntegrations");
  await seedIntegrations();

  console.log("\nBrands");
  const nao = await seedBrand({
    name: "NAO",
    slug: "nao",
    brandHex: "#5EEAD4",
    industry: "Lifestyle",
    summary:
      "Founding brand. Full content system: guidelines, generation, calendar and scheduled publishing.",
    mrr: 6500,
    githubRepo: "medinaoliva4-tech/nao",
    owner: pablo,
  });
  console.log(`  · ${nao.name} — ${nao.githubRepo}`);

  const akai = await seedBrand({
    name: "Akai",
    slug: "akai",
    brandHex: "#F59E0B",
    industry: "Food & beverage",
    summary:
      "Founding brand. Same content system, running one cycle behind NAO.",
    mrr: 5200,
    githubRepo: "medinaoliva4-tech/akai",
    owner: rodrigo,
  });
  console.log(`  · ${akai.name} — ${akai.githubRepo}`);

  console.log("\nPendientes");
  await seedPendientes(nao.id, pablo.id, rodrigo.id);
  await seedPendientes(akai.id, rodrigo.id, rodrigo.id);
  const taskCount = await db.task.count();
  console.log(`  · ${taskCount} tasks on the board`);

  // ------------------------------------------------------------------
  // Reflect real progress: NAO is genuinely further along than Akai.
  // ------------------------------------------------------------------
  await db.contentPipelineStep.updateMany({
    where: { accountId: nao.id, key: { in: ["drive_to_jockey"] } },
    data: { status: "IN_PROGRESS" },
  });
  await db.contentPipelineStep.updateMany({
    where: { accountId: nao.id, key: "guidelines" },
    data: { status: "IN_PROGRESS" },
  });
  await db.contentPipelineStep.updateMany({
    where: { accountId: akai.id, key: "guidelines" },
    data: { status: "IN_PROGRESS" },
  });

  await db.task.updateMany({
    where: { accountId: nao.id, pipelineKey: "drive_to_jockey" },
    data: { status: "IN_PROGRESS" },
  });
  await db.task.updateMany({
    where: { accountId: nao.id, title: "Terminar guidelines" },
    data: { status: "IN_PROGRESS" },
  });
  await db.task.updateMany({
    where: { accountId: akai.id, title: "Terminar guidelines" },
    data: { status: "IN_PROGRESS" },
  });

  // NAO guidelines: five of eight sections are actually done.
  const naoGuidelines = await db.guideline.findMany({
    where: { accountId: nao.id },
    orderBy: { position: "asc" },
  });
  for (const [index, guideline] of naoGuidelines.entries()) {
    const status = index < 5 ? "DONE" : index < 6 ? "REVIEW" : "DRAFT";
    await db.guideline.update({ where: { id: guideline.id }, data: { status } });
  }

  const akaiGuidelines = await db.guideline.findMany({
    where: { accountId: akai.id },
    orderBy: { position: "asc" },
  });
  for (const [index, guideline] of akaiGuidelines.entries()) {
    const status = index < 3 ? "DONE" : index < 4 ? "DRAFT" : "MISSING";
    await db.guideline.update({ where: { id: guideline.id }, data: { status } });
  }

  // ------------------------------------------------------------------
  // Contacts, deals, content and assets — enough that every screen has
  // something honest to show on first login.
  // ------------------------------------------------------------------
  console.log("\nCRM");
  const contacts = [
    { accountId: nao.id, name: "Valentina Ruiz", title: "Brand Director", email: "valentina@nao.example", isPrimary: true },
    { accountId: nao.id, name: "Diego Salas", title: "Marketing Lead", email: "diego@nao.example", isPrimary: false },
    { accountId: akai.id, name: "Mariana Ito", title: "Founder", email: "mariana@akai.example", isPrimary: true },
    { accountId: akai.id, name: "Luis Cabrera", title: "Ops Manager", email: "luis@akai.example", isPrimary: false },
  ];
  for (const contact of contacts) {
    const existing = await db.contact.findFirst({
      where: { accountId: contact.accountId, name: contact.name },
    });
    if (!existing) await db.contact.create({ data: contact });
  }

  const deals = [
    {
      accountId: nao.id,
      title: "NAO — Q4 content retainer renewal",
      stage: "NEGOTIATION",
      value: 78_000,
      probability: 70,
      source: "EXISTING",
      ownerId: pablo.id,
      expectedCloseDate: day(21),
    },
    {
      accountId: akai.id,
      title: "Akai — brand system + launch campaign",
      stage: "PROPOSAL",
      value: 45_000,
      probability: 50,
      source: "REFERRAL",
      ownerId: rodrigo.id,
      expectedCloseDate: day(34),
    },
    {
      accountId: nao.id,
      title: "NAO — motion package add-on",
      stage: "QUALIFIED",
      value: 18_000,
      probability: 35,
      source: "EXISTING",
      ownerId: pablo.id,
      expectedCloseDate: day(48),
    },
  ];
  for (const deal of deals) {
    const existing = await db.deal.findFirst({ where: { title: deal.title } });
    if (!existing) await db.deal.create({ data: deal });
  }
  console.log(`  · ${await db.contact.count()} contacts, ${await db.deal.count()} deals`);

  console.log("\nContent");
  const contentPlan = [
    { account: nao, title: "Morning ritual — hero reel", format: "REEL", channel: "INSTAGRAM", stage: "APPROVED", offset: 2, origin: "HIGGSFIELD" },
    { account: nao, title: "Texture study carousel", format: "CAROUSEL", channel: "INSTAGRAM", stage: "SCHEDULED", offset: 4, origin: "JOCKEY" },
    { account: nao, title: "Founder POV — why NAO", format: "VIDEO", channel: "TIKTOK", stage: "REVIEW", offset: 6, origin: "SHOT" },
    { account: nao, title: "Product still set — autumn", format: "STILL", channel: "INSTAGRAM", stage: "GENERATING", offset: 9, origin: "HIGGSFIELD" },
    { account: nao, title: "Behind the shoot", format: "STORY", channel: "INSTAGRAM", stage: "BRIEF", offset: 12, origin: null },
    { account: akai, title: "Akai launch teaser", format: "REEL", channel: "TIKTOK", stage: "GENERATING", offset: 3, origin: "HIGGSFIELD" },
    { account: akai, title: "Ingredient origin story", format: "CAROUSEL", channel: "INSTAGRAM", stage: "BRIEF", offset: 7, origin: null },
    { account: akai, title: "UGC — first taste", format: "UGC", channel: "TIKTOK", stage: "IDEA", offset: 10, origin: null },
    { account: akai, title: "Menu drop announcement", format: "POST", channel: "INSTAGRAM", stage: "IDEA", offset: 15, origin: null },
    { account: nao, title: "Community repost — week 1", format: "POST", channel: "INSTAGRAM", stage: "PUBLISHED", offset: -5, origin: "JOCKEY" },
    { account: akai, title: "Soft-open recap", format: "REEL", channel: "INSTAGRAM", stage: "PUBLISHED", offset: -8, origin: "SHOT" },
  ];

  for (const item of contentPlan) {
    const existing = await db.contentItem.findFirst({
      where: { accountId: item.account.id, title: item.title },
    });
    if (existing) continue;

    await db.contentItem.create({
      data: {
        accountId: item.account.id,
        title: item.title,
        format: item.format,
        channel: item.channel,
        stage: item.stage,
        origin: item.origin,
        scheduledFor: day(item.offset),
        publishedAt: item.stage === "PUBLISHED" ? day(item.offset) : null,
        ownerId: item.account.id === nao.id ? pablo.id : rodrigo.id,
      },
    });
  }
  console.log(`  · ${await db.contentItem.count()} content items planned`);

  console.log("\nAssets");
  const assets = [
    { account: nao, name: "Shoot 01 — raw stills", kind: "IMAGE", stage: "RAW", source: "DRIVE", path: "/raw/shoot-01" },
    { account: nao, name: "Shoot 01 — selects", kind: "IMAGE", stage: "APPROVED", source: "JOCKEY", path: "/approved/shoot-01" },
    { account: nao, name: "Hero reel v3", kind: "VIDEO", stage: "FINAL", source: "JOCKEY", path: "/final/hero-reel-v3.mp4" },
    { account: nao, name: "Higgsfield batch — autumn stills", kind: "IMAGE", stage: "GENERATED", source: "HIGGSFIELD", path: "/generated/autumn" },
    { account: nao, name: "NAO guidelines v0.8", kind: "GUIDELINE", stage: "APPROVED", source: "GITHUB", path: "/content-system/guidelines.md" },
    { account: akai, name: "Akai launch footage", kind: "VIDEO", stage: "RAW", source: "DRIVE", path: "/raw/launch" },
    { account: akai, name: "Akai palette exploration", kind: "IMAGE", stage: "GENERATED", source: "HIGGSFIELD", path: "/generated/palette" },
    { account: akai, name: "Akai guidelines v0.4", kind: "GUIDELINE", stage: "RAW", source: "GITHUB", path: "/content-system/guidelines.md" },
  ];
  for (const asset of assets) {
    const existing = await db.asset.findFirst({
      where: { accountId: asset.account.id, name: asset.name },
    });
    if (existing) continue;
    await db.asset.create({
      data: {
        accountId: asset.account.id,
        name: asset.name,
        kind: asset.kind,
        stage: asset.stage,
        source: asset.source,
        path: asset.path,
      },
    });
  }
  console.log(`  · ${await db.asset.count()} assets tracked`);

  console.log(`\nDone.\n`);
  console.log(`  Sign in at /login`);
  console.log(`  rodrigomedina@inherentglobal.com  ·  ${SEED_PASSWORD}`);
  console.log(`  pablorodriguez@inherentglobal.com ·  ${SEED_PASSWORD}`);
  console.log(`\n  Change both passwords after the first sign-in.\n`);
}

main()
  .catch((error) => {
    console.error("\nSeed failed:\n", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
