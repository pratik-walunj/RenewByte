import { Mail, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/cms";
import { cn, digitsOnly } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/layout/whatsapp";

/** "Need help?" block with phone, WhatsApp and email from site settings. */
export async function HelpBlock({
  title = "Need help?",
  description = "Talk to a real person about your order, warranty or which laptop to choose.",
  location = "help_block",
  className,
}: {
  title?: string;
  description?: string;
  location?: string;
  className?: string;
}) {
  const site = await getSiteSettings();
  if (!site.phone && !site.email && !site.whatsappNumber) return null;
  return (
    <aside
      aria-labelledby="help-block-title"
      className={cn("rounded-xl border border-border bg-surface p-5 sm:p-6", className)}
    >
      <h2 id="help-block-title" className="text-lg font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-1.5 text-[15px] text-muted text-pretty">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {site.phone && (
          <a href={`tel:+${digitsOnly(site.phone)}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Phone aria-hidden /> <span className="num">{site.phone}</span>
          </a>
        )}
        <WhatsAppButton location={location} className={buttonVariants({ variant: "outline", size: "sm" })} />
        {site.email && (
          <a href={`mailto:${site.email}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Mail aria-hidden /> Email us
          </a>
        )}
      </div>
    </aside>
  );
}
