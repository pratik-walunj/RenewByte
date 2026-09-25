"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const overlayClass =
  "fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] data-[state=open]:animate-[overlay-in_150ms_ease-out] data-[state=closed]:animate-[overlay-out_120ms_ease-in]";

export function DialogContent({
  className,
  children,
  hideClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { hideClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-surface p-6 shadow-pop outline-none data-[state=open]:animate-[dialog-in_180ms_var(--ease-out-soft)] data-[state=closed]:animate-[dialog-out_120ms_ease-in]",
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close
            className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-subtle hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4.5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-muted", className)} {...props} />;
}

type Side = "left" | "right" | "bottom";

const sheetSide: Record<Side, string> = {
  left: "inset-y-0 left-0 h-dvh w-[88vw] max-w-sm data-[state=open]:animate-[sheet-left-in_220ms_var(--ease-out-soft)] data-[state=closed]:animate-[sheet-left-out_160ms_ease-in]",
  right:
    "inset-y-0 right-0 h-dvh w-[92vw] max-w-md data-[state=open]:animate-[sheet-right-in_220ms_var(--ease-out-soft)] data-[state=closed]:animate-[sheet-right-out_160ms_ease-in]",
  bottom:
    "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl data-[state=open]:animate-[sheet-bottom-in_240ms_var(--ease-out-soft)] data-[state=closed]:animate-[sheet-bottom-out_160ms_ease-in]",
};

/** Drawer / bottom sheet built on the accessible Radix dialog. */
export function SheetContent({
  side = "right",
  className,
  children,
  hideClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: Side; hideClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content
        className={cn("fixed z-50 flex flex-col bg-surface shadow-pop outline-none", sheetSide[side], className)}
        {...props}
      >
        {side === "bottom" && <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border-strong" />}
        {children}
        {!hideClose && (
          <DialogPrimitive.Close
            className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-subtle hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4.5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogTitle;
export const SheetDescription = DialogDescription;
