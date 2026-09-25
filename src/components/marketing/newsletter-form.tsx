"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/app/actions/content";
import { newsletterSchema } from "@/components/forms/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Newsletter sign-up block. Copy comes from the CMS homepage singleton. */
export function NewsletterForm({
  title,
  subtitle,
  disclaimer,
  className,
}: {
  title: string;
  subtitle: string;
  disclaimer: string;
  className?: string;
}) {
  const id = React.useId();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = newsletterSchema.safeParse({ email });
    if (!parsed.success) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await subscribeNewsletter(parsed.data);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
      setEmail("");
      toast.success("You're subscribed");
    });
  }

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:gap-12", className)}>
      <div>
        <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-[15px] text-muted text-pretty">{subtitle}</p>}
      </div>
      <div>
        <form onSubmit={onSubmit} noValidate aria-labelledby={`${id}-title`} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={`${id}-email`} className="sr-only">
            Email address
          </label>
          <Input
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (done) setDone(false);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : `${id}-note`}
            className="sm:h-11"
          />
          <Button type="submit" size="lg" disabled={pending} className="sm:h-11">
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Subscribe
          </Button>
        </form>
        <div aria-live="polite" className="mt-2 min-h-5 text-[13px]">
          {error ? (
            <p id={`${id}-error`} className="text-sale">
              {error}
            </p>
          ) : done ? (
            <p className="text-success">Thanks — you&apos;re on the list.</p>
          ) : (
            disclaimer && (
              <p id={`${id}-note`} className="text-muted">
                {disclaimer}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
