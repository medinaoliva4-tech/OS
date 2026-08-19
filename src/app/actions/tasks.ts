"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/domain";

const VALID_STATUSES = TASK_STATUSES.map((s) => s.value);
const VALID_PRIORITIES = TASK_PRIORITIES.map((p) => p.value);

function refresh() {
  revalidatePath("/", "layout");
}

export async function setTaskStatus(taskId: string, status: string) {
  const user = await requireUser();
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Unknown task status: ${status}`);
  }

  const task = await db.task.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
    include: { account: { select: { name: true } } },
  });

  await logActivity({
    actorId: user.id,
    verb: status === "DONE" ? "completed" : "moved",
    entityType: "Task",
    entityId: task.id,
    summary: `${task.title} → ${status.toLowerCase().replace("_", " ")}`,
    meta: { account: task.account?.name, status },
  });

  refresh();
}

export async function createTask(formData: FormData) {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const accountId = String(formData.get("accountId") ?? "") || null;
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;
  const priority = String(formData.get("priority") ?? "MEDIUM");
  const dueRaw = String(formData.get("dueDate") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const labels = String(formData.get("labels") ?? "").trim();

  const task = await db.task.create({
    data: {
      title,
      description,
      accountId,
      assigneeId,
      priority: VALID_PRIORITIES.includes(priority) ? priority : "MEDIUM",
      dueDate: dueRaw ? new Date(dueRaw) : null,
      labels,
      status: "TODO",
      createdById: user.id,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "created",
    entityType: "Task",
    entityId: task.id,
    summary: `Added “${title}”`,
  });

  refresh();
}

export async function updateTask(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const priority = String(formData.get("priority") ?? "MEDIUM");
  const status = String(formData.get("status") ?? "TODO");
  const dueRaw = String(formData.get("dueDate") ?? "");
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;

  const task = await db.task.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").trim() || undefined,
      description: String(formData.get("description") ?? "").trim() || null,
      priority: VALID_PRIORITIES.includes(priority) ? priority : "MEDIUM",
      status: VALID_STATUSES.includes(status) ? status : "TODO",
      completedAt: status === "DONE" ? new Date() : null,
      dueDate: dueRaw ? new Date(dueRaw) : null,
      assigneeId,
    },
  });

  await logActivity({
    actorId: user.id,
    verb: "updated",
    entityType: "Task",
    entityId: task.id,
    summary: `Updated “${task.title}”`,
  });

  refresh();
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  const task = await db.task.delete({ where: { id: taskId } });

  await logActivity({
    actorId: user.id,
    verb: "deleted",
    entityType: "Task",
    entityId: taskId,
    summary: `Deleted “${task.title}”`,
  });

  refresh();
}
