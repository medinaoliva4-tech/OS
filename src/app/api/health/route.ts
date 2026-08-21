import { NextResponse } from "next/server";
import { checkDatabase, environmentSummary } from "@/lib/db-health";

export const dynamic = "force-dynamic";

/**
 * Liveness plus setup state, in one curl.
 *
 *   curl -s https://<deployment>/api/health | jq
 *
 * 200 when the OS can serve; 503 with a machine-readable reason when it
 * cannot. Deliberately reports only whether variables are SET, never what
 * they contain.
 */
export async function GET() {
  const status = await checkDatabase();
  const env = environmentSummary();

  if (status.ok) {
    return NextResponse.json({
      status: "ok",
      database: { reachable: true, accounts: status.users },
      env,
    });
  }

  return NextResponse.json(
    {
      status: "setup_required",
      reason: status.kind,
      title: status.title,
      detail: status.detail,
      fix: status.fix,
      database: { reachable: status.kind !== "UNREACHABLE" && status.kind !== "NO_URL" },
      env,
    },
    { status: 503 },
  );
}
