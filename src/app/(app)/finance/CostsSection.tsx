"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { createCost, deleteCost } from "@/app/actions/finance";
import { COST_CATEGORIES, COST_RECURRENCE, option } from "@/lib/domain";
import { Chip } from "@/components/ui/Chip";
import { Money } from "@/components/ui/Money";
import { EmptyState } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

export type CostData = {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  recurrence: string;
  notes: string | null;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable !py-1 !text-[12px]" disabled={pending}>
      {pending ? "Adding…" : "Add cost"}
    </button>
  );
}

export function CostsSection({ costs }: { costs: CostData[] }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <div>
      {costs.length === 0 ? (
        <EmptyState title="No costs yet" hint="Add tools, infra, office — whatever the business pays for." />
      ) : (
        <ul className="mb-3 divide-y" style={{ borderColor: "var(--line)" }}>
          {costs.map((cost) => {
            const category = option(COST_CATEGORIES, cost.category);
            const recurrence = option(COST_RECURRENCE, cost.recurrence);
            return (
              <li key={cost.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-medium">{cost.name}</span>
                    <Chip tone={category.tone}>{category.label}</Chip>
                    <Chip tone={recurrence.tone}>{recurrence.label}</Chip>
                  </span>
                  {cost.notes && (
                    <span className="mt-0.5 block truncate text-[11px]" style={{ color: "var(--text-faint)" }}>
                      {cost.notes}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[12.5px] font-semibold tabular-nums">
                  <Money amount={cost.amount} currency={cost.currency} compact />
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Delete “${cost.name}”?`)) {
                      startTransition(() => deleteCost(cost.id));
                    }
                  }}
                  className="btn btn-quiet focusable !px-1.5 !py-1 !text-[11px]"
                  aria-label={`Delete ${cost.name}`}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open ? (
        <form
          action={async (fd) => {
            await createCost(fd);
            setOpen(false);
          }}
          className="grid gap-2 rounded-[10px] p-3 sm:grid-cols-2 lg:grid-cols-5"
          style={{ background: "var(--bg-overlay)" }}
        >
          <input name="name" required autoFocus placeholder="Name" className="field !text-[12px] sm:col-span-2 lg:col-span-2" />
          <select name="category" defaultValue="OTHER" className="field !text-[12px]">
            {COST_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select name="recurrence" defaultValue="MONTHLY" className="field !text-[12px]">
            {COST_RECURRENCE.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <input name="amount" type="number" min={0} step={10} required placeholder="Amount" className="field !text-[12px]" />
            <select name="currency" defaultValue="USD" className="field !w-auto !text-[12px]">
              <option value="USD">USD</option>
              <option value="GTQ">GTQ</option>
            </select>
          </div>
          <input name="notes" placeholder="Notes (optional)" className="field !text-[12px] sm:col-span-2 lg:col-span-4" />
          <div className="flex items-center gap-2">
            <Submit />
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost focusable !py-1 !text-[12px]">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost focusable">
          <Icon name="plus" size={14} />
          Add cost
        </button>
      )}
    </div>
  );
}
