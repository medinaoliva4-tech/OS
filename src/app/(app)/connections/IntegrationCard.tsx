"use client";

import { useState, useTransition } from "react";
import {
  recordSync,
  setIntegrationStatus,
  updateIntegrationConfig,
} from "@/app/actions/integrations";
import {
  INTEGRATION_CATEGORIES,
  INTEGRATION_STATUSES,
  option,
} from "@/lib/domain";
import { formatRelative } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";

export type IntegrationCardData = {
  id: string;
  key: string;
  name: string;
  category: string;
  status: string;
  role: string | null;
  summary: string | null;
  docsUrl: string | null;
  envKey: string | null;
  config: string;
  lastSyncAt: Date | null;
  lastError: string | null;
  /** Whether the env var this tool needs is actually present on the server. */
  credentialPresent: boolean;
  events: { id: string; level: string; message: string; createdAt: Date }[];
};

export function IntegrationCard({
  integration,
}: {
  integration: IntegrationCardData;
}) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const status = option(INTEGRATION_STATUSES, integration.status);
  const category = option(INTEGRATION_CATEGORIES, integration.category);

  return (
    <Card className="flex h-full flex-col" >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{integration.name}</h3>
            <Chip tone={category.tone}>{category.label}</Chip>
          </div>
          <p
            className="mt-0.5 font-mono text-[10.5px]"
            style={{ color: "var(--text-faint)" }}
          >
            {integration.key}
          </p>
        </div>
        <Chip tone={status.tone} dot>
          {status.label}
        </Chip>
      </div>

      {integration.role && (
        <p
          className="mt-3 text-[12px] leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {integration.role}
        </p>
      )}

      {/* Credential state — the honest answer, read from the environment. */}
      {integration.envKey && (
        <div
          className="mt-3 flex items-center gap-2 rounded-[9px] px-2.5 py-1.5 text-[11px]"
          style={{
            background: integration.credentialPresent
              ? "color-mix(in oklab, var(--color-ok) 10%, transparent)"
              : "color-mix(in oklab, var(--color-warn) 10%, transparent)",
            color: integration.credentialPresent
              ? "var(--color-ok)"
              : "var(--color-warn)",
          }}
        >
          <Icon
            name={integration.credentialPresent ? "check" : "alert"}
            size={13}
          />
          <span className="font-mono">{integration.envKey}</span>
          <span>{integration.credentialPresent ? "is set" : "is not set"}</span>
        </div>
      )}

      {integration.lastError && (
        <p
          className="mt-2 rounded-[9px] px-2.5 py-1.5 text-[11px] leading-snug"
          style={{
            background: "color-mix(in oklab, var(--color-danger) 10%, transparent)",
            color: "var(--color-danger)",
          }}
        >
          {integration.lastError}
        </p>
      )}

      <p
        className="mt-3 text-[11px]"
        style={{ color: "var(--text-faint)" }}
        // Relative time ticks between SSR and hydration by design.
        suppressHydrationWarning
      >
        {integration.lastSyncAt
          ? `Last checked ${formatRelative(integration.lastSyncAt)}`
          : "Never checked"}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        <button
          type="button"
          onClick={() => startTransition(() => recordSync(integration.id))}
          disabled={pending}
          className="btn btn-ghost focusable !py-1 !text-[11.5px]"
        >
          {pending ? "Checking…" : "Check now"}
        </button>

        <label className="sr-only" htmlFor={`status-${integration.id}`}>
          Status for {integration.name}
        </label>
        <select
          id={`status-${integration.id}`}
          value={integration.status}
          onChange={(event) =>
            startTransition(() =>
              setIntegrationStatus(integration.id, event.target.value),
            )
          }
          disabled={pending}
          className="field !w-auto !py-1 !text-[11px]"
        >
          {INTEGRATION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="btn btn-quiet focusable !py-1 !text-[11.5px]"
          aria-expanded={expanded}
        >
          {expanded ? "Hide" : "Configure"}
          <Icon name={expanded ? "chevronDown" : "chevronRight"} size={12} />
        </button>

        {integration.docsUrl && (
          <a
            href={integration.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-quiet focusable !py-1 !text-[11.5px]"
          >
            <Icon name="external" size={12} />
          </a>
        )}
      </div>

      {expanded && (
        <div
          className="mt-4 space-y-3 border-t pt-4"
          style={{ borderColor: "var(--line)" }}
        >
          <form action={updateIntegrationConfig} className="space-y-2.5">
            <input type="hidden" name="id" value={integration.id} />

            <div>
              <label
                htmlFor={`summary-${integration.id}`}
                className="label mb-1.5 block"
              >
                Summary
              </label>
              <input
                id={`summary-${integration.id}`}
                name="summary"
                defaultValue={integration.summary ?? ""}
                className="field !text-[12px]"
              />
            </div>

            <div>
              <label
                htmlFor={`docs-${integration.id}`}
                className="label mb-1.5 block"
              >
                Link
              </label>
              <input
                id={`docs-${integration.id}`}
                name="docsUrl"
                type="url"
                defaultValue={integration.docsUrl ?? ""}
                placeholder="https://"
                className="field !text-[12px]"
              />
            </div>

            <div>
              <label
                htmlFor={`config-${integration.id}`}
                className="label mb-1.5 block"
              >
                Config <span className="normal-case opacity-60">(JSON, no secrets)</span>
              </label>
              <textarea
                id={`config-${integration.id}`}
                name="config"
                rows={3}
                defaultValue={integration.config}
                className="field font-mono !text-[11px]"
              />
            </div>

            <button type="submit" className="btn btn-primary focusable !py-1 !text-[11.5px]">
              Save
            </button>
          </form>

          {integration.events.length > 0 && (
            <div>
              <p className="label mb-2">Recent checks</p>
              <ul className="space-y-1.5">
                {integration.events.map((event) => (
                  <li key={event.id} className="flex items-start gap-2 text-[11px]">
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        background:
                          event.level === "ERROR"
                            ? "var(--color-danger)"
                            : event.level === "WARN"
                              ? "var(--color-warn)"
                              : "var(--color-ok)",
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block leading-snug">{event.message}</span>
                      <span
                        style={{ color: "var(--text-faint)" }}
                        suppressHydrationWarning
                      >
                        {formatRelative(event.createdAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
