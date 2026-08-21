"use client";

import { useState, useTransition } from "react";
import {
  updateService,
  deleteService,
  addServiceMember,
  removeServiceMember,
} from "@/app/actions/services";
import { SERVICE_STATUSES, option } from "@/lib/domain";
import { BRAND_SWATCHES } from "@/lib/brand";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

type Member = { id: string; name: string; avatarHue: number; avatarUrl: string | null };

export type ServiceData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  status: string;
  members: Member[];
};

function EditForm({
  service,
  onDone,
}: {
  service: ServiceData;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [color, setColor] = useState(service.color);

  return (
    <form
      action={(fd) => {
        fd.set("color", color);
        startTransition(async () => {
          await updateService(fd);
          onDone();
        });
      }}
      className="space-y-2.5"
    >
      <input type="hidden" name="id" value={service.id} />
      <input
        name="name"
        required
        autoFocus
        defaultValue={service.name}
        className="field !text-[13px]"
      />
      <textarea
        name="description"
        rows={2}
        defaultValue={service.description ?? ""}
        className="field !text-[12px]"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select name="status" defaultValue={service.status} className="field !w-auto !py-1 !text-[11px]">
          {SERVICE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {BRAND_SWATCHES.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => setColor(hex)}
            className="h-5 w-5 rounded-[5px] transition-transform hover:scale-110"
            style={{
              background: hex,
              outline: color === hex ? `2px solid ${hex}` : "none",
              outlineOffset: 2,
            }}
            aria-label={hex}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary focusable !py-1 !text-[11px]"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="btn btn-ghost focusable !py-1 !text-[11px]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ServiceCard({
  service,
  allMembers,
}: {
  service: ServiceData;
  allMembers: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const status = option(SERVICE_STATUSES, service.status);
  const memberIds = new Set(service.members.map((m) => m.id));
  const available = allMembers.filter((m) => !memberIds.has(m.id));

  return (
    <Card className="flex h-full flex-col">
      {editing ? (
        <EditForm service={service} onDone={() => setEditing(false)} />
      ) : (
        <>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: service.color }}
                  aria-hidden
                />
                {service.name}
              </span>
            }
            action={<Chip tone={status.tone}>{status.label}</Chip>}
          />
          {service.description && (
            <p
              className="mb-3 text-[12px] leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              {service.description}
            </p>
          )}

          <div className="mt-auto space-y-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
            <p className="label">Team</p>
            {service.members.length === 0 ? (
              <p className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                Nobody assigned yet.
              </p>
            ) : (
              <ul className="space-y-1">
                {service.members.map((member) => (
                  <li key={member.id} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Avatar
                        name={member.name}
                        hue={member.avatarHue}
                        imageUrl={member.avatarUrl}
                        size={20}
                      />
                      <span className="truncate text-[12px]">{member.name}</span>
                    </span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(() => removeServiceMember(service.id, member.id))
                      }
                      className="btn btn-quiet focusable !px-1 !py-0.5 !text-[11px]"
                      aria-label={`Remove ${member.name} from ${service.name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {addingMember ? (
              <select
                autoFocus
                disabled={pending || available.length === 0}
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  startTransition(() => addServiceMember(service.id, e.target.value));
                  setAddingMember(false);
                }}
                onBlur={() => setAddingMember(false)}
                className="field !py-1 !text-[11px]"
              >
                <option value="" disabled>
                  {available.length === 0 ? "Everyone is already on this team" : "Add someone…"}
                </option>
                {available.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => setAddingMember(true)}
                className="btn btn-quiet focusable !py-1 !text-[11px]"
              >
                <Icon name="plus" size={12} />
                Add to team
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn btn-quiet focusable !py-1 !text-[11px]"
            >
              <Icon name="edit" size={12} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete “${service.name}”?`)) {
                  startTransition(() => deleteService(service.id));
                }
              }}
              disabled={pending}
              className="btn btn-quiet focusable !py-1 !text-[11px]"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
