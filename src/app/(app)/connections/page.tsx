import { db } from "@/lib/db";
import { CONTENT_PIPELINE } from "@/lib/pipeline-blueprint";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, Stat } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import {
  IntegrationCard,
  type IntegrationCardData,
} from "./IntegrationCard";

export const metadata = { title: "Connections" };
export const dynamic = "force-dynamic";

export default async function ConnectionsPage() {
  const integrations = await db.integration.findMany({
    include: {
      syncEvents: { orderBy: { createdAt: "desc" }, take: 4 },
    },
    orderBy: { position: "asc" },
  });

  // Read credential presence on the server — never send the value itself.
  const rows: IntegrationCardData[] = integrations.map((integration) => ({
    ...integration,
    credentialPresent: integration.envKey
      ? Boolean(process.env[integration.envKey])
      : false,
    events: integration.syncEvents,
  }));

  const connected = rows.filter((r) => r.status === "CONNECTED").length;
  const needsSetup = rows.filter((r) => r.status === "NEEDS_SETUP").length;
  const broken = rows.filter((r) =>
    ["ERROR", "DEGRADED"].includes(r.status),
  ).length;

  const byKey = new Map(rows.map((row) => [row.key, row]));

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Connections"
        description="Every tool the content system runs through, and whether its pipe is actually carrying anything. Credential state is read live from the server environment."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Tools" value={rows.length} sub="in the chain" />
        <Stat
          label="Connected"
          value={connected}
          tone={connected > 0 ? "var(--color-ok)" : undefined}
        />
        <Stat
          label="Needs setup"
          value={needsSetup}
          tone={needsSetup > 0 ? "var(--color-warn)" : undefined}
          sub={needsSetup > 0 ? "Add the env var, then re-check" : "None"}
        />
        <Stat
          label="Failing"
          value={broken}
          tone={broken > 0 ? "var(--color-danger)" : "var(--color-ok)"}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* The chain, drawn as a chain                                        */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-6">
        <CardHeader
          title="The chain"
          subtitle="How a shoot becomes a scheduled post. Each hop names the tool that owns it."
        />
        <ol className="flex flex-wrap items-stretch gap-2">
          {CONTENT_PIPELINE.map((step, index) => {
            const tool = step.toolKey ? byKey.get(step.toolKey) : undefined;
            const ok = tool?.status === "CONNECTED";
            const failing =
              tool && ["ERROR", "DEGRADED"].includes(tool.status);

            return (
              <li key={step.key} className="flex items-stretch gap-2">
                <div
                  className="surface-flat flex min-w-[132px] flex-col justify-between gap-2 p-2.5"
                  style={{
                    borderColor: ok
                      ? "color-mix(in oklab, var(--color-ok) 40%, transparent)"
                      : failing
                        ? "color-mix(in oklab, var(--color-danger) 40%, transparent)"
                        : undefined,
                  }}
                >
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-0.5 text-[11.5px] font-medium leading-snug">
                      {step.label}
                    </p>
                  </div>
                  {tool && (
                    <Chip
                      tone={ok ? "success" : failing ? "danger" : "warn"}
                      dot
                    >
                      {tool.name}
                    </Chip>
                  )}
                </div>

                {index < CONTENT_PIPELINE.length - 1 && (
                  <span
                    className="flex items-center"
                    style={{ color: "var(--text-faint)" }}
                    aria-hidden
                  >
                    <Icon name="chevronRight" size={13} />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
          Per-brand progress through these same nine hops lives on each brand
          page — this view is about the tools, that one is about the work.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Connecting a tool for real"
          subtitle="What “connected” means here, and how to get there."
        />
        <ol
          className="space-y-2.5 text-[12.5px] leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          <li>
            <strong style={{ color: "var(--text)" }}>1. Set the env var.</strong>{" "}
            Each card names the variable it needs. Add it to{" "}
            <code className="font-mono text-[11.5px]">.env</code> — the card
            reads the server environment directly, so no secret is ever stored
            in the database or sent to the browser.
          </li>
          <li>
            <strong style={{ color: "var(--text)" }}>2. Restart and check.</strong>{" "}
            Restart the app so the new variable is visible, then press{" "}
            <em>Check now</em>. The status flips itself and the result is written
            to the check log.
          </li>
          <li>
            <strong style={{ color: "var(--text)" }}>3. Store non-secret config.</strong>{" "}
            Workspace ids, folder names and the like go in the JSON config box.
            Secrets never belong there.
          </li>
        </ol>
      </Card>
    </>
  );
}
