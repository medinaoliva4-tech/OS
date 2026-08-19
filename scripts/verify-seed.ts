/**
 * Post-seed invariants, run in CI.
 *
 * Two things must always hold after seeding, and both are easy to break by
 * accident:
 *   1. The seed is idempotent — running it twice must not duplicate anything.
 *   2. Every account is on the company domain. This is the product's core
 *      access rule, so it is asserted against the data, not just the code.
 *
 * Run against an already-seeded database:  npx tsx scripts/verify-seed.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { ALLOWED_EMAIL_DOMAIN } from "../src/lib/policy";

const EXPECTED = { users: 2, accounts: 2, tasks: 20, integrations: 9 };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });
const failures: string[] = [];

function expect(label: string, actual: number, wanted: number) {
  if (actual === wanted) {
    console.log(`  ok    ${label}: ${actual}`);
  } else {
    console.log(`  FAIL  ${label}: ${actual} (expected ${wanted})`);
    failures.push(`${label} was ${actual}, expected ${wanted}`);
  }
}

async function main() {
  console.log("\nSeed invariants\n");

  const [users, accounts, tasks, integrations] = await Promise.all([
    db.user.count(),
    db.account.count(),
    db.task.count(),
    db.integration.count(),
  ]);

  expect("users", users, EXPECTED.users);
  expect("brands", accounts, EXPECTED.accounts);
  expect("tasks", tasks, EXPECTED.tasks);
  expect("integrations", integrations, EXPECTED.integrations);

  // The access rule, asserted against real rows.
  const everyone = await db.user.findMany({ select: { email: true } });
  const offDomain = everyone.filter(
    (u) => !u.email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`),
  );
  if (offDomain.length > 0) {
    console.log(`  FAIL  off-domain accounts: ${offDomain.map((u) => u.email).join(", ")}`);
    failures.push("an account exists outside the allowed domain");
  } else {
    console.log(`  ok    every account is @${ALLOWED_EMAIL_DOMAIN}`);
  }

  // The founding team must actually be there, by address.
  for (const email of [
    "rodrigomedina@inherentglobal.com",
    "pablorodriguez@inherentglobal.com",
  ]) {
    const found = await db.user.findUnique({ where: { email } });
    if (found) {
      console.log(`  ok    ${found.name} <${email}> — ${found.role}`);
    } else {
      console.log(`  FAIL  missing account: ${email}`);
      failures.push(`missing ${email}`);
    }
  }

  // Every brand carries the full content-system chain.
  const brands = await db.account.findMany({
    include: { _count: { select: { pipelineSteps: true, guidelines: true } } },
  });
  for (const brand of brands) {
    const steps = brand._count.pipelineSteps;
    const sections = brand._count.guidelines;
    if (steps === 9 && sections === 8) {
      console.log(`  ok    ${brand.name}: 9 checkpoints, 8 guideline sections`);
    } else {
      console.log(`  FAIL  ${brand.name}: ${steps} checkpoints, ${sections} sections`);
      failures.push(`${brand.name} is missing part of its content system`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} invariant(s) broken:`);
    failures.forEach((f) => console.error(`  · ${f}`));
    process.exitCode = 1;
  } else {
    console.log("\nAll invariants hold.\n");
  }
}

main()
  .catch((error) => {
    console.error("\nverify-seed failed:\n", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
