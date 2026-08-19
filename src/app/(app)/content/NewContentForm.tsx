"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createContentItem } from "@/app/actions/content";
import { CONTENT_CHANNELS, CONTENT_FORMATS, CONTENT_STAGES } from "@/lib/domain";
import { Icon } from "@/components/ui/Icon";

const ORIGINS = ["JOCKEY", "HIGGSFIELD", "SHOT", "EXTERNAL"];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable" disabled={pending}>
      {pending ? "Adding…" : "Plan it"}
    </button>
  );
}

export function NewContentForm({
  accounts,
  defaultAccountId,
}: {
  accounts: { id: string; name: string }[];
  defaultAccountId?: string;
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
        Plan content
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await createContentItem(formData);
        ref.current?.reset();
        setOpen(false);
      }}
      className="surface w-full space-y-3 p-4"
    >
      <div>
        <label htmlFor="content-title" className="label mb-1.5 block">
          Title
        </label>
        <input
          id="content-title"
          name="title"
          required
          autoFocus
          placeholder="Morning ritual — hero reel"
          className="field"
        />
      </div>

      <div>
        <label htmlFor="content-hook" className="label mb-1.5 block">
          Hook <span className="normal-case opacity-60">(optional)</span>
        </label>
        <input
          id="content-hook"
          name="hook"
          placeholder="The first three seconds."
          className="field"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="content-account" className="label mb-1.5 block">
            Brand
          </label>
          <select
            id="content-account"
            name="accountId"
            required
            defaultValue={defaultAccountId ?? ""}
            className="field"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="content-format" className="label mb-1.5 block">
            Format
          </label>
          <select
            id="content-format"
            name="format"
            defaultValue="REEL"
            className="field"
          >
            {CONTENT_FORMATS.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="content-channel" className="label mb-1.5 block">
            Channel
          </label>
          <select
            id="content-channel"
            name="channel"
            defaultValue="INSTAGRAM"
            className="field"
          >
            {CONTENT_CHANNELS.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="content-stage" className="label mb-1.5 block">
            Stage
          </label>
          <select
            id="content-stage"
            name="stage"
            defaultValue="IDEA"
            className="field"
          >
            {CONTENT_STAGES.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="content-origin" className="label mb-1.5 block">
            Origin
          </label>
          <select id="content-origin" name="origin" className="field">
            <option value="">—</option>
            {ORIGINS.map((origin) => (
              <option key={origin} value={origin}>
                {origin.charAt(0) + origin.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="content-scheduled" className="label mb-1.5 block">
            Scheduled for
          </label>
          <input
            id="content-scheduled"
            name="scheduledFor"
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
