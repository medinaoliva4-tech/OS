import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate, studio, db pull/push) always runs migrations and
// introspection over the direct connection — transaction-mode pooling
// (Supavisor) cannot hold the advisory lock or run DDL. Falling back to
// DATABASE_URL keeps `prisma migrate dev` working against a plain local
// Postgres that has no separate pooled/direct split.
//
// Read straight from process.env rather than the config package's `env()`
// helper: that helper throws when a variable is unset, which would break
// `prisma generate` (run from `postinstall`, before `.env` exists) on a
// fresh clone. Only commands that actually open a connection need this to
// resolve to a real value.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
