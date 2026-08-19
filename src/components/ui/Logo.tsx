import { brand } from "@/lib/brand";
import { InherentLockup, InherentMark } from "./brand/InherentMarks";

/**
 * The Inherent mark, straight from the brand sheet. It inherits `currentColor`
 * so it renders cream on charcoal in dark mode and charcoal on cream in light
 * — the two lockups the brand sheet actually specifies.
 */
export function LogoMark({ size = 26 }: { size?: number }) {
  return <InherentMark size={size} title={brand.fullName} />;
}

/**
 * Sidebar identity: the horizontal lockup, with the product name underneath.
 * The lockup carries the brand; "OS" is the product built on top of it.
 */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  if (compact) return <InherentMark size={24} title={brand.fullName} />;

  return (
    <span className="flex min-w-0 flex-col gap-1.5">
      <InherentLockup height={19} />
      <span
        className="truncate text-[10px] font-medium tracking-[0.16em] uppercase"
        style={{ color: "var(--text-faint)" }}
      >
        Operating System
      </span>
    </span>
  );
}
