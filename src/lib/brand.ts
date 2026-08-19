/**
 * Inherent Global — brand tokens.
 *
 * ---------------------------------------------------------------------------
 * SWAP POINT. This file is the single source of truth for the brand, and it is
 * the only file you need to touch to make the OS match inherentglobal.com
 * exactly. The palette below is an interpretation, not a scrape: the live site
 * was not reachable from the build environment, so these are placeholders
 * chosen to be quiet and premium.
 *
 * To make it exact: replace the hex values in `palette`, drop the real
 * wordmark into `public/`, and point `logo.src` at it. Nothing else in the
 * codebase hardcodes a brand colour.
 * ---------------------------------------------------------------------------
 */

export const brand = {
  name: "Inherent",
  fullName: "Inherent Global",
  productName: "Inherent OS",
  domain: "inherentglobal.com",
  tagline: "The operating system for how we build brands.",

  logo: {
    /** Set to a file in /public to replace the drawn mark, e.g. "/logo.svg". */
    src: null as string | null,
    alt: "Inherent Global",
  },

  palette: {
    /** Near-black canvas — the ground everything sits on. */
    ink: "#0B0C0E",
    inkRaised: "#131519",
    inkOverlay: "#191C21",
    line: "#24282F",
    lineStrong: "#333944",

    /** Warm off-white, not pure white — easier to read on dark. */
    paper: "#F4F3F1",
    paperMuted: "#A3A8B2",
    paperFaint: "#6B717C",

    /** Signal accent. */
    accent: "#8B8FF5",
    accentSoft: "#A9ADF8",
    accentDeep: "#5B60E0",

    success: "#4ADE80",
    warn: "#FBBF24",
    danger: "#F87171",
    info: "#60A5FA",
    progress: "#C084FC",
  },

  /** Light-mode counterparts. Same roles, inverted ground. */
  light: {
    ink: "#FBFBFA",
    inkRaised: "#FFFFFF",
    inkOverlay: "#F4F4F2",
    line: "#E4E4E0",
    lineStrong: "#CFCFC9",
    paper: "#14161A",
    paperMuted: "#5A606B",
    paperFaint: "#868C97",
  },

  font: {
    /** Google Fonts families loaded in the root layout. */
    sans: "Inter",
    mono: "JetBrains Mono",
  },
} as const;

/** Deterministic accent per brand chip when an account has no colour set. */
export const BRAND_SWATCHES = [
  "#8B8FF5",
  "#4ADE80",
  "#FBBF24",
  "#F87171",
  "#60A5FA",
  "#C084FC",
  "#2DD4BF",
  "#FB923C",
] as const;

export function swatchFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return BRAND_SWATCHES[hash % BRAND_SWATCHES.length];
}
