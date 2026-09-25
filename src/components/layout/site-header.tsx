"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { Logo } from "@/components/layout/logo";
import { SearchBox } from "@/components/search/search-box";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type NavLink = { label: string; href: string; highlight?: boolean };

export function SiteHeader({
  primary,
  secondary,
  businessName,
  logo,
  phone,
  whatsappNumber,
}: {
  primary: NavLink[];
  secondary: NavLink[];
  businessName: string;
  logo: string | null;
  phone: string;
  whatsappNumber: string;
}) {
  const pathname = usePathname();
  const { cart, wishlist, user, setCartOpen } = useStore();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const count = cart?.count ?? 0;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-surface/90 backdrop-blur-md transition-[box-shadow,border-color] duration-200 supports-[backdrop-filter]:bg-surface/80",
          scrolled ? "border-border shadow-[0_1px_12px_rgb(15_23_42/0.06)]" : "border-transparent",
        )}
      >
        <div className="container-page">
          <div className="flex h-16 items-center gap-2 lg:gap-6">
            <button
              type="button"
              className="-ml-2 inline-flex size-10 items-center justify-center rounded-lg hover:bg-subtle lg:hidden"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" />
            </button>

            <Logo name={businessName} src={logo} />

            <SearchBox className="mx-auto hidden w-full max-w-xl md:block" />

            <nav aria-label="Account" className="ml-auto flex items-center gap-0.5 md:ml-0">
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-subtle md:hidden"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="size-5" />
              </button>
              <Link
                href={user ? "/account" : "/login"}
                className="hidden h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-medium hover:bg-subtle sm:inline-flex"
              >
                <User className="size-5" aria-hidden />
                <span className="hidden max-w-24 truncate xl:inline">{user ? user.name.split(" ")[0] : "Account"}</span>
                <span className="sr-only xl:hidden">{user ? "Account" : "Sign in"}</span>
              </Link>
              <Link
                href="/wishlist"
                className="relative hidden size-10 items-center justify-center rounded-lg hover:bg-subtle sm:inline-flex"
                aria-label={`Wishlist${wishlist.size ? `, ${wishlist.size} items` : ""}`}
              >
                <Heart className="size-5" />
                {wishlist.size > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-sale" aria-hidden />
                )}
              </Link>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative inline-flex size-10 items-center justify-center rounded-lg hover:bg-subtle"
                aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
              >
                <ShoppingBag className="size-5" />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 600, damping: 20 }}
                      className="num absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10.5px] font-semibold text-white"
                      aria-hidden
                    >
                      {count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </nav>
          </div>

          <nav aria-label="Primary" className="-mb-px hidden h-11 items-center gap-1 lg:flex">
            {primary.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative flex h-full items-center px-3 text-[13.5px] font-medium transition-colors",
                  l.highlight ? "text-sale hover:text-red-700" : "text-foreground/75 hover:text-foreground",
                  isActive(l.href) &&
                    "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground",
                )}
                aria-current={isActive(l.href) ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
            <div className="ml-auto flex items-center gap-1">
              {secondary.slice(0, 3).map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-1.5 text-[13px] text-muted transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <MobileNav
        open={menuOpen}
        onOpenChange={setMenuOpen}
        primary={primary}
        secondary={secondary}
        businessName={businessName}
        phone={phone}
        whatsappNumber={whatsappNumber}
        signedIn={!!user}
      />

      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="bottom" className="h-[88dvh] px-4 pt-3" hideClose={false}>
          <SheetTitle className="mb-3 text-base">Search</SheetTitle>
          <SearchBox autoFocus onNavigate={() => setSearchOpen(false)} />
          <p className="mt-6 text-xs text-muted">Try “ThinkPad”, “i7”, “MacBook Air” or a SKU.</p>
        </SheetContent>
      </Sheet>

      <CartDrawer />
    </>
  );
}
