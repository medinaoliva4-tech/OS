"use client";

import { useTransition } from "react";
import { setContentStage, deleteContentItem } from "@/app/actions/content";
import {
  CONTENT_STAGES,
  CONTENT_FORMATS,
  CONTENT_CHANNELS,
  option,
} from "@/lib/domain";
import { formatDayMonth } from "@/lib/format";
import { BrandDot, Chip } from "@/components/ui/Chip";

export type ContentCardData = {
  id: string;
  title: string;
  format: string;
  channel: string;
  stage: string;
  origin: string | null;
  hook: string | null;
  scheduledFor: Date | null;
  account: { name: string; slug: string; brandHex: string };
};

export function ContentCard({ item }: { item: ContentCardData }) {
  const [pending, startTransition] = useTransition();

  const format = option(CONTENT_FORMATS, item.format);
  const channel = option(CONTENT_CHANNELS, item.channel);

  return (
    <article
      className="surface-flat p-3 transition-opacity"
      style={{ opacity: pending ? 0.55 : 1 }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <BrandDot hex={item.account.brandHex} size={8} />
          <span
            className="truncate text-[11px]"
            style={{ color: "var(--text-faint)" }}
          >
            {item.account.name}
          </span>
        </span>
        {item.scheduledFor && (
          <span
            className="shrink-0 text-[11px] tabular-nums"
            style={{ color: "var(--text-faint)" }}
          >
            {formatDayMonth(item.scheduledFor)}
          </span>
        )}
      </div>

      <p className="mt-1.5 text-[12.5px] font-medium leading-snug">{item.title}</p>

      {item.hook && (
        <p
          className="mt-1 line-clamp-2 text-[11px] leading-relaxed"
          style={{ color: "var(--text-faint)" }}
        >
          {item.hook}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Chip tone={format.tone}>{format.label}</Chip>
        <Chip tone={channel.tone}>{channel.label}</Chip>
        {item.origin && (
          <span
            className="font-mono text-[10px]"
            style={{ color: "var(--text-faint)" }}
          >
            {item.origin.toLowerCase()}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        <label className="sr-only" htmlFor={`content-stage-${item.id}`}>
          Stage for {item.title}
        </label>
        <select
          id={`content-stage-${item.id}`}
          value={item.stage}
          onChange={(event) =>
            startTransition(() => setContentStage(item.id, event.target.value))
          }
          disabled={pending}
          className="field !w-auto flex-1 !py-1 !text-[11px]"
        >
          {CONTENT_STAGES.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Remove “${item.title}”?`)) {
              startTransition(() => deleteContentItem(item.id));
            }
          }}
          disabled={pending}
          className="btn btn-quiet focusable !px-1.5 !py-1 !text-[11px]"
          aria-label={`Remove ${item.title}`}
        >
          ×
        </button>
      </div>
    </article>
  );
}
