import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/policy";
import { brand } from "@/lib/brand";
import { LogoMark } from "@/components/ui/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      {/* Ambient field — keeps the sign-in from feeling like a bare form. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% -10%, color-mix(in oklab, var(--accent) 16%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 40%, black, transparent 75%)",
        }}
      />

      <div className="animate-in relative w-full max-w-[380px]">
        <div className="mb-7 flex flex-col items-center text-center">
          <LogoMark size={40} />
          <h1 className="mt-4 text-lg font-semibold tracking-tight">
            {brand.productName}
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
            {brand.tagline}
          </p>
        </div>

        <div
          className="surface p-6"
          style={{ boxShadow: "0 24px 60px -20px rgb(0 0 0 / 0.6)" }}
        >
          <LoginForm domain={ALLOWED_EMAIL_DOMAIN} />
        </div>

        <p
          className="mt-5 text-center text-[11px] leading-relaxed"
          style={{ color: "var(--text-faint)" }}
        >
          Access is limited to <strong>@{ALLOWED_EMAIL_DOMAIN}</strong> accounts.
          <br />
          Need access? Ask Rodrigo or Pablo to invite you from Team.
        </p>
      </div>
    </main>
  );
}
