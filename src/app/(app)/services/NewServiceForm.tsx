"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createService } from "@/app/actions/services";
import { BRAND_SWATCHES } from "@/lib/brand";
import { Icon } from "@/components/ui/Icon";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable" disabled={pending}>
      {pending ? "Adding…" : "Add service"}
    </button>
  );
}

export function NewServiceForm() {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState<string>(BRAND_SWATCHES[0]);
  const ref = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-primary focusable"
      >
        <Icon name="plus" size={15} />
        New service
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await createService(formData);
        ref.current?.reset();
        setOpen(false);
      }}
      className="surface w-full max-w-lg space-y-3 p-4"
    >
      <div>
        <label htmlFor="service-name" className="label mb-1.5 block">
          Service
        </label>
        <input
          id="service-name"
          name="name"
          required
          autoFocus
          placeholder="Graphic Design"
          className="field"
        />
      </div>

      <div>
        <label htmlFor="service-description" className="label mb-1.5 block">
          What it covers
        </label>
        <textarea
          id="service-description"
          name="description"
          rows={2}
          placeholder="Brand systems, decks, print — the design work that isn't a content shoot."
          className="field"
        />
      </div>

      <fieldset>
        <legend className="label mb-2">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {BRAND_SWATCHES.map((hex) => (
            <label
              key={hex}
              className="focusable relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] transition-transform hover:scale-110"
              style={{ background: hex }}
            >
              <input
                type="radio"
                name="color"
                value={hex}
                checked={color === hex}
                onChange={() => setColor(hex)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="absolute -inset-0.5 rounded-[9px] ring-2 ring-transparent peer-checked:ring-current"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <Submit />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-ghost focusable"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
