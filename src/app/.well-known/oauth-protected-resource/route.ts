/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728).
 *
 * Points at /api/mcp specifically, telling a client which authorization
 * server issues tokens it accepts. Linked from the WWW-Authenticate header
 * on /api/mcp's 401 response.
 */
import "server-only";
import { headers } from "next/headers";
import { originFromHost } from "@/lib/oauth";

export async function GET() {
  const origin = originFromHost((await headers()).get("host"));

  return Response.json({
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
  });
}
