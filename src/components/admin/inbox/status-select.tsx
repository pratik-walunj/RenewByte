"use client";

import { useId, useTransition } from "react";
import { toast } from "sonner";
import { setInboxStatus } from "@/app/actions/admin/inbox";

type Status = "NEW" | "IN_PROGRESS" | "RESOLVED";

/** Inline status changer for contact messages and trade-in requests. */
export function InboxStatusSelect({ kind, id, status }: { kind: "contact" | "tradein"; id: string; status: Status }) {
  const [pending, startTransition] = useTransition();
  const uid = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={uid} className="text-xs text-muted">
        Status
      </label>
      <select
        id={uid}
        defaultValue={status}
        disabled={pending}
        aria-busy={pending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(async () => {
            const res = await setInboxStatus(kind, id, next);
            if (res.ok) toast.success(res.message ?? "Updated");
            else toast.error(res.error);
          });
        }}
        className="h-9 rounded-lg border border-border-strong bg-surface px-2 text-sm outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/15"
      >
        <option value="NEW">New</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>
    </div>
  );
}
