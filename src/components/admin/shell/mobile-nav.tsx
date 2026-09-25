"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/dialog";
import { AdminNav } from "@/components/admin/shell/nav";

/** Drawer navigation for screens below `lg`. */
export function AdminMobileNav({ footer }: { footer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open admin menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[84vw] max-w-xs">
        <div className="border-b border-border px-5 py-4 pr-14">
          <SheetTitle className="text-base">RenewByte Admin</SheetTitle>
          <SheetDescription className="sr-only">Navigate between admin sections</SheetDescription>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <AdminNav onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t border-border p-4">{footer}</div>
      </SheetContent>
    </Sheet>
  );
}
