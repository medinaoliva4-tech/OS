"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createDeal } from "@/app/actions/deals";
import { DEAL_SOURCES, DEAL_STAGES } from "@/lib/domain";
import { Icon } from "@/components/ui/Icon";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable" disabled={pending}>
      {pending ? "Adding…" : "Add deal"}
    </button>
  );
}

export function NewDealForm({
  accounts,
}: {
  accounts: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-primary focusable"
      >
        <Icon name="plus" size={15} />
        New deal
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await createDeal(formData);
        ref.current?.reset();
        setOpen(false);
      }}
      className="surface w-full space-y-3 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="deal-title" className="label mb-1.5 block">
            Deal
          </label>
          <input
            id="deal-title"
            name="title"
            required
            autoFocus
            placeholder="NAO — Q4 retainer renewal"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="deal-account" className="label mb-1.5 block">
            Brand
          </label>
          <select id="deal-account" name="accountId" required className="field">
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="deal-stage" className="label mb-1.5 block">
            Stage
          </label>
          <select id="deal-stage" name="stage" defaultValue="LEAD" className="field">
            {DEAL_STAGES.filter((s) => !["WON", "LOST"].includes(s.value)).map(
              (stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label htmlFor="deal-value" className="label mb-1.5 block">
            Value (USD)
          </label>
          <input
            id="deal-value"
            name="value"
            type="number"
            min={0}
            step={500}
            defaultValue={0}
            className="field"
          />
        </div>

        <div>
          <label htmlFor="deal-probability" className="label mb-1.5 block">
            Probability %
          </label>
          <input
            id="deal-probability"
            name="probability"
            type="number"
            min={0}
            max={100}
            step={5}
            defaultValue={20}
            className="field"
          />
        </div>

        <div>
          <label htmlFor="deal-source" className="label mb-1.5 block">
            Source
          </label>
          <select id="deal-source" name="source" className="field">
            <option value="">—</option>
            {DEAL_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="deal-close" className="label mb-1.5 block">
            Expected close
          </label>
          <input
            id="deal-close"
            name="expectedCloseDate"
            type="date"
            className="field"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Submit />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-ghost focusable"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
