"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createApiToken, revokeApiToken, type ApiTokenState } from "@/app/actions/api-tokens";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/Card";

export type ApiTokenData = {
  id: string;
  name: string;
  last4: string;
  createdAt: Date;
  lastUsedAt: Date | null;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable !py-1 !text-[12px]" disabled={pending}>
      {pending ? "Generating…" : "Generate token"}
    </button>
  );
}

function CreateForm({ mcpUrl }: { mcpUrl: string }) {
  const [state, formAction] = useActionState<ApiTokenState, FormData>(createApiToken, {});
  const [copied, setCopied] = useState(false);

  const connectorUrl = state.token ? `${mcpUrl}?token=${state.token}` : null;

  return (
    <div className="space-y-3">
      {!state.token && (
        <form action={formAction} className="flex items-center gap-2">
          <input
            name="name"
            required
            autoFocus
            placeholder='What&apos;s this for? (e.g. "My laptop — Claude")'
            className="field !text-[12px]"
          />
          <Submit />
        </form>
      )}

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[9px] px-3 py-2 text-[12.5px]"
          style={{ background: "color-mix(in oklab, var(--color-danger) 12%, transparent)", color: "var(--color-danger)" }}
        >
          <Icon name="alert" size={15} className="mt-px" />
          {state.error}
        </p>
      )}

      {connectorUrl && (
        <div
          className="space-y-2 rounded-[10px] p-3 text-[12.5px]"
          style={{ background: "color-mix(in oklab, var(--color-ok) 10%, transparent)" }}
        >
          <p className="flex items-start gap-2 font-medium" style={{ color: "var(--color-ok)" }}>
            <Icon name="check" size={15} className="mt-px" />
            Copy this now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code
              className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-[8px] px-2.5 py-1.5 font-mono text-[11px]"
              style={{ background: "var(--bg-overlay)" }}
            >
              {connectorUrl}
            </code>
            <button
              type="button"
              className="btn btn-ghost focusable shrink-0 !py-1 !text-[11px]"
              onClick={() => {
                navigator.clipboard.writeText(connectorUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Copied" : "Copy URL"}
            </button>
          </div>
          <p className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
            For clients that take a raw bearer token or header (Claude Code, Codex, curl…),
            paste this whole URL as the MCP server address. For Claude.ai or ChatGPT&apos;s
            custom connector, you don&apos;t need this — just add{" "}
            <code className="font-mono">{mcpUrl}</code> and sign in with your Inherent OS
            account when prompted; they only support OAuth, and this OS speaks it.
          </p>
        </div>
      )}
    </div>
  );
}

function TokenList({ tokens }: { tokens: ApiTokenData[] }) {
  const [, formAction, pending] = useActionState<ApiTokenState, FormData>(revokeApiToken, {});

  if (tokens.length === 0) {
    return <EmptyState title="No tokens yet" hint="Generate one below to connect your own Claude or ChatGPT." />;
  }

  return (
    <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
      {tokens.map((token) => (
        <li key={token.id} className="flex items-center justify-between gap-2 py-2">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-medium">{token.name}</span>
            <span className="block font-mono text-[11px]" style={{ color: "var(--text-faint)" }}>
              ...{token.last4} · created {formatDate(token.createdAt)}
              {token.lastUsedAt ? ` · last used ${formatDate(token.lastUsedAt)}` : " · never used"}
            </span>
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm(`Revoke "${token.name}"? Anything using it will stop working immediately.`)) {
                const fd = new FormData();
                fd.set("id", token.id);
                formAction(fd);
              }
            }}
            className="btn btn-quiet focusable shrink-0 !px-1.5 !py-1 !text-[11px]"
            aria-label={`Revoke ${token.name}`}
          >
            Revoke
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ApiTokensCard({ tokens, mcpUrl }: { tokens: ApiTokenData[]; mcpUrl: string }) {
  return (
    <div className="space-y-4">
      <TokenList tokens={tokens} />
      <div className="border-t pt-3" style={{ borderColor: "var(--line)" }}>
        <CreateForm mcpUrl={mcpUrl} />
      </div>
    </div>
  );
}
