"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { adjustStock } from "@/app/actions/admin/inventory";
import { adjustStockSchema, type AdjustStockValues } from "@/server/admin/schemas/inventory";
import { NumberField, TextField } from "@/components/admin/form/fields";
import { cn } from "@/lib/utils";

type Row = { id: string; name: string; sku: string; quantity: number; reserved: number; threshold: number };

export function AdjustStockDialog({ row }: { row: Row }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Adjust stock for ${row.name}`}>
          <SlidersHorizontal /> Adjust
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>Adjust stock</DialogTitle>
        <DialogDescription className="mt-1 flex flex-col">
          <span className="line-clamp-2 text-foreground">{row.name}</span>
          <span className="font-mono text-xs">{row.sku}</span>
        </DialogDescription>
        {open && <AdjustForm row={row} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AdjustForm({ row, onDone }: { row: Row; onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<AdjustStockValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: { productId: row.id, mode: "delta", amount: 1, reason: "", lowStockThreshold: row.threshold },
  });
  const [mode, amount] = useWatch({ control: form.control, name: ["mode", "amount"] });
  const next = Number.isFinite(amount) ? (mode === "set" ? amount : row.quantity + amount) : row.quantity;

  function onSubmit(values: AdjustStockValues) {
    startTransition(async () => {
      const res = await adjustStock(values);
      if (!res.ok) {
        for (const [k, m] of Object.entries(res.fieldErrors ?? {})) {
          if (m?.[0]) form.setError(k as Path<AdjustStockValues>, { message: m[0] });
        }
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Stock updated");
      onDone();
      router.refresh();
    });
  }

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4">
        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-subtle p-3 text-center text-sm">
          <div>
            <dt className="text-xs text-muted">On hand</dt>
            <dd className="num font-semibold">{row.quantity}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Reserved</dt>
            <dd className="num font-semibold">{row.reserved}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">After change</dt>
            <dd className={cn("num font-semibold", next < row.reserved && "text-sale")}>{next}</dd>
          </div>
        </dl>

        <div role="radiogroup" aria-label="Adjustment type" className="grid grid-cols-2 gap-1 rounded-lg bg-subtle p-1">
          {(
            [
              ["delta", "Add / remove"],
              ["set", "Set quantity"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => form.setValue("mode", value)}
              className={cn(
                "h-9 rounded-md text-sm font-medium transition-colors",
                mode === value ? "bg-surface shadow-card" : "text-muted hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <NumberField
          name="amount"
          label={mode === "set" ? "New quantity on hand" : "Change (use a minus sign to remove)"}
          hint={mode === "delta" ? "e.g. 5 for a new batch, -1 for a damaged unit" : undefined}
        />
        <TextField name="reason" label="Reason" placeholder="Stock count correction, new batch received…" />
        <NumberField name="lowStockThreshold" label="Low-stock threshold" min={0} />

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Saving…" : "Save adjustment"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
