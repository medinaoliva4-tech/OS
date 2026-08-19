/**
 * Membership policy for Inherent OS.
 *
 * The rule is simple and non-negotiable: an account may only exist for an
 * address on the company domain. It is enforced here, in one place, and every
 * path that can create a session or a user calls into it — login, invite, seed.
 */

export const ALLOWED_EMAIL_DOMAIN = (
  process.env.ALLOWED_EMAIL_DOMAIN || "inherentglobal.com"
).toLowerCase();

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type EmailCheck =
  | { ok: true; email: string }
  | { ok: false; reason: string };

export function checkEmailDomain(rawEmail: string): EmailCheck {
  const email = normalizeEmail(rawEmail);

  if (!email) {
    return { ok: false, reason: "Enter an email address." };
  }

  // Deliberately strict: exactly one @, a local part, and a real-looking domain.
  const match = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/.exec(email);
  if (!match) {
    return { ok: false, reason: "That is not a valid email address." };
  }

  const domain = match[1];
  if (domain !== ALLOWED_EMAIL_DOMAIN) {
    return {
      ok: false,
      reason: `Inherent OS is restricted to @${ALLOWED_EMAIL_DOMAIN} addresses.`,
    };
  }

  return { ok: true, email };
}

export function isAllowedEmail(email: string): boolean {
  return checkEmailDomain(email).ok;
}

export const ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1 };

export function atLeast(role: string, minimum: Role): boolean {
  const r = RANK[role as Role] ?? 0;
  return r >= RANK[minimum];
}

/**
 * Financial data — MRR, revenue, deal values, weighted pipeline, the whole
 * Pipeline screen — is restricted to ADMIN and OWNER. MEMBER sees everything
 * else in the OS (brands, tasks, content, guidelines) but never money.
 */
export function canViewFinancials(role: string): boolean {
  return atLeast(role, "ADMIN");
}
