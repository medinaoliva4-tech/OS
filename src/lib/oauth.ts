import "server-only";
import { createHash, randomBytes } from "node:crypto";

export const OAUTH_CODE_TTL_MS = 5 * 60 * 1000;

export function generateAuthCode(): string {
  return randomBytes(32).toString("hex");
}

/** Derives this deploy's own origin from the request, same trick as Settings uses for the MCP URL. */
export function originFromHost(host: string | null): string {
  const isLocal = host?.startsWith("localhost") || host?.startsWith("127.0.0.1");
  return `${isLocal ? "http" : "https"}://${host}`;
}

/** PKCE verification per RFC 7636. */
export function verifyPkce(
  verifier: string,
  challenge: string,
  method: string,
): boolean {
  if (method === "plain") return verifier === challenge;
  if (method !== "S256") return false;
  const derived = createHash("sha256").update(verifier).digest("base64url");
  return derived === challenge;
}
