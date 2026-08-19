import { initials } from "@/lib/format";

export function Avatar({
  name,
  hue = 210,
  size = 28,
  title,
}: {
  name: string;
  hue?: number;
  size?: number;
  title?: string;
}) {
  return (
    <span
      title={title ?? name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.38),
        background: `oklch(0.42 0.11 ${hue})`,
        color: `oklch(0.96 0.02 ${hue})`,
        border: `1px solid oklch(0.55 0.12 ${hue} / 0.5)`,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  people,
  max = 3,
}: {
  people: { name: string; avatarHue?: number }[];
  max?: number;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;

  return (
    <span className="flex items-center -space-x-1.5">
      {shown.map((person, i) => (
        <span key={`${person.name}-${i}`} className="ring-2 rounded-full" style={{ boxShadow: "0 0 0 2px var(--bg-raised)" }}>
          <Avatar name={person.name} hue={person.avatarHue ?? 210} size={24} />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="inline-flex h-6 items-center rounded-full px-1.5 text-[10px] font-medium"
          style={{
            background: "var(--bg-overlay)",
            color: "var(--text-muted)",
            boxShadow: "0 0 0 2px var(--bg-raised)",
          }}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
