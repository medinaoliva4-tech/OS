"use client";

import { useTransition } from "react";
import { setUserActive, setUserRole } from "@/app/actions/team";
import { ROLES } from "@/lib/policy";
import { formatRelative } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";

export type MemberRowData = {
  id: string;
  name: string;
  email: string;
  title: string | null;
  role: string;
  active: boolean;
  avatarHue: number;
  lastLoginAt: Date | null;
  _count: { assignedTasks: number; ownedAccounts: number };
};

export function MemberRow({
  member,
  canManage,
  isSelf,
}: {
  member: MemberRowData;
  canManage: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <tr className="row-hover transition-colors" style={{ opacity: pending ? 0.5 : 1 }}>
      <td className="py-3 pl-5 pr-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={member.name} hue={member.avatarHue} size={32} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-medium">
                {member.name}
              </span>
              {isSelf && <Chip tone="accent">You</Chip>}
              {!member.active && <Chip tone="danger">Deactivated</Chip>}
            </div>
            <span
              className="block truncate text-[11px]"
              style={{ color: "var(--text-faint)" }}
            >
              {member.email}
            </span>
          </div>
        </div>
      </td>

      <td className="py-3 pr-3 text-[12.5px]">
        {member.title ?? <span style={{ color: "var(--text-faint)" }}>—</span>}
      </td>

      <td className="py-3 pr-3">
        {canManage ? (
          <>
            <label className="sr-only" htmlFor={`role-${member.id}`}>
              Role for {member.name}
            </label>
            <select
              id={`role-${member.id}`}
              value={member.role}
              onChange={(event) =>
                startTransition(() => setUserRole(member.id, event.target.value))
              }
              disabled={pending}
              className="field !w-auto !py-1 !text-[11.5px]"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0) + role.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </>
        ) : (
          <Chip tone={member.role === "OWNER" ? "accent" : "neutral"}>
            {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
          </Chip>
        )}
      </td>

      <td
        className="py-3 pr-3 text-[11.5px] tabular-nums"
        style={{ color: "var(--text-faint)" }}
      >
        {member._count.assignedTasks} tasks · {member._count.ownedAccounts} brands
      </td>

      <td
        className="py-3 pr-3 text-[11.5px]"
        style={{ color: "var(--text-faint)" }}
        // Relative time ticks between SSR and hydration by design.
        suppressHydrationWarning
      >
        {member.lastLoginAt ? formatRelative(member.lastLoginAt) : "Never"}
      </td>

      <td className="py-3 pr-5 text-right">
        {canManage && !isSelf && (
          <button
            type="button"
            onClick={() =>
              startTransition(() => setUserActive(member.id, !member.active))
            }
            disabled={pending}
            className={`btn focusable !py-1 !text-[11.5px] ${
              member.active ? "btn-danger" : "btn-ghost"
            }`}
          >
            {member.active ? "Deactivate" : "Reactivate"}
          </button>
        )}
      </td>
    </tr>
  );
}
