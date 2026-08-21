import type { DbStatus } from "@/lib/db-health";
import { environmentSummary } from "@/lib/db-health";
import { InherentLockup } from "@/components/ui/brand/InherentMarks";
import { Icon } from "@/components/ui/Icon";

/**
 * Shown instead of a bare 500 when the OS cannot reach its database.
 *
 * A first deploy fails for one of two boring reasons — no connection string,
 * or a schema that was never migrated — and a generic error page sends people
 * hunting through logs for something the app already knows.
 */
export function SetupRequired({ status }: { status: Extract<DbStatus, { ok: false }> }) {
  const env = environmentSummary();

  const checks = [
    { label: "DATABASE_URL", ok: env.databaseUrl, hint: "pooled, port 6543" },
    { label: "DIRECT_URL", ok: env.directUrl, hint: "direct, port 5432" },
    { label: "AUTH_SECRET", ok: env.authSecret, hint: "a real random value" },
  ];

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-7 flex flex-col items-center text-center">
          <InherentLockup height={30} />
          <p
            className="mt-4 text-[11px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: "var(--text-faint)" }}
          >
            Setup required
          </p>
        </div>

        <div className="surface p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-start gap-2.5">
            <Icon name="alert" size={18} className="mt-0.5" />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold">{status.title}</h1>
              <p
                className="mt-1 text-[12.5px] leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {status.detail}
              </p>
            </div>
          </div>

          <div
            className="mt-5 border-t pt-4"
            style={{ borderColor: "var(--line)" }}
          >
            <p className="label mb-2.5">Environment</p>
            <ul className="space-y-1.5">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className="flex items-center gap-2 text-[12.5px]"
                >
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
                    style={{
                      background: check.ok
                        ? "color-mix(in oklab, var(--color-ok) 20%, transparent)"
                        : "color-mix(in oklab, var(--color-danger) 20%, transparent)",
                      color: check.ok ? "var(--color-ok)" : "var(--color-danger)",
                    }}
                  >
                    {check.ok ? "✓" : "✕"}
                  </span>
                  <span className="font-mono">{check.label}</span>
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {check.ok ? "set" : `missing — ${check.hint}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="mt-5 border-t pt-4"
            style={{ borderColor: "var(--line)" }}
          >
            <p className="label mb-2.5">What to do</p>
            <ol className="space-y-2">
              {status.fix.map((step, index) => (
                <li
                  key={index}
                  className="text-[12.5px] leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {step.startsWith("DATABASE_URL=") ? (
                    <code
                      className="block overflow-x-auto rounded-[7px] px-2.5 py-1.5 font-mono text-[11px]"
                      style={{ background: "var(--bg-overlay)", color: "var(--text)" }}
                    >
                      {step}
                    </code>
                  ) : (
                    step
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <p
          className="mt-5 text-center text-[11px]"
          style={{ color: "var(--text-faint)" }}
        >
          Machine-readable status at <code className="font-mono">/api/health</code>
        </p>
      </div>
    </main>
  );
}
