"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteContact, updateContact } from "@/app/actions/accounts";
import { BrandDot, Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

export type ContactRowData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  linkedin: string | null;
  isPrimary: boolean;
  account: { name: string; slug: string; brandHex: string };
};

/**
 * A `<form>` can't wrap a `<tr>` — the HTML table content model hoists it
 * back out. Editing builds a FormData by hand from local state instead of
 * relying on a native form submit inside the row.
 */
export function ContactRow({ contact }: { contact: ContactRowData }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(contact.name);
  const [title, setTitle] = useState(contact.title ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");

  const save = () => {
    const fd = new FormData();
    fd.set("id", contact.id);
    fd.set("name", name);
    fd.set("title", title);
    fd.set("email", email);
    fd.set("phone", phone);
    if (contact.linkedin) fd.set("linkedin", contact.linkedin);
    if (contact.isPrimary) fd.set("isPrimary", "on");
    startTransition(async () => {
      await updateContact(fd);
      setEditing(false);
    });
  };

  if (editing) {
    return (
      <tr className="transition-opacity" style={{ opacity: pending ? 0.5 : 1 }}>
        <td className="py-2 pl-5 pr-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="Name"
            className="field !py-1 !text-[12.5px]"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="field !mt-1 !py-1 !text-[11px]"
          />
        </td>
        <td className="py-2 pr-3 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
          {contact.account.name}
        </td>
        <td className="py-2 pr-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="field !py-1 !text-[12.5px]"
          />
        </td>
        <td className="py-2 pr-3">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="field !py-1 !text-[12.5px]"
          />
        </td>
        <td className="py-2 pr-5 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={save}
              disabled={pending || !name.trim()}
              className="btn btn-primary focusable !py-1 !text-[11px]"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={pending}
              className="btn btn-ghost focusable !py-1 !text-[11px]"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className="row-hover transition-colors"
      style={{ opacity: pending ? 0.5 : 1 }}
    >
      <td className="py-2.5 pl-5 pr-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={contact.name} hue={200} size={28} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-medium">
                {contact.name}
              </span>
              {contact.isPrimary && <Chip tone="accent">Primary</Chip>}
            </div>
            <span
              className="block truncate text-[11px]"
              style={{ color: "var(--text-faint)" }}
            >
              {contact.title ?? "—"}
            </span>
          </div>
        </div>
      </td>

      <td className="py-2.5 pr-3">
        <Link
          href={`/accounts/${contact.account.slug}`}
          className="link-quiet inline-flex items-center gap-1.5 text-[12.5px]"
        >
          <BrandDot hex={contact.account.brandHex} size={8} />
          {contact.account.name}
        </Link>
      </td>

      <td className="py-2.5 pr-3">
        {contact.email ? (
          <a
            href={`mailto:${contact.email}`}
            className="link-quiet truncate text-[12.5px]"
          >
            {contact.email}
          </a>
        ) : (
          <span style={{ color: "var(--text-faint)" }}>—</span>
        )}
      </td>

      <td className="py-2.5 pr-3 text-[12.5px]">
        {contact.phone ?? <span style={{ color: "var(--text-faint)" }}>—</span>}
      </td>

      <td className="py-2.5 pr-5 text-right">
        <div className="flex items-center justify-end gap-1">
          {contact.linkedin && (
            <a
              href={contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-quiet focusable"
              aria-label={`${contact.name} on LinkedIn`}
            >
              <Icon name="external" size={14} />
            </a>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn btn-quiet focusable"
            aria-label={`Edit ${contact.name}`}
          >
            <Icon name="edit" size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove ${contact.name}?`)) {
                startTransition(() => deleteContact(contact.id));
              }
            }}
            disabled={pending}
            className="btn btn-quiet focusable"
            aria-label={`Remove ${contact.name}`}
          >
            ×
          </button>
        </div>
      </td>
    </tr>
  );
}
