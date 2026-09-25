"use client";

import * as React from "react";
import { track } from "@/lib/analytics";
import { cn, whatsappLink } from "@/lib/utils";

type Ctx = { number: string; defaultMessage: string; setContext: (msg: string | null, product?: string) => void };

const WhatsAppContext = React.createContext<Ctx | null>(null);

export function WhatsAppProvider({
  number,
  defaultMessage,
  children,
}: {
  number: string;
  defaultMessage: string;
  children: React.ReactNode;
}) {
  const [override, setOverride] = React.useState<{ msg: string; product?: string } | null>(null);
  const setContext = React.useCallback((msg: string | null, product?: string) => {
    setOverride(msg ? { msg, product } : null);
  }, []);
  const value = React.useMemo(
    () => ({ number, defaultMessage: override?.msg ?? defaultMessage, setContext }),
    [number, defaultMessage, override, setContext],
  );
  return (
    <WhatsAppContext.Provider value={value}>
      {children}
      <WhatsAppFloat product={override?.product} />
    </WhatsAppContext.Provider>
  );
}

export function useWhatsApp() {
  return React.useContext(WhatsAppContext);
}

/** Drop into a page to make the floating button mention a product. */
export function WhatsAppProductContext({ productName }: { productName: string }) {
  const ctx = useWhatsApp();
  const setContext = ctx?.setContext;
  React.useEffect(() => {
    setContext?.(`Hi, I am interested in the ${productName}.`, productName);
    return () => setContext?.(null);
  }, [productName, setContext]);
  return null;
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.16-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.06.89.9-2.98-.2-.31a8.2 8.2 0 1 1 6.84 3.73Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.42l-.75-1.8c-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.73 2.73 0 0 0-.85 2.03 4.75 4.75 0 0 0 1 2.52 10.86 10.86 0 0 0 4.16 3.68c1.55.67 2.16.73 2.93.61.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.14-1.17-.06-.1-.22-.16-.47-.28Z"
      />
    </svg>
  );
}

export function WhatsAppButton({
  message,
  location,
  product,
  className,
  children,
}: {
  message?: string;
  location: string;
  product?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const ctx = useWhatsApp();
  if (!ctx?.number) return null;
  return (
    <a
      href={whatsappLink(ctx.number, message ?? ctx.defaultMessage)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track({ name: "whatsapp_click", location, product })}
      className={className}
    >
      {children ?? (
        <>
          <WhatsAppIcon className="size-4" /> WhatsApp
        </>
      )}
    </a>
  );
}

function WhatsAppFloat({ product }: { product?: string }) {
  const ctx = useWhatsApp();
  if (!ctx?.number) return null;
  return (
    <a
      href={whatsappLink(ctx.number, ctx.defaultMessage)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track({ name: "whatsapp_click", location: "floating", product })}
      aria-label="Chat with us on WhatsApp"
      className={cn(
        "fixed right-4 bottom-4 z-30 flex size-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_-6px_rgb(0_0_0/0.35)] transition-transform duration-200 hover:scale-105 active:scale-95 sm:right-6 sm:bottom-6",
        "[body[data-sticky-cta]_&]:bottom-24 lg:[body[data-sticky-cta]_&]:bottom-6",
      )}
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
