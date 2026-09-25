import { cn } from "@/lib/utils";

/** Page title for account pages (the layout provides navigation, so no breadcrumbs). */
export function AccountHeading({
  title,
  description,
  action,
  eyebrow,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-8", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-muted text-pretty">{description}</p>}
      </div>
      {action}
    </div>
  );
}
