"use client";

import { useTransition } from "react";
import { setDealStage, deleteDeal } from "@/app/actions/deals";
import { DEAL_STAGES, DEAL_SOURCES, option } from "@/lib/domain";
import { formatDate, daysUntil } from "@/lib/format";
import { BrandDot, Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Money } from "@/components/ui/Money";

export type DealCardData = {
  id: string;
  title: string;
  stage: string;
  value: number;
  currency: string;
  probability: number;
  source: string | null;
  expectedCloseDate: Date | null;
  account: { name: string; slug: string; brandHex: string };
  owner: { name: string; avatarHue: number } | null;
};

export function DealCard({ deal }: { deal: DealCardData }) {
  const [pending, startTransition] = useTransition();
  const source = deal.source ? option(DEAL_SOURCES, deal.source) : null;
  const days = daysUntil(deal.expectedCloseDate);
  const slipping =
    days !== null && days < 0 && !["WON", "LOST"].includes(deal.stage);

  return (
    <article
      className="surface-flat p-3 transition-opacity"
      style={{ opacity: pending ? 0.55 : 1 }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <BrandDot hex={deal.account.brandHex} size={8} />
          <span
            className="truncate text-[11px]"
            style={{ color: "var(--text-faint)" }}
          >
            {deal.account.name}
          </span>
        </span>
        {deal.owner && (
          <Avatar name={deal.owner.name} hue={deal.owner.avatarHue} size={18} />
        )}
      </div>

      <p className="mt-1.5 text-[12.5px] font-medium leading-snug">{deal.title}</p>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-semibold tabular-nums">
          <Money amount={deal.value} currency={deal.currency} compact />
        </span>
        <span
          className="text-[11px] tabular-nums"
          style={{ color: "var(--text-faint)" }}
        >
          {deal.probability}%
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {source && <Chip tone={source.tone}>{source.label}</Chip>}
        {deal.expectedCloseDate && (
          <span
            className="text-[11px] tabular-nums"
            style={{
              color: slipping ? "var(--color-danger)" : "var(--text-faint)",
            }}
          >
            {slipping
              ? `${Math.abs(days!)}d past close`
              : formatDate(deal.expectedCloseDate)}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        <label className="sr-only" htmlFor={`deal-stage-${deal.id}`}>
          Stage for {deal.title}
        </label>
        <select
          id={`deal-stage-${deal.id}`}
          value={deal.stage}
          onChange={(event) =>
            startTransition(() => setDealStage(deal.id, event.target.value))
          }
          disabled={pending}
          className="field !w-auto flex-1 !py-1 !text-[11px]"
        >
          {DEAL_STAGES.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete “${deal.title}”?`)) {
              startTransition(() => deleteDeal(deal.id));
            }
          }}
          disabled={pending}
          className="btn btn-quiet focusable !px-1.5 !py-1 !text-[11px]"
          aria-label={`Delete ${deal.title}`}
        >
          ×
        </button>
      </div>
    </article>
  );
}
