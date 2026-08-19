"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "../actions";
import { Icon } from "@/components/ui/Icon";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-primary focusable mt-1 w-full py-2.5"
      disabled={pending}
    >
      {pending ? "Signing in…" : "Sign in"}
      {!pending && <Icon name="arrowRight" size={15} />}
    </button>
  );
}

export function LoginForm({ domain, next }: { domain: string; next?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email" className="label mb-1.5 block">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          placeholder={`you@${domain}`}
          className="field"
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>

      <div>
        <label htmlFor="password" className="label mb-1.5 block">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••••"
          className="field"
        />
      </div>

      {state.error && (
        <p
          id="login-error"
          role="alert"
          className="flex items-start gap-2 rounded-[9px] px-3 py-2 text-[12.5px] leading-snug"
          style={{
            background: "color-mix(in oklab, var(--color-danger) 12%, transparent)",
            color: "var(--color-danger)",
            border: "1px solid color-mix(in oklab, var(--color-danger) 28%, transparent)",
          }}
        >
          <Icon name="alert" size={15} className="mt-px" />
          <span>{state.error}</span>
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
