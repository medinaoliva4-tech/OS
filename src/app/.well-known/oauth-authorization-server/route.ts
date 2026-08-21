/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414).
 *
 * Claude.ai and ChatGPT fetch this first when you add /api/mcp as a custom
 * connector, to discover where to register, authorize, and exchange tokens —
 * see src/app/oauth/{register,authorize,token}.
 */
import "server-only";
import { headers } from "next/headers";
import { originFromHost } from "@/lib/oauth";

export async function GET() {
  const origin = originFromHost((await headers()).get("host"));

  return Response.json({
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  });
}
