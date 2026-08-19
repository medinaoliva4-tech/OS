import { brand } from "@/lib/brand";

/**
 * The Inherent mark. Drawn rather than imported so the OS ships without a
 * binary asset; swap `brand.logo.src` to use the real wordmark file instead.
 *
 * The glyph is an "I" cut from a rounded square — the letterform is the
 * negative space, which is the idea of the name: the form is inherent to
 * the block, not applied on top of it.
 */
export function LogoMark({ size = 26 }: { size?: number }) {
  if (brand.logo.src) {
    return (
      // A wordmark is a tiny, often-SVG asset that the image optimizer cannot
      // improve, and next/image would force a format guess on a file the team
      // drops in later. A plain <img> is the right call here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.logo.src}
        alt={brand.logo.alt}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label={brand.logo.alt}
      className="shrink-0"
    >
      <defs>
        <linearGradient id="inherent-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-soft)" />
        </linearGradient>
      </defs>
      <path
        d="M6 2h20a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z
           M11 8h10v3.4h-3.15v9.2H21V24H11v-3.4h3.15v-9.2H11V8Z"
        fill="url(#inherent-mark)"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 min-w-0">
      <LogoMark size={26} />
      {!compact && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate text-[13px] font-semibold tracking-tight">
            {brand.productName}
          </span>
          <span
            className="mt-1 truncate text-[10px] tracking-wide"
            style={{ color: "var(--text-faint)" }}
          >
            {brand.domain}
          </span>
        </span>
      )}
    </span>
  );
}
