"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { createReinvestment, deleteReinvestment } from "@/app/actions/finance";
import { formatDate } from "@/lib/format";
import { Money } from "@/components/ui/Money";
import { EmptyState } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

export type ReinvestmentData = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  date: Date | string;
  notes: string | null;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable !py-1 !text-[12px]" disabled={pending}>
      {pending ? "Logging…" : "Log it"}
    </button>
  );
}

export function ReinvestmentsSection({
  reinvestments,
}: {
  reinvestments: ReinvestmentData[];
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <div>
      {reinvestments.length === 0 ? (
        <EmptyState title="Nothing logged yet" hint="Equipment, a hire, tooling — anything put back into the business." />
      ) : (
        <ul className="mb-3 divide-y" style={{ borderColor: "var(--line)" }}>
          {reinvestments.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0 flex-1">
                <span className="truncate text-[12.5px] font-medium">{r.title}</span>
                <span className="ml-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
                  {formatDate(r.date)}
                </span>
                {r.notes && (
                  <span className="mt-0.5 block truncate text-[11px]" style={{ color: "var(--text-faint)" }}>
                    {r.notes}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[12.5px] font-semibold tabular-nums">
                <Money amount={r.amount} currency={r.currency} compact />
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirm(`Delete “${r.title}”?`)) {
                    startTransition(() => deleteReinvestment(r.id));
                  }
                }}
                className="btn btn-quiet focusable !px-1.5 !py-1 !text-[11px]"
                aria-label={`Delete ${r.title}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <form
          action={async (fd) => {
            await createReinvestment(fd);
            setOpen(false);
          }}
          className="grid gap-2 rounded-[10px] p-3 sm:grid-cols-2 lg:grid-cols-5"
          style={{ background: "var(--bg-overlay)" }}
        >
          <input name="title" required autoFocus placeholder="What was it" className="field !text-[12px] sm:col-span-2 lg:col-span-2" />
          <div className="flex gap-1.5">
            <input name="amount" type="number" min={0} step={10} required placeholder="Amount" className="field !text-[12px]" />
            <select name="currency" defaultValue="USD" className="field !w-auto !text-[12px]">
              <option value="USD">USD</option>
              <option value="GTQ">GTQ</option>
            </select>
          </div>
          <input name="date" type="date" className="field !text-[12px]" />
          <input name="notes" placeholder="Notes (optional)" className="field !text-[12px]" />
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
          Log a reinvestment
        </button>
      )}
    </div>
  );
}
