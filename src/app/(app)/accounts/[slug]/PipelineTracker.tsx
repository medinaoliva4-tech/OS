"use client";

import { useTransition } from "react";
import { setPipelineStepStatus } from "@/app/actions/content";
import { PIPELINE_STATUSES, option } from "@/lib/domain";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";

export type PipelineStep = {
  id: string;
  key: string;
  label: string;
  status: string;
  note: string | null;
  toolKey: string | null;
  updatedBy: string | null;
};

const NEXT_STATUS: Record<string, string> = {
  NOT_STARTED: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "NOT_STARTED",
  BLOCKED: "IN_PROGRESS",
};

/**
 * The content system as a vertical chain. Clicking the marker advances a step;
 * the select handles the non-linear cases (blocking, reverting).
 */
export function PipelineTracker({
  steps,
  brandHex,
}: {
  steps: PipelineStep[];
  brandHex: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <ol className="relative space-y-0" style={{ opacity: pending ? 0.6 : 1 }}>
      {steps.map((step, index) => {
        const meta = option(PIPELINE_STATUSES, step.status);
        const isDone = step.status === "DONE";
        const isBlocked = step.status === "BLOCKED";
        const isActive = step.status === "IN_PROGRESS";
        const isLast = index === steps.length - 1;

        const markerColor = isDone
          ? "var(--color-ok)"
          : isBlocked
            ? "var(--color-danger)"
            : isActive
              ? brandHex
              : "var(--line-strong)";

        return (
          <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Connector */}
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[9px] top-5 h-full w-px"
                style={{
                  background: isDone ? "var(--color-ok)" : "var(--line)",
                }}
              />
            )}

            <button
              type="button"
              onClick={() =>
                startTransition(() =>
                  setPipelineStepStatus(step.id, NEXT_STATUS[step.status] ?? "IN_PROGRESS"),
                )
              }
              disabled={pending}
              aria-label={`Advance ${step.label}`}
              title={`Advance ${step.label}`}
              className="focusable relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-2 transition-colors"
              style={{
                borderColor: markerColor,
                background: isDone ? markerColor : "var(--bg-raised)",
                color: "var(--bg)",
              }}
            >
              {isDone && <Icon name="check" size={10} strokeWidth={3} />}
              {isActive && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: markerColor }}
                />
              )}
              {isBlocked && (
                <span
                  className="h-[7px] w-[2px] rounded-full"
                  style={{ background: markerColor }}
                />
              )}
            </button>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[12.5px] font-medium"
                  style={{
                    color: isDone ? "var(--text-faint)" : "var(--text)",
                    textDecoration: isDone ? "line-through" : undefined,
                  }}
                >
                  {step.label}
                </span>
                {isBlocked && <Chip tone={meta.tone}>{meta.label}</Chip>}
                {step.toolKey && (
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {step.toolKey}
                  </span>
                )}
              </div>

              {step.note && !isDone && (
                <p
                  className="mt-1 text-[11.5px] leading-relaxed"
                  style={{ color: "var(--text-faint)" }}
                >
                  {step.note}
                </p>
              )}

              <select
                value={step.status}
                onChange={(event) =>
                  startTransition(() =>
                    setPipelineStepStatus(step.id, event.target.value),
                  )
                }
                disabled={pending}
                aria-label={`Set status for ${step.label}`}
                className="field mt-1.5 !w-auto !py-0.5 !text-[10.5px]"
              >
                {PIPELINE_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
