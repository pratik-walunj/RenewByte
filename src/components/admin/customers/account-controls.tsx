"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect, Label } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { setUserActive, setUserRole } from "@/app/actions/admin/customers";

type Role = "CUSTOMER" | "STAFF" | "ADMIN";

/** ADMIN-only controls: role and active status. Hidden for the signed-in admin's own account. */
export function AccountControls({ userId, name, role, isActive }: { userId: string; name: string; role: Role; isActive: boolean }) {
  const router = useRouter();
  const [nextRole, setNextRole] = useState<Role>(role);
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function saveRole() {
    startTransition(async () => {
      const res = await setUserRole(userId, nextRole);
      if (res.ok) {
        toast.success(res.message ?? "Role updated");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-role">Role</Label>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <NativeSelect id="user-role" value={nextRole} onChange={(e) => setNextRole(e.target.value as Role)}>
              <option value="CUSTOMER">Customer</option>
              <option value="STAFF">Staff — dashboard access</option>
              <option value="ADMIN">Admin — full access</option>
            </NativeSelect>
          </div>
          <Button variant="outline" onClick={saveRole} disabled={pending || nextRole === role}>
            Save
          </Button>
        </div>
        <p className="text-[13px] text-muted">Changing the role signs the user out of all devices.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm">
          Account is <strong>{isActive ? "active" : "deactivated"}</strong>
        </p>
        <Button variant={isActive ? "outline" : "success"} size="sm" onClick={() => setConfirm(true)}>
          {isActive ? "Deactivate" : "Activate"}
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={isActive ? `Deactivate ${name}?` : `Activate ${name}?`}
        description={
          isActive
            ? "They will be signed out everywhere and won't be able to sign in. Their orders are kept."
            : "They will be able to sign in again."
        }
        confirmLabel={isActive ? "Deactivate" : "Activate"}
        variant={isActive ? "danger" : "primary"}
        action={() => setUserActive(userId, !isActive)}
        onDone={() => router.refresh()}
      />
    </div>
  );
}
