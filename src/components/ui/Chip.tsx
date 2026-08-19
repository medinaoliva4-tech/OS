import type { Tone } from "@/lib/domain";

const TONE_STYLE: Record<Tone, { bg: string; fg: string; border: string }> = {
  neutral: {
    bg: "color-mix(in oklab, var(--text-faint) 14%, transparent)",
    fg: "var(--text-muted)",
    border: "color-mix(in oklab, var(--text-faint) 26%, transparent)",
  },
  info: {
    bg: "color-mix(in oklab, var(--color-info) 15%, transparent)",
    fg: "var(--color-info)",
    border: "color-mix(in oklab, var(--color-info) 32%, transparent)",
  },
  progress: {
    bg: "color-mix(in oklab, var(--color-progress) 15%, transparent)",
    fg: "var(--color-progress)",
    border: "color-mix(in oklab, var(--color-progress) 32%, transparent)",
  },
  warn: {
    bg: "color-mix(in oklab, var(--color-warn) 15%, transparent)",
    fg: "var(--color-warn)",
    border: "color-mix(in oklab, var(--color-warn) 32%, transparent)",
  },
  danger: {
    bg: "color-mix(in oklab, var(--color-danger) 15%, transparent)",
    fg: "var(--color-danger)",
    border: "color-mix(in oklab, var(--color-danger) 32%, transparent)",
  },
  success: {
    bg: "color-mix(in oklab, var(--color-ok) 15%, transparent)",
    fg: "var(--color-ok)",
    border: "color-mix(in oklab, var(--color-ok) 32%, transparent)",
  },
  accent: {
    bg: "color-mix(in oklab, var(--accent) 16%, transparent)",
    fg: "var(--accent)",
    border: "color-mix(in oklab, var(--accent) 34%, transparent)",
  },
};

export function Chip({
  tone = "neutral",
  children,
  dot = false,
  title,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  title?: string;
}) {
  const style = TONE_STYLE[tone];
  return (
    <span
      className="chip"
      title={title}
      style={{
        background: style.bg,
        color: style.fg,
        borderColor: style.border,
      }}
    >
      {dot && (
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: style.fg }}
        />
      )}
      {children}
    </span>
  );
}

/** Small square colour swatch used for brand identity across lists. */
export function BrandDot({ hex, size = 10 }: { hex: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-[3px]"
      style={{ background: hex, width: size, height: size }}
    />
  );
}
