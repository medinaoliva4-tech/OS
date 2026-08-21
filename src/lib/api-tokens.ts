import "server-only";
import { createHash, randomBytes } from "node:crypto";

const TOKEN_PREFIX = "ios_";

/** Raw token shown to the user once, e.g. "ios_9f2c...". */
export function generateApiToken(): string {
  return `${TOKEN_PREFIX}${randomBytes(24).toString("hex")}`;
}

/**
 * SHA-256 of the raw token, hex-encoded. Unlike passwords, this is a
 * lookup key (find the ApiToken row for an incoming request), not something
 * checked one guess at a time by an attacker with the plaintext in hand —
 * the token itself carries 192 bits of entropy, so a fast hash is fine and
 * lets `findUnique({ where: { tokenHash } })` do the auth check in one query.
 */
export function hashApiToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function last4(rawToken: string): string {
  return rawToken.slice(-4);
}
