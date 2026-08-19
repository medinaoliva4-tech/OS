"use client";

import { useState, useTransition } from "react";
import { setTaskStatus, deleteTask } from "@/app/actions/tasks";
import { TASK_STATUSES, TASK_PRIORITIES, option } from "@/lib/domain";
import { daysUntil, formatDate, parseLabels } from "@/lib/format";
import { BrandDot, Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

export type TaskCardData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  labels: string;
  account: { name: string; slug: string; brandHex: string } | null;
  assignee: { name: string; avatarHue: number } | null;
};

export function TaskCard({
  task,
  highlighted = false,
}: {
  task: TaskCardData;
  highlighted?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const priority = option(TASK_PRIORITIES, task.priority);
  const days = daysUntil(task.dueDate);
  const overdue = days !== null && days < 0 && task.status !== "DONE";
  const dueSoon = days !== null && days >= 0 && days <= 2 && task.status !== "DONE";
  const labels = parseLabels(task.labels);
  const isDone = task.status === "DONE";

  function move(status: string) {
    startTransition(() => setTaskStatus(task.id, status));
  }

  return (
    <article
      className="surface-flat p-3 transition-opacity"
      style={{
        opacity: pending ? 0.55 : 1,
        borderColor: highlighted ? "var(--accent)" : undefined,
        boxShadow: highlighted
          ? "0 0 0 3px color-mix(in oklab, var(--accent) 20%, transparent)"
          : undefined,
      }}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => move(isDone ? "TODO" : "DONE")}
          disabled={pending}
          aria-label={isDone ? "Reopen task" : "Mark task done"}
          className="focusable mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors"
          style={{
            borderColor: isDone ? "var(--color-ok)" : "var(--line-strong)",
            background: isDone ? "var(--color-ok)" : "transparent",
            color: "var(--bg)",
          }}
        >
          {isDone && <Icon name="check" size={11} strokeWidth={2.6} />}
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="focusable block w-full text-left"
          >
            <p
              className="text-[12.5px] font-medium leading-snug"
              style={{
                textDecoration: isDone ? "line-through" : undefined,
                color: isDone ? "var(--text-faint)" : undefined,
              }}
            >
              {task.title}
            </p>
          </button>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {task.account && (
              <span
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ color: "var(--text-faint)" }}
              >
                <BrandDot hex={task.account.brandHex} size={7} />
                {task.account.name}
              </span>
            )}

            {task.priority !== "MEDIUM" && (
              <Chip tone={priority.tone}>{priority.label}</Chip>
            )}

            {task.dueDate && (
              <span
                className="text-[11px] tabular-nums"
                style={{
                  color: overdue
                    ? "var(--color-danger)"
                    : dueSoon
                      ? "var(--color-warn)"
                      : "var(--text-faint)",
                }}
              >
                {overdue
                  ? `${Math.abs(days!)}d overdue`
                  : days === 0
                    ? "due today"
                    : formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {expanded && (
            <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: "var(--line)" }}>
              {task.description && (
                <p
                  className="text-[12px] leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {task.description}
                </p>
              )}

              {labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {labels.map((label) => (
                    <Chip key={label} tone="neutral">
                      {label}
                    </Chip>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                <label className="label sr-only" htmlFor={`status-${task.id}`}>
                  Status
                </label>
                <select
                  id={`status-${task.id}`}
                  value={task.status}
                  onChange={(event) => move(event.target.value)}
                  disabled={pending}
                  className="field !w-auto !py-1 !text-[11px]"
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete “${task.title}”? This cannot be undone.`)) {
                      startTransition(() => deleteTask(task.id));
                    }
                  }}
                  disabled={pending}
                  className="btn btn-danger focusable !py-1 !text-[11px]"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {task.assignee && (
          <Avatar
            name={task.assignee.name}
            hue={task.assignee.avatarHue}
            size={20}
          />
        )}
      </div>
    </article>
  );
}
