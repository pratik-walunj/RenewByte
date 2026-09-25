"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { toast } from "sonner";
import { Check, Copy, Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteProduct, duplicateProduct, setProductStatus, toggleProductFlag } from "@/app/actions/admin/products";
import type { ActionResult } from "@/server/admin/types";

type Props = {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  flags: { isFeatured: boolean; isBestSeller: boolean; isDeal: boolean };
  canDelete: boolean;
};

const itemClass =
  "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-subtle [&_svg]:size-4 [&_svg]:text-muted";

export function ProductRowActions({ id, name, slug, status, flags, canDelete }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function run(action: () => Promise<ActionResult & { id?: string }>, then?: (res: ActionResult & { id?: string }) => void) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(res.message ?? "Saved");
        then?.(res);
      } else toast.error(res.error);
    });
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`} disabled={pending}>
            <MoreHorizontal />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-52 rounded-xl border border-border bg-surface p-1 shadow-pop"
          >
            <DropdownMenu.Item asChild className={itemClass}>
              <Link href={`/admin/products/${id}`}>
                <Pencil aria-hidden /> Edit
              </Link>
            </DropdownMenu.Item>
            {status === "PUBLISHED" && (
              <DropdownMenu.Item asChild className={itemClass}>
                <a href={`/laptops/${slug}`} target="_blank" rel="noopener">
                  <Eye aria-hidden /> View in store
                </a>
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Item
              className={itemClass}
              onSelect={() => run(() => duplicateProduct(id), (res) => res.id && router.push(`/admin/products/${res.id}`))}
            >
              <Copy aria-hidden /> Duplicate
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={itemClass}
              onSelect={() => run(() => setProductStatus(id, status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"))}
            >
              {status === "PUBLISHED" ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              {status === "PUBLISHED" ? "Unpublish" : "Publish"}
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            {(
              [
                ["isFeatured", "Featured"],
                ["isBestSeller", "Best seller"],
                ["isDeal", "Deal"],
              ] as const
            ).map(([flag, label]) => (
              <DropdownMenu.CheckboxItem
                key={flag}
                checked={flags[flag]}
                className={`${itemClass} relative pl-8`}
                onSelect={(e) => {
                  e.preventDefault();
                  run(() => toggleProductFlag(id, flag, !flags[flag]));
                }}
              >
                <DropdownMenu.ItemIndicator className="absolute left-2.5 flex"><Check aria-hidden className="!text-foreground" /></DropdownMenu.ItemIndicator>
                {label}
              </DropdownMenu.CheckboxItem>
            ))}
            {canDelete && (
              <>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item className={`${itemClass} text-sale [&_svg]:text-sale`} onSelect={() => setConfirmOpen(true)}>
                  <Trash2 aria-hidden /> Delete
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this product?"
        description={
          <>
            <strong className="text-foreground">{name}</strong> will be permanently removed with its images, specifications and
            stock record. If it appears in any orders it will be archived instead so order history stays intact.
          </>
        }
        confirmLabel="Delete product"
        action={() => deleteProduct(id)}
      />
    </>
  );
}
