"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { addNote } from "@/app/actions/accounts";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-ghost focusable !py-1 !text-[11.5px]"
      disabled={pending}
    >
      {pending ? "Saving…" : "Add note"}
    </button>
  );
}

export function NoteComposer({ accountId }: { accountId: string }) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (formData) => {
        await addNote(formData);
        ref.current?.reset();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="entityType" value="Account" />
      <input type="hidden" name="entityId" value={accountId} />
      <label htmlFor="note-body" className="sr-only">
        Note
      </label>
      <textarea
        id="note-body"
        name="body"
        rows={2}
        required
        placeholder="Something worth remembering…"
        className="field !text-[12px]"
      />
      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
