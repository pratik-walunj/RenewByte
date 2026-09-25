"use client";

import * as React from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/** Map server-side Zod field errors back onto react-hook-form fields. */
export function applyServerErrors<T extends FieldValues>(
  fieldErrors: Record<string, string[] | undefined> | undefined,
  setError: UseFormSetError<T>,
) {
  if (!fieldErrors) return;
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) setError(key as Path<T>, { type: "server", message: messages[0] });
  }
}

/** Visually hidden spam trap. Real users (and screen readers) skip it. */
export function Honeypot({ id, ...props }: React.ComponentProps<"input"> & { id: string }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor={id}>Leave this field empty</label>
      <input id={id} type="text" tabIndex={-1} autoComplete="off" {...props} />
    </div>
  );
}
