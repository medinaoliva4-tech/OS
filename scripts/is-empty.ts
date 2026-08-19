/**
 * Tells the container entrypoint whether the database still needs seeding.
 *
 *   exit 0  — no users yet, seed it
 *   exit 1  — users exist, leave it alone
 *   exit 2  — could not tell (connection refused, bad credentials, …)
 *
 * The third case matters. An earlier version collapsed errors into "has data",
 * which meant a fresh deploy whose check crashed would silently skip seeding
 * and come up with no accounts at all. Failing loudly is the safe default.
 *
 * Checking for rows rather than for a file keeps the answer correct on
 * Postgres, where "has this been set up?" is not a filesystem question.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main(): Promise<number> {
  try {
    const users = await db.user.count();
    console.log(
      users === 0
        ? "Database has no accounts — needs seeding."
        : `Database already has ${users} account(s) — skipping the seed.`,
    );
    return users === 0 ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // A missing table means migrations just created an empty schema, which is
    // a legitimate "needs seeding". Anything else is a genuine failure.
    if (/does not exist|P2021|relation .* does not exist/i.test(message)) {
      console.log("No tables yet — needs seeding.");
      return 0;
    }

    console.error("Could not determine whether the database is empty:");
    console.error(message);
    return 2;
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 2;
  })
  .finally(() => db.$disconnect());
