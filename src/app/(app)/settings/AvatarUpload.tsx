"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateOwnAvatar, type AvatarState } from "@/app/actions/team";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

const MAX_BYTES = 512 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-primary focusable"
      disabled={pending || disabled}
    >
      {pending ? "Saving…" : "Save photo"}
    </button>
  );
}

export function AvatarUpload({
  name,
  hue,
  currentUrl,
}: {
  name: string;
  hue: number;
  currentUrl: string | null;
}) {
  const [state, formAction] = useActionState<AvatarState, FormData>(
    updateOwnAvatar,
    {},
  );
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [pickError, setPickError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hiddenValueRef = useRef<HTMLInputElement>(null);

  const onPick = async (file: File | undefined) => {
    setPickError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setPickError("Use a PNG, JPEG, or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setPickError("Keep it under 512KB.");
      return;
    }
    const dataUrl = await readAsDataUrl(file);
    setPreview(dataUrl);
    if (hiddenValueRef.current) hiddenValueRef.current.value = dataUrl;
  };

  return (
    <form action={formAction} className="flex items-center gap-4">
      <input type="hidden" name="avatarUrl" ref={hiddenValueRef} defaultValue={currentUrl ?? ""} />
      <Avatar name={name} hue={hue} imageUrl={preview} size={56} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn btn-ghost focusable"
          >
            <Icon name="edit" size={14} />
            Choose photo
          </button>
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                if (hiddenValueRef.current) hiddenValueRef.current.value = "";
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="btn btn-quiet focusable"
            >
              Remove
            </button>
          )}
          <Submit disabled={preview === currentUrl} />
        </div>

        {pickError && (
          <p className="text-[12px]" style={{ color: "var(--color-danger)" }}>
            {pickError}
          </p>
        )}
        {state.error && (
          <p className="text-[12px]" style={{ color: "var(--color-danger)" }}>
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-[12px]" style={{ color: "var(--color-ok)" }}>
            {state.ok}
          </p>
        )}
        <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          PNG, JPEG, or WebP, under 512KB.
        </p>
      </div>
    </form>
  );
}
