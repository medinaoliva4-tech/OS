/**
 * Inherent Global — brand tokens.
 *
 * These are the REAL brand values, taken from the official brand sheet
 * ("LOGO VERSIONS", Group 58). The five colours below are the exact hexes
 * sampled from that artwork:
 *
 *   #232323  charcoal      the dark ground the logo is shown on
 *   #E3DDD1  cream         the light surface, and the logo colour on dark
 *   #372905  deep olive    the darkest brand swatch
 *   #60563E  muted olive   the mid brand swatch
 *   #D9D9D9  paper grey    the sheet's own neutral ground
 *
 * The UI scales derived from them live in `src/app/globals.css`. This file is
 * still the single place to change the brand: update these values, mirror them
 * in the `@theme` block there, and nothing else in the codebase needs touching.
 */

export const brand = {
  name: "Inherent",
  fullName: "Inherent Global",
  productName: "Inherent OS",
  domain: "inherentglobal.com",
  tagline: "The operating system for how we build brands.",

  /** Exact swatches from the brand sheet. */
  palette: {
    charcoal: "#232323",
    cream: "#E3DDD1",
    deepOlive: "#372905",
    mutedOlive: "#60563E",
    paperGrey: "#D9D9D9",
  },

  /** Dark is the brand's home — the sheet leads with cream on charcoal. */
  dark: {
    ink: "#1C1C1C",
    inkRaised: "#232323",
    inkOverlay: "#2A2A29",
    line: "#34322C",
    lineStrong: "#47443C",

    paper: "#E3DDD1",
    paperMuted: "#A9A395",
    paperFaint: "#7B7668",

    /** A lightened member of the olive family, legible on charcoal. */
    accent: "#BFB18A",
    accentSoft: "#D3C7A4",
    accentDeep: "#60563E",
  },

  light: {
    ink: "#EDEAE3",
    inkRaised: "#F7F5F0",
    inkOverlay: "#E3DDD1",
    line: "#D5CFC0",
    lineStrong: "#BDB6A4",

    paper: "#232323",
    paperMuted: "#5C5748",
    paperFaint: "#857F6F",

    /** On cream, the muted olive is used at full strength. */
    accent: "#60563E",
    accentSoft: "#372905",
  },

  /**
   * Status colours, warmed to sit with the earthy palette while staying
   * distinguishable from one another at chip size.
   */
  status: {
    success: "#8FA76B",
    warn: "#D9A441",
    danger: "#C96A5A",
    info: "#7E9BB5",
    progress: "#9B8AA8",
  },

  font: {
    /** The wordmark is a high-contrast serif; body copy stays a clean sans. */
    sans: "Inter",
    serif: "Instrument Serif",
    mono: "JetBrains Mono",
  },
} as const;

/**
 * Palette for CLIENT brand chips (NAO, Akai, …). These are the clients' own
 * colours, deliberately not Inherent's — a brand should look like itself in
 * the OS. Each brand can override with its own hex.
 */
export const BRAND_SWATCHES = [
  "#5EEAD4",
  "#F59E0B",
  "#8FA76B",
  "#C96A5A",
  "#7E9BB5",
  "#9B8AA8",
  "#2DD4BF",
  "#BFB18A",
] as const;

export function swatchFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return BRAND_SWATCHES[hash % BRAND_SWATCHES.length];
}
