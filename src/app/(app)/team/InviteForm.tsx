"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { inviteUser, type TeamState } from "@/app/actions/team";
import { ROLES } from "@/lib/policy";
import { Icon } from "@/components/ui/Icon";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary focusable" disabled={pending}>
      {pending ? "Creating…" : "Create account"}
    </button>
  );
}

export function InviteForm({
  domain,
  canCreateOwner,
}: {
  domain: string;
  canCreateOwner: boolean;
}) {
  const [state, formAction] = useActionState<TeamState, FormData>(inviteUser, {});

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="invite-name" className="label mb-1.5 block">
            Full name
          </label>
          <input
            id="invite-name"
            name="name"
            required
            placeholder="Ana Torres"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="invite-email" className="label mb-1.5 block">
            Work email
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            // A courtesy hint only — the real gate is server-side.
            pattern={`[^@\\s]+@${domain.replace(/\./g, "\\.")}`}
            title={`Must be an @${domain} address`}
            placeholder={`name@${domain}`}
            className="field"
          />
        </div>

        <div>
          <label htmlFor="invite-title" className="label mb-1.5 block">
            Title
          </label>
          <input
            id="invite-title"
            name="title"
            placeholder="Content Lead"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="invite-role" className="label mb-1.5 block">
            Role
          </label>
          <select
            id="invite-role"
            name="role"
            defaultValue="MEMBER"
            className="field"
          >
            {ROLES.filter((role) => canCreateOwner || role !== "OWNER").map(
              (role) => (
                <option key={role} value={role}>
                  {role.charAt(0) + role.slice(1).toLowerCase()}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="invite-password" className="label mb-1.5 block">
            Temporary password
          </label>
          <input
            id="invite-password"
            name="password"
            type="text"
            required
            minLength={10}
            placeholder="At least 10 characters"
            className="field font-mono !text-[12.5px]"
          />
          <p className="mt-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
            Send it to them out of band. They can change it from Settings once
            they are in.
          </p>
        </div>
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
