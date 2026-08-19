"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createAsset } from "@/app/actions/content";
import { ASSET_KINDS, ASSET_SOURCES, ASSET_STAGES } from "@/lib/domain";
import { Icon } from "@/components/ui/Icon";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable" disabled={pending}>
      {pending ? "Registering…" : "Register"}
    </button>
  );
}

export function NewAssetForm({
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
        Register asset
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await createAsset(formData);
        ref.current?.reset();
        setOpen(false);
      }}
      className="surface w-full space-y-3 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="asset-name" className="label mb-1.5 block">
            Name
          </label>
          <input
            id="asset-name"
            name="name"
            required
            autoFocus
            placeholder="Hero reel v3"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="asset-account" className="label mb-1.5 block">
            Brand
          </label>
          <select
            id="asset-account"
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
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="asset-kind" className="label mb-1.5 block">
            Kind
          </label>
          <select id="asset-kind" name="kind" defaultValue="IMAGE" className="field">
            {ASSET_KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="asset-source" className="label mb-1.5 block">
            Lives in
          </label>
          <select
            id="asset-source"
            name="source"
            defaultValue="DRIVE"
            className="field"
          >
            {ASSET_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="asset-stage" className="label mb-1.5 block">
            Stage
          </label>
          <select id="asset-stage" name="stage" defaultValue="RAW" className="field">
            {ASSET_STAGES.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="asset-path" className="label mb-1.5 block">
            Path
          </label>
          <input
            id="asset-path"
            name="path"
            placeholder="/approved/shoot-01"
            className="field font-mono !text-[12.5px]"
          />
        </div>

        <div>
          <label htmlFor="asset-url" className="label mb-1.5 block">
            Link
          </label>
          <input
            id="asset-url"
            name="url"
            type="url"
            placeholder="https://"
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
