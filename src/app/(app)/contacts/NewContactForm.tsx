"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createContact } from "@/app/actions/accounts";
import { Icon } from "@/components/ui/Icon";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable" disabled={pending}>
      {pending ? "Adding…" : "Add contact"}
    </button>
  );
}

export function NewContactForm({
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
        New contact
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await createContact(formData);
        ref.current?.reset();
        setOpen(false);
      }}
      className="surface w-full space-y-3 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="contact-name" className="label mb-1.5 block">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            required
            autoFocus
            placeholder="Valentina Ruiz"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="contact-account" className="label mb-1.5 block">
            Brand
          </label>
          <select id="contact-account" name="accountId" required className="field">
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-title" className="label mb-1.5 block">
            Title
          </label>
          <input
            id="contact-title"
            name="title"
            placeholder="Brand Director"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="label mb-1.5 block">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            placeholder="name@brand.com"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="contact-phone" className="label mb-1.5 block">
            Phone
          </label>
          <input id="contact-phone" name="phone" type="tel" className="field" />
        </div>

        <div>
          <label htmlFor="contact-linkedin" className="label mb-1.5 block">
            LinkedIn
          </label>
          <input
            id="contact-linkedin"
            name="linkedin"
            type="url"
            placeholder="https://linkedin.com/in/…"
            className="field"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[12.5px]">
        <input type="checkbox" name="isPrimary" className="accent-[var(--accent)]" />
        Primary contact for this brand
      </label>

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
