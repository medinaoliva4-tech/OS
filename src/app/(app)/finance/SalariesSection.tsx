"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { upsertSalary, deleteSalary } from "@/app/actions/finance";
import { PAY_CADENCE, option } from "@/lib/domain";
import { Chip } from "@/components/ui/Chip";
import { Money } from "@/components/ui/Money";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

type Member = { id: string; name: string; avatarHue: number; avatarUrl: string | null };
export type SalaryData = {
  id: string;
  amount: number;
  currency: string;
  cadence: string;
  notes: string | null;
  user: Member;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable !py-1 !text-[12px]" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

function SalaryForm({
  member,
  existing,
  onDone,
}: {
  member: { id: string; name: string };
  existing?: SalaryData;
  onDone: () => void;
}) {
  return (
    <form
      action={async (fd) => {
        await upsertSalary(fd);
        onDone();
      }}
      className="grid gap-2 rounded-[10px] p-3 sm:grid-cols-4"
      style={{ background: "var(--bg-overlay)" }}
    >
      <input type="hidden" name="userId" value={member.id} />
      <div className="flex items-center gap-2 sm:col-span-1">
        <span className="truncate text-[12.5px] font-medium">{member.name}</span>
      </div>
      <div className="flex gap-1.5">
        <input
          name="amount"
          type="number"
          min={0}
          step={10}
          required
          autoFocus
          defaultValue={existing?.amount}
          placeholder="Amount"
          className="field !text-[12px]"
        />
        <select name="currency" defaultValue={existing?.currency ?? "USD"} className="field !w-auto !text-[12px]">
          <option value="USD">USD</option>
          <option value="GTQ">GTQ</option>
        </select>
      </div>
      <select name="cadence" defaultValue={existing?.cadence ?? "MONTHLY"} className="field !text-[12px]">
        {PAY_CADENCE.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <input name="notes" defaultValue={existing?.notes ?? ""} placeholder="Notes (optional)" className="field !text-[12px]" />
      <div className="flex items-center gap-2 sm:col-span-4">
        <Submit />
        <button type="button" onClick={onDone} className="btn btn-ghost focusable !py-1 !text-[12px]">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function SalariesSection({
  salaries,
  members,
}: {
  salaries: SalaryData[];
  members: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [addingFor, setAddingFor] = useState<string | null>(null);

  const paidIds = new Set(salaries.map((s) => s.user.id));
  const unpaid = members.filter((m) => !paidIds.has(m.id));

  return (
    <div>
      {salaries.length === 0 ? (
        <EmptyState title="No pay on record" hint="Set what each person currently earns." />
      ) : (
        <ul className="mb-3 divide-y" style={{ borderColor: "var(--line)" }}>
          {salaries.map((salary) => {
            if (editingUserId === salary.user.id) {
              return (
                <li key={salary.id} className="py-2">
                  <SalaryForm
                    member={salary.user}
                    existing={salary}
                    onDone={() => setEditingUserId(null)}
                  />
                </li>
              );
            }
            const cadence = option(PAY_CADENCE, salary.cadence);
            return (
              <li key={salary.id} className="flex items-center justify-between gap-2 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar name={salary.user.name} hue={salary.user.avatarHue} imageUrl={salary.user.avatarUrl} size={22} />
                  <span className="truncate text-[12.5px] font-medium">{salary.user.name}</span>
                  <Chip tone={cadence.tone}>{cadence.label}</Chip>
                </span>
                <span className="shrink-0 text-[12.5px] font-semibold tabular-nums">
                  <Money amount={salary.amount} currency={salary.currency} compact />
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingUserId(salary.user.id)}
                    className="btn btn-quiet focusable !px-1.5 !py-1"
                    aria-label={`Edit pay for ${salary.user.name}`}
                  >
                    <Icon name="edit" size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Remove the pay record for ${salary.user.name}?`)) {
                        startTransition(() => deleteSalary(salary.id));
                      }
                    }}
                    className="btn btn-quiet focusable !px-1.5 !py-1 !text-[11px]"
                    aria-label={`Delete pay record for ${salary.user.name}`}
                  >
                    ×
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {unpaid.length > 0 &&
        (addingFor ? (
          <SalaryForm
            member={unpaid.find((m) => m.id === addingFor)!}
            onDone={() => setAddingFor(null)}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              defaultValue=""
              onChange={(e) => e.target.value && setAddingFor(e.target.value)}
              className="field !w-auto !py-1 !text-[12px]"
            >
              <option value="" disabled>
                Set pay for…
              </option>
              {unpaid.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        ))}
    </div>
  );
}
