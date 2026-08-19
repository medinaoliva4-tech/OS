"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { logActivity } from "@/lib/activity";
import { ALLOWED_EMAIL_DOMAIN, atLeast, checkEmailDomain, ROLES } from "@/lib/policy";

export type TeamState = { error?: string; ok?: string };

/**
 * Invite a teammate. The domain rule is enforced here, server-side, on top of
 * the HTML pattern on the form — the client hint is a courtesy, this is the
 * actual gate.
 */
export async function inviteUser(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const actor = await requireUser();
  if (!atLeast(actor.role, "ADMIN")) {
    return { error: "Only owners and admins can invite people." };
  }

  const check = checkEmailDomain(String(formData.get("email") ?? ""));
  if (!check.ok) return { error: check.reason };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a full name." };

  const password = String(formData.get("password") ?? "");
  if (password.length < 10) {
    return { error: "Set a temporary password of at least 10 characters." };
  }

  const role = String(formData.get("role") ?? "MEMBER");
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return { error: "Pick a valid role." };
  }
  // An admin must not be able to mint an owner and outrank the person who
  // invited them.
  if (role === "OWNER" && actor.role !== "OWNER") {
    return { error: "Only an owner can create another owner." };
  }

  const existing = await db.user.findUnique({ where: { email: check.email } });
  if (existing) {
    return { error: `${check.email} already has an account.` };
  }

  const user = await db.user.create({
    data: {
      email: check.email,
      name,
      title: String(formData.get("title") ?? "").trim() || null,
      role,
      avatarHue: Math.floor(Math.random() * 360),
      passwordHash: await hashPassword(password),
    },
  });

  await logActivity({
    actorId: actor.id,
    verb: "created",
    entityType: "User",
    entityId: user.id,
    summary: `Invited ${name} <${user.email}> as ${role.toLowerCase()}`,
  });

  revalidatePath("/team");
  return { ok: `${name} can now sign in with that temporary password.` };
}

export async function setUserRole(userId: string, role: string) {
  const actor = await requireUser();
  if (!atLeast(actor.role, "ADMIN")) return;
  if (!ROLES.includes(role as (typeof ROLES)[number])) return;
  if (role === "OWNER" && actor.role !== "OWNER") return;

  // Never let the last owner demote themselves out of the workspace.
  if (actor.id === userId && actor.role === "OWNER" && role !== "OWNER") {
    const owners = await db.user.count({ where: { role: "OWNER", active: true } });
    if (owners <= 1) return;
  }

  const user = await db.user.update({ where: { id: userId }, data: { role } });

  await logActivity({
    actorId: actor.id,
    verb: "updated",
    entityType: "User",
    entityId: userId,
    summary: `${user.name} is now ${role.toLowerCase()}`,
  });

  revalidatePath("/team");
}

export async function setUserActive(userId: string, active: boolean) {
  const actor = await requireUser();
  if (!atLeast(actor.role, "ADMIN")) return;

  // Deactivating the last active owner would lock everyone out.
  if (!active) {
    const target = await db.user.findUnique({ where: { id: userId } });
    if (target?.role === "OWNER") {
      const owners = await db.user.count({
        where: { role: "OWNER", active: true },
      });
      if (owners <= 1) return;
    }
  }

  const user = await db.user.update({
    where: { id: userId },
    data: { active },
  });

  // Revoke live sessions the moment access is withdrawn.
  if (!active) {
    await db.session.deleteMany({ where: { userId } });
  }

  await logActivity({
    actorId: actor.id,
    verb: "updated",
    entityType: "User",
    entityId: userId,
    summary: `${user.name} ${active ? "reactivated" : "deactivated"}`,
  });

  revalidatePath("/team");
}

export type PasswordState = { error?: string; ok?: string };

export async function changeOwnPassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const actor = await requireUser();

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 10) {
    return { error: "Use at least 10 characters." };
  }
  if (next !== confirm) {
    return { error: "The two new passwords do not match." };
  }

  const record = await db.user.findUnique({ where: { id: actor.id } });
  if (!record || !(await verifyPassword(current, record.passwordHash))) {
    return { error: "Your current password is not right." };
  }

  await db.user.update({
    where: { id: actor.id },
    data: { passwordHash: await hashPassword(next) },
  });

  await logActivity({
    actorId: actor.id,
    verb: "updated",
    entityType: "User",
    entityId: actor.id,
    summary: `${actor.name} changed their password`,
  });

  return { ok: "Password updated." };
}

export { ALLOWED_EMAIL_DOMAIN };
