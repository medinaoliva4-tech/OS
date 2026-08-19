"use client";

import { useTransition } from "react";
import Link from "next/link";
import { setAssetStage, deleteAsset } from "@/app/actions/content";
import { ASSET_KINDS, ASSET_SOURCES, ASSET_STAGES, option } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { BrandDot, Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";

export type AssetRowData = {
  id: string;
  name: string;
  kind: string;
  stage: string;
  source: string;
  url: string | null;
  path: string | null;
  createdAt: Date;
  account: { name: string; slug: string; brandHex: string };
};

export function AssetRow({ asset }: { asset: AssetRowData }) {
  const [pending, startTransition] = useTransition();

  const kind = option(ASSET_KINDS, asset.kind);
  const source = option(ASSET_SOURCES, asset.source);

  return (
    <tr className="row-hover transition-colors" style={{ opacity: pending ? 0.5 : 1 }}>
      <td className="py-2.5 pl-5 pr-3">
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium">{asset.name}</p>
          {asset.path && (
            <p
              className="truncate font-mono text-[10.5px]"
              style={{ color: "var(--text-faint)" }}
            >
              {asset.path}
            </p>
          )}
        </div>
      </td>

      <td className="py-2.5 pr-3">
        <Link
          href={`/accounts/${asset.account.slug}`}
          className="link-quiet inline-flex items-center gap-1.5 text-[12.5px]"
        >
          <BrandDot hex={asset.account.brandHex} size={8} />
          {asset.account.name}
        </Link>
      </td>

      <td className="py-2.5 pr-3">
        <Chip tone={kind.tone}>{kind.label}</Chip>
      </td>

      <td className="py-2.5 pr-3">
        <Chip tone={source.tone}>{source.label}</Chip>
      </td>

      <td className="py-2.5 pr-3">
        <label className="sr-only" htmlFor={`asset-stage-${asset.id}`}>
          Stage for {asset.name}
        </label>
        <select
          id={`asset-stage-${asset.id}`}
          value={asset.stage}
          onChange={(event) =>
            startTransition(() => setAssetStage(asset.id, event.target.value))
          }
          disabled={pending}
          className="field !w-auto !py-1 !text-[11px]"
        >
          {ASSET_STAGES.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </select>
      </td>

      <td
        className="py-2.5 pr-3 text-[11px] tabular-nums"
        style={{ color: "var(--text-faint)" }}
      >
        {formatDate(asset.createdAt)}
      </td>

      <td className="py-2.5 pr-5 text-right">
        <div className="flex items-center justify-end gap-1">
          {asset.url && (
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-quiet focusable"
              aria-label={`Open ${asset.name}`}
            >
              <Icon name="external" size={14} />
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove “${asset.name}” from the library?`)) {
                startTransition(() => deleteAsset(asset.id));
              }
            }}
            disabled={pending}
            className="btn btn-quiet focusable"
            aria-label={`Remove ${asset.name}`}
          >
            ×
          </button>
        </div>
      </td>
    </tr>
  );
}
