/**
 * Fails the build if a route that reads live state got prerendered.
 *
 * This guards a bug that already happened once: the setup check on /login
 * returns before any dynamic API is touched, so Next saw a static route and
 * baked the BUILD-time database state into permanent HTML. A Vercel build has
 * no database access by design, so that shipped a frozen "cannot reach the
 * database" page which never recovered — even once Supabase was healthy.
 *
 * Reads the build manifest rather than scraping log output.
 */

import { readFileSync } from "node:fs";

/** Routes whose output must never be cached at build time. */
const MUST_BE_DYNAMIC = [
  "/login",
  "/",
  "/accounts",
  "/tasks",
  "/connections",
  "/team",
  "/settings",
  "/api/health",
];

type PrerenderManifest = {
  routes?: Record<string, unknown>;
  dynamicRoutes?: Record<string, unknown>;
};

let manifest: PrerenderManifest;
try {
  manifest = JSON.parse(
    readFileSync(".next/prerender-manifest.json", "utf8"),
  ) as PrerenderManifest;
} catch {
  console.error("No .next/prerender-manifest.json — run the build first.");
  process.exit(1);
}

// Anything listed in `routes` was rendered to static output at build time.
const prerendered = new Set(Object.keys(manifest.routes ?? {}));

const offenders = MUST_BE_DYNAMIC.filter((route) => prerendered.has(route));

if (offenders.length > 0) {
  console.error("\nThese routes were prerendered but must be dynamic:\n");
  offenders.forEach((route) => console.error(`  ✗ ${route}`));
  console.error(
    "\nAdd `export const dynamic = \"force-dynamic\"` to each, or make sure a\n" +
      "dynamic API is reached before any early return.\n",
  );
  process.exit(1);
}

console.log(
  `All ${MUST_BE_DYNAMIC.length} live routes are server-rendered on demand.`,
);
