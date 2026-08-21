import "server-only";
import { db } from "@/lib/db";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/policy";

/**
 * Why the OS cannot talk to its database — and what to do about it.
 *
 * On a first deploy the two things that actually go wrong are a missing
 * connection string and a schema that was never migrated. Both surface as an
 * unhelpful 500 unless something names them, so this classifies the failure
 * into an answer someone can act on.
 */
export type DbStatus =
  | { ok: true; users: number }
  | {
      ok: false;
      kind: "NO_URL" | "UNREACHABLE" | "NOT_MIGRATED" | "UNKNOWN";
      title: string;
      detail: string;
      fix: string[];
    };

/** Prisma errors can carry the host; never echo the connection string back. */
function scrub(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "postgresql://<redacted>")
    .slice(0, 400);
}

export async function checkDatabase(): Promise<DbStatus> {
  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      kind: "NO_URL",
      title: "No database is configured",
      detail: "DATABASE_URL is not set in this environment.",
      fix: [
        "Add DATABASE_URL — the Supabase pooled string, port 6543, with ?pgbouncer=true&connection_limit=1",
        "Add DIRECT_URL — the direct string, port 5432, used only by migrations",
        "Redeploy so the new environment variables are picked up",
      ],
    };
  }

  try {
    const users = await db.user.count();
    return { ok: true, users };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";

    // P2021 / "does not exist": connected fine, but nothing has been migrated.
    if (code === "P2021" || /does not exist|relation .* does not exist/i.test(message)) {
      return {
        ok: false,
        kind: "NOT_MIGRATED",
        title: "The database is empty",
        detail:
          "The connection works, but the tables have not been created yet.",
        fix: [
          "Run migrations once, using the DIRECT connection string (port 5432):",
          "DATABASE_URL=\"<direct>\" DIRECT_URL=\"<direct>\" npx prisma migrate deploy",
          "DATABASE_URL=\"<direct>\" DIRECT_URL=\"<direct>\" npx tsx prisma/seed.ts",
          "The Vercel build runs `prisma migrate deploy`, so check DIRECT_URL is set in the Vercel project — a failed migration there leaves the schema half-made.",
        ],
      };
    }

    // P1001 / P1000: wrong host, wrong password, or the project is paused.
    if (code === "P1001" || code === "P1000" || /can't reach|ECONNREFUSED|ETIMEDOUT|authentication failed/i.test(message)) {
      return {
        ok: false,
        kind: "UNREACHABLE",
        title: "Cannot reach the database",
        detail: scrub(message),
        fix: [
          "Check DATABASE_URL is the POOLED Supabase string (port 6543), not the direct one",
          "Confirm the password in the string is current",
          "Check the Supabase project is not paused",
        ],
      };
    }

    return {
      ok: false,
      kind: "UNKNOWN",
      title: "The database returned an error",
      detail: scrub(message),
      fix: ["Check the Supabase logs and the deployment's runtime logs"],
    };
  }
}

/** Non-secret environment facts, safe to show on a setup screen. */
export function environmentSummary() {
  return {
    databaseUrl: Boolean(process.env.DATABASE_URL),
    directUrl: Boolean(process.env.DIRECT_URL),
    authSecret:
      Boolean(process.env.AUTH_SECRET) &&
      !process.env.AUTH_SECRET!.startsWith("dev-only-secret"),
    allowedDomain: ALLOWED_EMAIL_DOMAIN,
  };
}
