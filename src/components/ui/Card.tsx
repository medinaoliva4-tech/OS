export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`surface ${padded ? "p-5" : ""} ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[10px] border border-dashed px-6 py-10 text-center"
      style={{ borderColor: "var(--line-strong)" }}
    >
      <p className="text-sm font-medium">{title}</p>
      {hint && (
        <p className="mt-1 max-w-sm text-xs" style={{ color: "var(--text-faint)" }}>
          {hint}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Headline number with a label. The dashboard is built out of these. */
export function Stat({
  label,
  value,
  sub,
  tone,
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="label">{label}</p>
      <p
        className="mt-2 text-2xl font-semibold tracking-tight tabular-nums"
        style={tone ? { color: tone } : undefined}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
          {sub}
        </p>
      )}
    </>
  );

  const className =
    "surface block p-4 transition-colors" + (href ? " hover:bg-[var(--bg-hover)]" : "");

  if (href) {
    return (
      <a href={href} className={`${className} focusable`}>
        {body}
      </a>
    );
  }
  return <div className={className}>{body}</div>;
}

/**
 * Thin horizontal progress meter.
 *
 * `inFlight` draws a translucent segment after the solid one. Without it, a
 * brand where everything is started but nothing is finished reads as a
 * completely empty bar — which is both discouraging and untrue.
 */
export function Meter({
  value,
  total,
  inFlight = 0,
  tone = "var(--accent)",
  height = 6,
}: {
  value: number;
  total: number;
  inFlight?: number;
  tone?: string;
  height?: number;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const flightPct =
    total > 0 ? Math.min(100 - pct, Math.round((inFlight / total) * 100)) : 0;

  return (
    <div
      className="flex w-full overflow-hidden rounded-full"
      style={{ background: "var(--bg-overlay)", height }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={
        inFlight > 0
          ? `${value} of ${total} done, ${inFlight} in progress`
          : `${value} of ${total} done`
      }
    >
      <div
        className="h-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: tone }}
      />
      {flightPct > 0 && (
        <div
          className="h-full transition-[width] duration-500"
          style={{
            width: `${flightPct}%`,
            background: `color-mix(in oklab, ${tone} 38%, transparent)`,
          }}
        />
      )}
    </div>
  );
}
