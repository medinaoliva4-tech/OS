import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/policy";
import { brand } from "@/lib/brand";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import {
  InherentLockup,
  InherentMark,
} from "@/components/ui/brand/InherentMarks";
import { PasswordForm } from "./PasswordForm";
import { AvatarUpload } from "./AvatarUpload";
import { ApiTokensCard } from "./ApiTokensCard";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  const [accountCount, taskCount, contentCount, assetCount, apiTokens] = await Promise.all([
    db.account.count(),
    db.task.count(),
    db.contentItem.count(),
    db.asset.count(),
    user
      ? db.apiToken.findMany({
          where: { userId: user.id, revokedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, last4: true, createdAt: true, lastUsedAt: true },
        })
      : Promise.resolve([]),
  ]);

  const headerList = await headers();
  const host = headerList.get("host");
  const proto = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const mcpUrl = `${proto}://${host}/api/mcp`;

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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={user.name}
                  hue={user.avatarHue}
                  imageUrl={user.avatarUrl}
                  size={44}
                />
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

              <div className="border-t pt-4" style={{ borderColor: "var(--line)" }}>
                <AvatarUpload
                  name={user.name}
                  hue={user.avatarHue}
                  currentUrl={user.avatarUrl}
                />
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
            title="API tokens"
            subtitle="Connect your own Claude.ai or ChatGPT custom connector to the OS."
          />
          <ApiTokensCard tokens={apiTokens} mcpUrl={mcpUrl} />
        </Card>

        {/* ------------------------------------------------------------ */}
        <Card>
          <CardHeader
            title="Brand"
            subtitle="Taken from the official brand sheet. One file is the source of truth."
          />
          <p
            className="mb-4 text-[12.5px] leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            These are the exact swatches from the Inherent brand sheet, and the
            logo is the real vector artwork — not a redraw. To change any of it,
            edit{" "}
            <code className="font-mono text-[11.5px]">src/lib/brand.ts</code> and
            mirror the values in the{" "}
            <code className="font-mono text-[11.5px]">@theme</code> block of{" "}
            <code className="font-mono text-[11.5px]">src/app/globals.css</code>.
            Nothing else in the codebase hardcodes a colour.
          </p>

          <p className="label mb-2">Brand swatches</p>
          <div className="mb-5 flex flex-wrap gap-3">
            {Object.entries(brand.palette).map(([name, hex]) => (
              <div key={name} className="flex items-center gap-2">
                <span
                  className="h-7 w-7 rounded-[7px] border"
                  style={{ background: hex, borderColor: "var(--line-strong)" }}
                />
                <span className="leading-tight">
                  <span className="block text-[11.5px] font-medium capitalize">
                    {name.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span
                    className="block font-mono text-[10px]"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {hex}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <p className="label mb-2">Logo</p>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="flex items-center justify-center rounded-[10px] px-5 py-4"
              style={{ background: brand.palette.charcoal, color: brand.palette.cream }}
            >
              <InherentLockup height={22} />
            </span>
            <span
              className="flex items-center justify-center rounded-[10px] px-5 py-4"
              style={{ background: brand.palette.cream, color: brand.palette.deepOlive }}
            >
              <InherentLockup height={22} />
            </span>
            <span
              className="flex items-center justify-center rounded-[10px] px-4 py-4"
              style={{ background: brand.palette.mutedOlive, color: brand.palette.cream }}
            >
              <InherentMark size={26} />
            </span>
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
