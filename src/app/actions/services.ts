"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/activity";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function createService(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const base = slugify(name) || "service";
  let slug = base;
  let suffix = 2;
  while (await db.service.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  const service = await db.service.create({
    data: {
      name,
      slug,
      description: String(formData.get("description") ?? "").trim() || null,
      color: String(formData.get("color") ?? "") || "#5EEAD4",
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "created",
    entityType: "Service",
    entityId: service.id,
    summary: `New service “${name}”`,
  });

  revalidatePath("/services");
}

export async function updateService(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  const service = await db.service.update({
    where: { id },
    data: {
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      color: String(formData.get("color") ?? "#5EEAD4"),
      status: String(formData.get("status") ?? "ACTIVE"),
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "updated",
    entityType: "Service",
    entityId: service.id,
    summary: `Updated ${service.name}`,
  });

  revalidatePath("/services");
}

export async function deleteService(serviceId: string) {
  const user = await requireUser();
  const service = await db.service.delete({ where: { id: serviceId } });

  await logActivity({
    actorId: user.id,
    verb: "deleted",
    entityType: "Service",
    entityId: serviceId,
    summary: `Deleted service “${service.name}”`,
  });

  revalidatePath("/services");
}

export async function addServiceMember(serviceId: string, userId: string) {
  const actor = await requireUser();
  const service = await db.service.update({
    where: { id: serviceId },
    data: { members: { connect: { id: userId } } },
    include: { members: { select: { name: true } } },
  });

  await logActivity({
    actorId: actor.id,
    verb: "updated",
    entityType: "Service",
    entityId: serviceId,
    summary: `Team updated for ${service.name}`,
  });

  revalidatePath("/services");
}

export async function removeServiceMember(serviceId: string, userId: string) {
  const actor = await requireUser();
  const service = await db.service.update({
    where: { id: serviceId },
    data: { members: { disconnect: { id: userId } } },
  });

  await logActivity({
    actorId: actor.id,
    verb: "updated",
    entityType: "Service",
    entityId: serviceId,
    summary: `Team updated for ${service.name}`,
  });

  revalidatePath("/services");
}
