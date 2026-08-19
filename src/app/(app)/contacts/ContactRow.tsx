"use client";

import { useTransition } from "react";
import Link from "next/link";
import { deleteContact } from "@/app/actions/accounts";
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

export function ContactRow({ contact }: { contact: ContactRowData }) {
  const [pending, startTransition] = useTransition();

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
