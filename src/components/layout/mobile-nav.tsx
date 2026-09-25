"use client";

import Link from "next/link";
import { ChevronRight, Heart, MessageCircle, Phone, User } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/dialog";
import { Logo } from "@/components/layout/logo";
import { track } from "@/lib/analytics";
import { cn, digitsOnly, whatsappLink } from "@/lib/utils";
import type { NavLink } from "@/components/layout/site-header";

export function MobileNav({
  open,
  onOpenChange,
  primary,
  secondary,
  businessName,
  phone,
  whatsappNumber,
  signedIn,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primary: NavLink[];
  secondary: NavLink[];
  businessName: string;
  phone: string;
  whatsappNumber: string;
  signedIn: boolean;
}) {
  const close = () => onOpenChange(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" aria-describedby={undefined}>
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex h-16 shrink-0 items-center border-b border-border px-4" onClick={close}>
          <Logo name={businessName} />
        </div>
        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-2 py-3">
          <ul>
            {primary.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={close}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-subtle",
                    l.highlight && "text-sale",
                  )}
                >
                  {l.label}
                  <ChevronRight className="size-4 text-faint" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <div className="my-3 border-t border-border" />
          <ul className="grid grid-cols-2 gap-1">
            <li>
              <Link href={signedIn ? "/account" : "/login"} onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-subtle">
                <User className="size-4 text-muted" aria-hidden /> {signedIn ? "My account" : "Sign in"}
              </Link>
            </li>
            <li>
              <Link href="/wishlist" onClick={close} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-subtle">
                <Heart className="size-4 text-muted" aria-hidden /> Wishlist
              </Link>
            </li>
            {secondary.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={close} className="block rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-subtle hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border p-4">
          {phone && (
            <a href={`tel:+${digitsOnly(phone)}`} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border-strong text-sm font-medium">
              <Phone className="size-4" aria-hidden /> Call us
            </a>
          )}
          {whatsappNumber && (
            <a
              href={whatsappLink(whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track({ name: "whatsapp_click", location: "mobile-nav" })}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#128C4B] text-sm font-medium text-white"
            >
              <MessageCircle className="size-4" aria-hidden /> WhatsApp
            </a>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
