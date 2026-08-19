import "server-only";
import { db } from "@/lib/db";

type LogInput = {
  actorId?: string | null;
  verb: string;
  entityType: string;
  entityId: string;
  summary: string;
  meta?: Record<string, unknown>;
};

/**
 * Append to the activity feed. Never throws into the caller: an audit-log
 * failure must not roll back the business change that already succeeded.
 */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    await db.activity.create({
      data: {
        actorId: input.actorId ?? null,
        verb: input.verb,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary,
        meta: JSON.stringify(input.meta ?? {}),
      },
    });
  } catch (error) {
    console.error("[activity] failed to record", input.summary, error);
  }
}
