"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createTask } from "@/app/actions/tasks";
import { TASK_PRIORITIES } from "@/lib/domain";
import { Icon } from "@/components/ui/Icon";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable" disabled={pending}>
      {pending ? "Adding…" : "Add"}
    </button>
  );
}

export function NewTaskForm({
  accounts,
  members,
  defaultAccountId,
}: {
  accounts: { id: string; name: string }[];
  members: { id: string; name: string }[];
  defaultAccountId?: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-primary focusable"
      >
        <Icon name="plus" size={15} />
        New task
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createTask(formData);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="surface w-full space-y-3 p-4"
    >
      <div>
        <label htmlFor="task-title" className="label mb-1.5 block">
          What needs doing
        </label>
        <input
          id="task-title"
          name="title"
          required
          autoFocus
          placeholder="e.g. Subir guidelines al folder"
          className="field"
        />
      </div>

      <div>
        <label htmlFor="task-description" className="label mb-1.5 block">
          Detail <span className="normal-case opacity-60">(optional)</span>
        </label>
        <textarea
          id="task-description"
          name="description"
          rows={2}
          placeholder="Anything the person picking this up needs to know."
          className="field"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="task-account" className="label mb-1.5 block">
            Brand
          </label>
          <select
            id="task-account"
            name="accountId"
            defaultValue={defaultAccountId ?? ""}
            className="field"
          >
            <option value="">No brand</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-assignee" className="label mb-1.5 block">
            Owner
          </label>
          <select id="task-assignee" name="assigneeId" className="field">
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-priority" className="label mb-1.5 block">
            Priority
          </label>
          <select
            id="task-priority"
            name="priority"
            defaultValue="MEDIUM"
            className="field"
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-due" className="label mb-1.5 block">
            Due
          </label>
          <input id="task-due" name="dueDate" type="date" className="field" />
        </div>
      </div>

      <div>
        <label htmlFor="task-labels" className="label mb-1.5 block">
          Labels <span className="normal-case opacity-60">(comma separated)</span>
        </label>
        <input
          id="task-labels"
          name="labels"
          placeholder="jockey, guidelines"
          className="field"
        />
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
