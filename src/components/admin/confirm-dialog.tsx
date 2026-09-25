"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ActionResult } from "@/server/admin/types";

/**
 * Confirmation dialog around a destructive server action. Controlled from outside
 * (so it can be opened from a menu item) and toasts the action's result.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  action,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  variant?: ButtonProps["variant"];
  action: () => Promise<ActionResult>;
  onDone?: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(res.message ?? "Done");
        onOpenChange(false);
        onDone?.();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription asChild>
          <div className="mt-2">{description}</div>
        </DialogDescription>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant={variant} onClick={run} disabled={pending} aria-busy={pending}>
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Button that opens a ConfirmDialog. */
export function ConfirmButton({
  children,
  buttonProps,
  ...dialog
}: Omit<React.ComponentProps<typeof ConfirmDialog>, "open" | "onOpenChange"> & {
  children: React.ReactNode;
  buttonProps?: ButtonProps;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" {...buttonProps} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <ConfirmDialog open={open} onOpenChange={setOpen} {...dialog} />
    </>
  );
}
