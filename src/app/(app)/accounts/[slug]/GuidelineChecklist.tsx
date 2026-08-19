"use client";

import { useTransition } from "react";
import { setGuidelineStatus } from "@/app/actions/content";
import { GUIDELINE_STATUSES, option } from "@/lib/domain";
import { Meter } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";

export type GuidelineRow = {
  id: string;
  section: string;
  status: string;
};

const CYCLE: Record<string, string> = {
  MISSING: "DRAFT",
  DRAFT: "REVIEW",
  REVIEW: "DONE",
  DONE: "MISSING",
};

/**
 * "Terminar guidelines" with a number attached. Click a row to advance it.
 */
export function GuidelineChecklist({
  guidelines,
  brandHex,
}: {
  guidelines: GuidelineRow[];
  brandHex: string;
}) {
  const [pending, startTransition] = useTransition();

  const done = guidelines.filter((g) => g.status === "DONE").length;
  const pct = guidelines.length
    ? Math.round((done / guidelines.length) * 100)
    : 0;

  return (
    <div style={{ opacity: pending ? 0.6 : 1 }}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-lg font-semibold tabular-nums">{pct}%</span>
        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          {done} of {guidelines.length} sections
        </span>
      </div>
      <Meter value={done} total={guidelines.length} tone={brandHex} />

      <ul className="mt-4 space-y-0.5">
        {guidelines.map((guideline) => {
          const meta = option(GUIDELINE_STATUSES, guideline.status);
          return (
            <li key={guideline.id}>
              <button
                type="button"
                onClick={() =>
                  startTransition(() =>
                    setGuidelineStatus(
                      guideline.id,
                      CYCLE[guideline.status] ?? "DRAFT",
                    ),
                  )
                }
                disabled={pending}
                className="row-hover focusable -mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors"
              >
                <span
                  className="truncate text-[12.5px]"
                  style={{
                    color:
                      guideline.status === "DONE"
                        ? "var(--text-faint)"
                        : "var(--text)",
                  }}
                >
                  {guideline.section}
                </span>
                <Chip tone={meta.tone}>{meta.label}</Chip>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
