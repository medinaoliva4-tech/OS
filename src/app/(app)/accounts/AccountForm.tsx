"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  ACCOUNT_KINDS,
  ACCOUNT_STATUSES,
  ACCOUNT_TIERS,
} from "@/lib/domain";
import { BRAND_SWATCHES } from "@/lib/brand";
import { Card, CardHeader } from "@/components/ui/Card";

export type AccountFormValues = {
  id?: string;
  name?: string;
  kind?: string;
  status?: string;
  tier?: string;
  industry?: string | null;
  website?: string | null;
  summary?: string | null;
  brandHex?: string;
  mrr?: number;
  githubRepo?: string | null;
  githubPath?: string | null;
  driveFolderUrl?: string | null;
  jockeyWorkspace?: string | null;
  figmaFileUrl?: string | null;
  ownerId?: string | null;
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

export function AccountForm({
  action,
  values = {},
  members,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => Promise<void>;
  values?: AccountFormValues;
  members: { id: string; name: string }[];
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="space-y-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <Card>
        <CardHeader title="Identity" subtitle="How this brand shows up across the OS." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="label mb-1.5 block">
              Brand name
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={values.name}
              placeholder="NAO"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="industry" className="label mb-1.5 block">
              Industry
            </label>
            <input
              id="industry"
              name="industry"
              defaultValue={values.industry ?? ""}
              placeholder="Lifestyle"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="website" className="label mb-1.5 block">
              Website
            </label>
            <input
              id="website"
              name="website"
              type="url"
              defaultValue={values.website ?? ""}
              placeholder="https://"
              className="field"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="summary" className="label mb-1.5 block">
              Summary
            </label>
            <textarea
              id="summary"
              name="summary"
              rows={2}
              defaultValue={values.summary ?? ""}
              placeholder="What we do for them, in one or two lines."
              className="field"
            />
          </div>

          <fieldset className="sm:col-span-2">
            <legend className="label mb-2">Brand colour</legend>
            <div className="flex flex-wrap items-center gap-2">
              {BRAND_SWATCHES.map((hex) => (
                <label
                  key={hex}
                  className="focusable relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] transition-transform hover:scale-110"
                  style={{ background: hex }}
                  title={hex}
                >
                  <input
                    type="radio"
                    name="brandHex"
                    value={hex}
                    defaultChecked={(values.brandHex ?? BRAND_SWATCHES[0]) === hex}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-[7px] ring-offset-2 peer-checked:ring-2"
                    style={
                      {
                        "--tw-ring-color": hex,
                        "--tw-ring-offset-color": "var(--bg)",
                      } as CSSProperties
                    }
                  />
                  <span className="sr-only">{hex}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Card>

      <Card>
        <CardHeader title="Commercial" subtitle="Relationship and retainer." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="kind" className="label mb-1.5 block">
              Type
            </label>
            <select
              id="kind"
              name="kind"
              defaultValue={values.kind ?? "CLIENT"}
              className="field"
            >
              {ACCOUNT_KINDS.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="label mb-1.5 block">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={values.status ?? "ONBOARDING"}
              className="field"
            >
              {ACCOUNT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tier" className="label mb-1.5 block">
              Tier
            </label>
            <select
              id="tier"
              name="tier"
              defaultValue={values.tier ?? "GROWTH"}
              className="field"
            >
              {ACCOUNT_TIERS.map((tier) => (
                <option key={tier.value} value={tier.value}>
                  {tier.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mrr" className="label mb-1.5 block">
              MRR (USD)
            </label>
            <input
              id="mrr"
              name="mrr"
              type="number"
              min={0}
              step={100}
              defaultValue={values.mrr ?? 0}
              className="field"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="ownerId" className="label mb-1.5 block">
              Account owner
            </label>
            <select
              id="ownerId"
              name="ownerId"
              defaultValue={values.ownerId ?? ""}
              className="field"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Where the work lives"
          subtitle="These links turn the brand page into a hub instead of a place to re-type URLs."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="githubRepo" className="label mb-1.5 block">
              GitHub repo
            </label>
            <input
              id="githubRepo"
              name="githubRepo"
              defaultValue={values.githubRepo ?? ""}
              placeholder="owner/repo"
              className="field font-mono !text-[12.5px]"
            />
          </div>

          <div>
            <label htmlFor="githubPath" className="label mb-1.5 block">
              Content system path
            </label>
            <input
              id="githubPath"
              name="githubPath"
              defaultValue={values.githubPath ?? "/content-system"}
              placeholder="/content-system"
              className="field font-mono !text-[12.5px]"
            />
          </div>

          <div>
            <label htmlFor="driveFolderUrl" className="label mb-1.5 block">
              Drive folder
            </label>
            <input
              id="driveFolderUrl"
              name="driveFolderUrl"
              type="url"
              defaultValue={values.driveFolderUrl ?? ""}
              placeholder="https://drive.google.com/…"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="jockeyWorkspace" className="label mb-1.5 block">
              Jockey workspace
            </label>
            <input
              id="jockeyWorkspace"
              name="jockeyWorkspace"
              defaultValue={values.jockeyWorkspace ?? ""}
              placeholder="nao"
              className="field font-mono !text-[12.5px]"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="figmaFileUrl" className="label mb-1.5 block">
              Figma file
            </label>
            <input
              id="figmaFileUrl"
              name="figmaFileUrl"
              type="url"
              defaultValue={values.figmaFileUrl ?? ""}
              placeholder="https://figma.com/file/…"
              className="field"
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2">
        <Submit label={submitLabel} />
        <Link href={cancelHref} className="btn btn-ghost focusable">
          Cancel
        </Link>
      </div>
    </form>
  );
}
