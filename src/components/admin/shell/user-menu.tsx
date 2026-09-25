import { LogOut } from "lucide-react";
import { signOutAdmin } from "@/app/actions/admin/session";
import { Button } from "@/components/ui/button";

/** Signed-in user summary with a sign-out form (works without JavaScript). */
export function AdminUserCard({ name, email, role }: { name: string; email: string; role: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-subtle text-sm font-semibold text-foreground"
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted">
          {email} · {role === "ADMIN" ? "Admin" : "Staff"}
        </p>
      </div>
      <form action={signOutAdmin}>
        <Button type="submit" variant="ghost" size="icon-sm" aria-label="Sign out" title="Sign out">
          <LogOut />
        </Button>
      </form>
    </div>
  );
}
