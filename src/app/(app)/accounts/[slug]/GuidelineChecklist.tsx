"use client";

import { useState, useTransition } from "react";
import { setGuidelineStatus, updateGuideline } from "@/app/actions/content";
import { GUIDELINE_STATUSES, option } from "@/lib/domain";
import { Meter } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";

export type GuidelineRow = {
  id: string;
  section: string;
  status: string;
  content: string | null;
  sourceUrl: string | null;
};

const CYCLE: Record<string, string> = {
  MISSING: "DRAFT",
  DRAFT: "REVIEW",
  REVIEW: "DONE",
  DONE: "MISSING",
};

function GuidelineEditor({
  guideline,
  onDone,
}: {
  guideline: GuidelineRow;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [content, setContent] = useState(guideline.content ?? "");
  const [sourceUrl, setSourceUrl] = useState(guideline.sourceUrl ?? "");

  return (
    <div className="-mx-2 space-y-2 rounded-lg px-2 py-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus
        rows={3}
        placeholder={`What "${guideline.section}" actually says, or a summary of it.`}
        className="field !text-[12px]"
      />
      <input
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
        placeholder="Link to the full doc (Notion, Drive, Figma…)"
        className="field !text-[12px]"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateGuideline(guideline.id, { content, sourceUrl });
              onDone();
            })
          }
          className="btn btn-primary focusable !py-1 !text-[11px]"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="btn btn-ghost focusable !py-1 !text-[11px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * "Terminar guidelines" with a number attached. Click a row's chip to
 * advance its status; click the pencil to write or link the actual content.
 */
export function GuidelineChecklist({
  guidelines,
  brandHex,
}: {
  guidelines: GuidelineRow[];
  brandHex: string;
}) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

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

          if (editingId === guideline.id) {
            return (
              <li key={guideline.id}>
                <GuidelineEditor
                  guideline={guideline}
                  onDone={() => setEditingId(null)}
                />
              </li>
            );
          }

          return (
            <li key={guideline.id}>
              <div className="row-hover -mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors">
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
                  className="focusable min-w-0 flex-1 text-left"
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
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(guideline.id)}
                  className="btn btn-quiet focusable !px-1.5 !py-1"
                  aria-label={`Edit ${guideline.section} content`}
                >
                  <Icon name="edit" size={12} />
                </button>
                <Chip tone={meta.tone}>{meta.label}</Chip>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
