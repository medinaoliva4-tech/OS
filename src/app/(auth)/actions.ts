"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/passwords";
import { checkEmailDomain } from "@/lib/policy";
import { createSession, destroySession } from "@/lib/session";
import { logActivity } from "@/lib/activity";

export type LoginState = { error?: string; email?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  // Gate on the domain before touching the database at all.
  const check = checkEmailDomain(rawEmail);
  if (!check.ok) {
    return { error: check.reason, email: rawEmail };
  }

  if (!password) {
    return { error: "Enter your password.", email: rawEmail };
  }

  const user = await db.user.findUnique({ where: { email: check.email } });

  // One message for "no such user" and "wrong password" so the form cannot be
  // used to enumerate who works here.
  const invalid: LoginState = {
    error: "That email and password do not match.",
    email: rawEmail,
  };

  if (!user) return invalid;
  if (!(await verifyPassword(password, user.passwordHash))) return invalid;

  if (!user.active) {
    return { error: "That account has been deactivated.", email: rawEmail };
  }

  const headerList = await headers();
  await createSession(user.id, headerList.get("user-agent") ?? undefined);

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await logActivity({
    actorId: user.id,
    verb: "signed_in",
    entityType: "User",
    entityId: user.id,
    summary: `${user.name} signed in`,
  });

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
