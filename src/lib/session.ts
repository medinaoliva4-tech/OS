import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";

const COOKIE_NAME = "inherent_os_session";
const SESSION_TTL_DAYS = 14;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET is missing or too short. Set a 32+ byte random value.",
      );
    }
    return "inherent-os-development-secret";
  }
  return value;
}

function sign(token: string): string {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

/** Cookie value is `<token>.<hmac>` so a tampered token never reaches the DB. */
function pack(token: string): string {
  return `${token}.${sign(token)}`;
}

function unpack(raw: string | undefined): string | null {
  if (!raw) return null;
  const idx = raw.lastIndexOf(".");
  if (idx <= 0) return null;

  const token = raw.slice(0, idx);
  const providedSig = raw.slice(idx + 1);
  const expectedSig = sign(token);

  if (providedSig.length !== expectedSig.length) return null;
  if (
    !timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig))
  ) {
    return null;
  }
  return token;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  title: string | null;
  role: string;
  avatarHue: number;
  avatarUrl: string | null;
};

export async function createSession(
  userId: string,
  userAgent?: string,
): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  await db.session.create({
    data: { token, userId, expiresAt, userAgent: userAgent?.slice(0, 255) },
  });

  const jar = await cookies();
  jar.set(COOKIE_NAME, pack(token), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = unpack(jar.get(COOKIE_NAME)?.value);

  if (token) {
    await db.session.deleteMany({ where: { token } });
  }
  jar.delete(COOKIE_NAME);
}

/**
 * Resolve the signed-in user. Cached per request so a page that reads it in a
 * layout, a header and three server components still hits the DB once.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = unpack(jar.get(COOKIE_NAME)?.value);
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.active) return null;

  const { id, email, name, title, role, avatarHue, avatarUrl } = session.user;
  return { id, email, name, title, role, avatarHue, avatarUrl };
});

/** Use in any server component or action that must not run for a guest. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  // Layout-level guards redirect first; this is the belt-and-braces case.
  if (!user) redirect("/login");
  return user;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
