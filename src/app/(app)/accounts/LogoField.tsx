"use client";

import { useRef, useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";

/** Kept well under the Server Action body limit and Postgres row comfort. */
const MAX_BYTES = 512 * 1024;
const ACCEPTED = ["image/svg+xml", "image/png", "image/jpeg", "image/webp"];

/**
 * Brand logo picker for onboarding.
 *
 * The file is read in the browser and submitted as a data URI in a hidden
 * field, so the whole thing rides along with the normal form post — no upload
 * endpoint, no object storage, nothing to configure before a brand can be
 * onboarded with its real logo.
 */
export function LogoField({
  name,
  brandHex,
  defaultValue,
  brandName,
}: {
  name: string;
  brandHex: string;
  defaultValue?: string | null;
  brandName?: string;
}) {
  const [dataUri, setDataUri] = useState<string | null>(defaultValue ?? null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use an SVG, PNG, JPG or WebP file.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `That file is ${Math.round(file.size / 1024)}KB. Keep it under ${MAX_BYTES / 1024}KB.`,
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setError("Could not read that file.");
    reader.onload = () => setDataUri(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <p className="label mb-1.5">Brand logo</p>

      <div className="flex flex-wrap items-center gap-3">
        <BrandLogo
          name={brandName || "Brand"}
          hex={brandHex}
          logoUrl={dataUri}
          size={52}
          radius={11}
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn btn-ghost focusable"
          >
            <Icon name="plus" size={14} />
            {dataUri ? "Replace" : "Upload logo"}
          </button>

          {dataUri && (
            <button
              type="button"
              onClick={() => {
                setDataUri(null);
                setError(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="btn btn-quiet focusable"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={onPick}
        className="sr-only"
        aria-label="Choose a brand logo file"
      />
      {/* What actually gets submitted. */}
      <input type="hidden" name={name} value={dataUri ?? ""} />

      <p className="mt-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
        SVG, PNG, JPG or WebP, up to {MAX_BYTES / 1024}KB. A square, transparent
        mark reads best. Falls back to the brand&rsquo;s initials if you skip it.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-[11.5px]"
          style={{ color: "var(--color-danger)" }}
        >
          <Icon name="alert" size={13} className="mt-px" />
          {error}
        </p>
      )}
    </div>
  );
}
