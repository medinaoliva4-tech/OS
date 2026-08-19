/* eslint-disable @next/next/no-img-element */

/**
 * A client brand's identity tile.
 *
 * Uses the brand's own logo when one has been uploaded, and falls back to an
 * initials tile in the brand's colour. Logos are stored as data URIs, so
 * `next/image` would only add an optimizer hop for bytes we already hold —
 * a plain <img> is correct here.
 */
export function BrandLogo({
  name,
  hex,
  logoUrl,
  size = 36,
  radius = 9,
}: {
  name: string;
  hex: string;
  logoUrl?: string | null;
  size?: number;
  radius?: number;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: `color-mix(in oklab, ${hex} 12%, transparent)`,
          border: `1px solid color-mix(in oklab, ${hex} 28%, transparent)`,
          padding: Math.max(2, size * 0.1),
        }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center font-bold"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: Math.max(10, size * 0.36),
        background: `color-mix(in oklab, ${hex} 18%, transparent)`,
        color: hex,
        border: `1px solid color-mix(in oklab, ${hex} 34%, transparent)`,
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
