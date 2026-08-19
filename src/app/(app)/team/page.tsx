import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ALLOWED_EMAIL_DOMAIN, atLeast } from "@/lib/policy";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { InviteForm } from "./InviteForm";
import { MemberRow, type MemberRowData } from "./MemberRow";

export const metadata = { title: "Team" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getCurrentUser();
  const canManage = user ? atLeast(user.role, "ADMIN") : false;

  const members = await db.user.findMany({
    include: {
      _count: { select: { assignedTasks: true, ownedAccounts: true } },
    },
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
  });

  const active = members.filter((m) => m.active);

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Team"
        description={`${active.length} active ${active.length === 1 ? "person" : "people"}. Access is restricted to @${ALLOWED_EMAIL_DOMAIN} addresses.`}
      />

      {/* The policy, stated where it is enforced. */}
      <div
        className="mb-5 flex items-start gap-2.5 rounded-[10px] border px-4 py-3"
        style={{
          borderColor: "color-mix(in oklab, var(--accent) 30%, transparent)",
          background: "color-mix(in oklab, var(--accent) 8%, transparent)",
        }}
      >
        <Icon name="sparkle" size={16} className="mt-px" />
        <div className="text-[12.5px] leading-relaxed">
          <p className="font-medium">Domain lock</p>
          <p style={{ color: "var(--text-muted)" }}>
            Only <strong>@{ALLOWED_EMAIL_DOMAIN}</strong> addresses can hold an
            account. The rule is enforced server-side on sign-in and on every
            account creation — including the seed — so there is no path that
            creates a user the login would reject.
          </p>
        </div>
      </div>

      <Card padded={false} className="mb-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--line)" }}>
                <th className="label px-5 py-3">Person</th>
                <th className="label py-3 pr-3">Title</th>
                <th className="label py-3 pr-3">Role</th>
                <th className="label py-3 pr-3">Load</th>
                <th className="label py-3 pr-3">Last seen</th>
                <th className="label py-3 pr-5 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member as MemberRowData}
                  canManage={canManage}
                  isSelf={member.id === user?.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {canManage ? (
        <Card className="max-w-2xl">
          <CardHeader
            title="Add someone"
            subtitle={`They will be able to sign in immediately with the temporary password you set.`}
          />
          <InviteForm
            domain={ALLOWED_EMAIL_DOMAIN}
            canCreateOwner={user?.role === "OWNER"}
          />
        </Card>
      ) : (
        <p className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>
          Ask an owner or admin to invite new people.
        </p>
      )}
    </>
  );
}
