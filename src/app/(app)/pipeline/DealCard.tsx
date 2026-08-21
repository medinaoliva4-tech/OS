"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { setDealStage, deleteDeal, updateDeal } from "@/app/actions/deals";
import { DEAL_STAGES, DEAL_SOURCES, option } from "@/lib/domain";
import { formatDate, daysUntil } from "@/lib/format";
import { BrandDot, Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Money } from "@/components/ui/Money";

export type DealCardData = {
  id: string;
  title: string;
  stage: string;
  value: number;
  currency: string;
  probability: number;
  source: string | null;
  notes: string | null;
  expectedCloseDate: Date | null;
  account: { name: string; slug: string; brandHex: string };
  owner: { name: string; avatarHue: number } | null;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-primary focusable !py-1 !text-[11px]"
      disabled={pending}
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

function DealEditForm({
  deal,
  onDone,
}: {
  deal: DealCardData;
  onDone: () => void;
}) {
  return (
    <form
      action={async (formData) => {
        await updateDeal(formData);
        onDone();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="id" value={deal.id} />
      <div>
        <label className="sr-only" htmlFor={`deal-edit-title-${deal.id}`}>
          Title
        </label>
        <input
          id={`deal-edit-title-${deal.id}`}
          name="title"
          required
          autoFocus
          defaultValue={deal.title}
          className="field !py-1 !text-[12px]"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label mb-1 block" htmlFor={`deal-edit-value-${deal.id}`}>
            Value (USD)
          </label>
          <input
            id={`deal-edit-value-${deal.id}`}
            name="value"
            type="number"
            min={0}
            step={500}
            defaultValue={deal.value}
            className="field !py-1 !text-[12px]"
          />
        </div>
        <div>
          <label
            className="label mb-1 block"
            htmlFor={`deal-edit-probability-${deal.id}`}
          >
            Probability %
          </label>
          <input
            id={`deal-edit-probability-${deal.id}`}
            name="probability"
            type="number"
            min={0}
            max={100}
            step={5}
            defaultValue={deal.probability}
            className="field !py-1 !text-[12px]"
          />
        </div>
        <div>
          <label className="label mb-1 block" htmlFor={`deal-edit-source-${deal.id}`}>
            Source
          </label>
          <select
            id={`deal-edit-source-${deal.id}`}
            name="source"
            defaultValue={deal.source ?? ""}
            className="field !py-1 !text-[12px]"
          >
            <option value="">—</option>
            {DEAL_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1 block" htmlFor={`deal-edit-close-${deal.id}`}>
            Expected close
          </label>
          <input
            id={`deal-edit-close-${deal.id}`}
            name="expectedCloseDate"
            type="date"
            defaultValue={
              deal.expectedCloseDate
                ? new Date(deal.expectedCloseDate).toISOString().slice(0, 10)
                : ""
            }
            className="field !py-1 !text-[12px]"
          />
        </div>
      </div>
      <div>
        <label className="label mb-1 block" htmlFor={`deal-edit-notes-${deal.id}`}>
          Notes
        </label>
        <textarea
          id={`deal-edit-notes-${deal.id}`}
          name="notes"
          rows={2}
          defaultValue={deal.notes ?? ""}
          className="field !py-1 !text-[12px]"
        />
      </div>
      <div className="flex items-center gap-2">
        <SaveButton />
        <button
          type="button"
          onClick={onDone}
          className="btn btn-ghost focusable !py-1 !text-[11px]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function DealCard({ deal }: { deal: DealCardData }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const source = deal.source ? option(DEAL_SOURCES, deal.source) : null;
  const days = daysUntil(deal.expectedCloseDate);
  const slipping =
    days !== null && days < 0 && !["WON", "LOST"].includes(deal.stage);

  if (editing) {
    return (
      <article className="surface-flat p-3">
        <DealEditForm deal={deal} onDone={() => setEditing(false)} />
      </article>
    );
  }

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
          onClick={() => setEditing(true)}
          disabled={pending}
          className="btn btn-quiet focusable !px-1.5 !py-1 !text-[11px]"
          aria-label={`Edit ${deal.title}`}
        >
          <Icon name="edit" size={13} />
        </button>
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
