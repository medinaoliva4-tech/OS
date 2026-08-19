"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changeOwnPassword, type PasswordState } from "@/app/actions/team";
import { Icon } from "@/components/ui/Icon";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable" disabled={pending}>
      {pending ? "Updating…" : "Update password"}
    </button>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState<PasswordState, FormData>(
    changeOwnPassword,
    {},
  );

  return (
    <form action={formAction} className="max-w-sm space-y-3">
      <div>
        <label htmlFor="currentPassword" className="label mb-1.5 block">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="field"
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="label mb-1.5 block">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className="field"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label mb-1.5 block">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className="field"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[9px] px-3 py-2 text-[12.5px]"
          style={{
            background: "color-mix(in oklab, var(--color-danger) 12%, transparent)",
            color: "var(--color-danger)",
          }}
        >
          <Icon name="alert" size={15} className="mt-px" />
          {state.error}
        </p>
      )}

      {state.ok && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-[9px] px-3 py-2 text-[12.5px]"
          style={{
            background: "color-mix(in oklab, var(--color-ok) 12%, transparent)",
            color: "var(--color-ok)",
          }}
        >
          <Icon name="check" size={15} className="mt-px" />
          {state.ok}
        </p>
      )}

      <Submit />
    </form>
  );
}
