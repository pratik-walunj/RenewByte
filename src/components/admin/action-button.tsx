"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { ActionResult } from "@/server/admin/types";

/** Runs a (bound) server action on click and reports the result with a toast. */
export function ActionButton({
  action,
  children,
  pendingLabel,
  ...props
}: Omit<ButtonProps, "onClick" | "action"> & {
  action: () => Promise<ActionResult>;
  pendingLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      {...props}
      disabled={pending || props.disabled}
      aria-busy={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await action();
          if (res.ok) toast.success(res.message ?? "Saved");
          else toast.error(res.error);
        })
      }
    >
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
