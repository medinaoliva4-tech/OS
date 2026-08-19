import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/policy";
import { brand } from "@/lib/brand";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  const [accountCount, taskCount, contentCount, assetCount] = await Promise.all([
    db.account.count(),
    db.task.count(),
    db.contentItem.count(),
    db.asset.count(),
  ]);

  const isProd = process.env.NODE_ENV === "production";
  const secretIsDefault =
    !process.env.AUTH_SECRET ||
    process.env.AUTH_SECRET.startsWith("dev-only-secret");

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Workspace policy, your account, and how the brand is themed."
      />

      <div className="space-y-5">
        {/* ------------------------------------------------------------ */}
        <Card>
          <CardHeader title="You" />
          {user && (
            <div className="flex items-center gap-3">
              <Avatar name={user.name} hue={user.avatarHue} size={44} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                  {user.email}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Chip tone={user.role === "OWNER" ? "accent" : "neutral"}>
                    {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                  </Chip>
                  {user.title && (
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {user.title}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Change your password"
            subtitle="If you are still on the seeded password, change it now."
          />
          <PasswordForm />
        </Card>

        {/* ------------------------------------------------------------ */}
        <Card>
          <CardHeader
            title="Access policy"
            subtitle="Enforced server-side, in one place."
          />
          <dl className="space-y-3 text-[12.5px]">
            <div className="flex items-start justify-between gap-4">
              <dt style={{ color: "var(--text-muted)" }}>Allowed email domain</dt>
              <dd className="font-mono font-medium">@{ALLOWED_EMAIL_DOMAIN}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt style={{ color: "var(--text-muted)" }}>Session lifetime</dt>
              <dd className="font-medium">14 days</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt style={{ color: "var(--text-muted)" }}>Password hashing</dt>
              <dd className="font-medium">scrypt, per-password salt</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt style={{ color: "var(--text-muted)" }}>Session cookie</dt>
              <dd className="font-medium">
                httpOnly, sameSite=lax, HMAC-signed
              </dd>
            </div>
          </dl>

          {secretIsDefault && (
            <p
              className="mt-4 rounded-[9px] px-3 py-2 text-[12px] leading-relaxed"
              style={{
                background: isProd
                  ? "color-mix(in oklab, var(--color-danger) 12%, transparent)"
                  : "color-mix(in oklab, var(--color-warn) 12%, transparent)",
                color: isProd ? "var(--color-danger)" : "var(--color-warn)",
              }}
            >
              <strong>AUTH_SECRET is still the development default.</strong> Set
              a real one before deploying — generate it with{" "}
              <code className="break-all font-mono text-[11px]">
                node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;
              </code>
              .
            </p>
          )}
        </Card>

        {/* ------------------------------------------------------------ */}
        <Card>
          <CardHeader
            title="Brand"
            subtitle="One file is the source of truth for the whole look."
          />
          <p
            className="mb-4 text-[12.5px] leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            The palette below is an interpretation, not a scrape —{" "}
            <strong>{brand.domain}</strong> was not reachable from the build
            environment. To make the OS match the real brand exactly, replace
            the hex values in{" "}
            <code className="font-mono text-[11.5px]">src/lib/brand.ts</code>{" "}
            and mirror them in{" "}
            <code className="font-mono text-[11.5px]">src/app/globals.css</code>
            . Drop a wordmark into{" "}
            <code className="font-mono text-[11.5px]">public/</code> and point{" "}
            <code className="font-mono text-[11.5px]">brand.logo.src</code> at
            it. Nothing else hardcodes a colour.
          </p>

          <div className="flex flex-wrap gap-2">
            {Object.entries(brand.palette).map(([name, hex]) => (
              <div key={name} className="flex items-center gap-2">
                <span
                  className="h-6 w-6 rounded-[6px] border"
                  style={{ background: hex, borderColor: "var(--line-strong)" }}
                />
                <span className="font-mono text-[10.5px]" style={{ color: "var(--text-faint)" }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* ------------------------------------------------------------ */}
        <Card>
          <CardHeader title="Workspace" subtitle="What is in the OS right now." />
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Brands", value: accountCount },
              { label: "Tasks", value: taskCount },
              { label: "Content", value: contentCount },
              { label: "Assets", value: assetCount },
            ].map((item) => (
              <div key={item.label}>
                <dt className="label">{item.label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
          <p
            className="mt-4 border-t pt-3 text-[11.5px]"
            style={{ borderColor: "var(--line)", color: "var(--text-faint)" }}
          >
            {brand.productName} · environment {process.env.NODE_ENV} ·{" "}
            {formatDate(new Date())}
          </p>
        </Card>
      </div>
    </div>
  );
}
