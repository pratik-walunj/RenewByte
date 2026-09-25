"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Banknote, Check, ChevronDown, CreditCard, Loader2, Lock, Pencil, ShoppingBag, Truck } from "lucide-react";
import { placeOrder, previewCheckout, type CheckoutPreview } from "@/app/actions/checkout";
import { useStore } from "@/components/providers/store-provider";
import { payWithRazorpay } from "@/components/checkout/razorpay-client";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/misc";
import { SummaryRows } from "@/components/cart/order-summary";
import { ProductImage } from "@/components/product/product-image";
import { INDIAN_STATES } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { checkoutSchema, type CheckoutInput, type CheckoutValues } from "@/lib/validation/checkout";

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_FIELDS: Record<Step, FieldPath<CheckoutInput>[]> = {
  1: ["customer.name", "customer.email", "customer.phone"],
  2: ["address.line1", "address.line2", "address.landmark", "address.city", "address.state", "address.pincode"],
  3: ["deliveryMethod"],
  4: ["paymentMethod"],
  5: ["notes"],
};

const STEP_TITLES: Record<Step, string> = {
  1: "Contact information",
  2: "Shipping address",
  3: "Delivery method",
  4: "Payment",
  5: "Review & place order",
};

export type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

function StepCard({
  step,
  active,
  done,
  summary,
  onEdit,
  children,
}: {
  step: Step;
  active: boolean;
  done: boolean;
  summary?: React.ReactNode;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`step-${step}`}
      className={cn("rounded-xl border bg-surface transition-colors", active ? "border-foreground/30 shadow-card" : "border-border")}
    >
      <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold",
            done ? "bg-success text-white" : active ? "bg-primary text-white" : "bg-subtle text-muted",
          )}
          aria-hidden
        >
          {done && !active ? <Check className="size-3.5" strokeWidth={3} /> : step}
        </span>
        <h2 id={`step-${step}`} className={cn("flex-1 text-[15px] font-semibold", !active && !done && "text-muted")}>
          {STEP_TITLES[step]}
        </h2>
        {done && !active && (
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            <Pencil className="size-3.5" aria-hidden /> Edit
          </button>
        )}
      </div>
      {done && !active && summary && <div className="-mt-1 px-5 pb-4 pl-15 text-sm text-muted sm:px-6 sm:pl-16">{summary}</div>}
      {active && <div className="border-t border-border px-5 py-5 sm:px-6">{children}</div>}
    </section>
  );
}

export function CheckoutForm({
  defaults,
  addresses,
  signedIn,
}: {
  defaults: Partial<CheckoutInput["customer"]>;
  addresses: SavedAddress[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const { ready, cart, refresh } = useStore();
  const [step, setStep] = React.useState<Step>(1);
  const [maxStep, setMaxStep] = React.useState<Step>(1);
  const [preview, setPreview] = React.useState<CheckoutPreview | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  const form = useForm<CheckoutInput, unknown, CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: {
      customer: { name: defaults.name ?? "", email: defaults.email ?? "", phone: defaults.phone ?? "" },
      address: {
        line1: defaultAddress?.line1 ?? "",
        line2: defaultAddress?.line2 ?? "",
        landmark: defaultAddress?.landmark ?? "",
        city: defaultAddress?.city ?? "",
        state: (defaultAddress?.state as CheckoutInput["address"]["state"]) ?? ("" as CheckoutInput["address"]["state"]),
        pincode: defaultAddress?.pincode ?? "",
      },
      deliveryMethod: "STANDARD",
      paymentMethod: "RAZORPAY",
      notes: "",
      saveAddress: signedIn && addresses.length === 0,
    },
  });
  const { register, formState, control, setValue, getValues } = form;
  const errors = formState.errors;
  const [state, pincode, deliveryMethod, paymentMethod] = useWatch({
    control,
    name: ["address.state", "address.pincode", "deliveryMethod", "paymentMethod"],
  });
  const saveAddress = useWatch({ control, name: "saveAddress" });

  const cartKey = cart ? `${cart.count}-${cart.totals.subtotal}-${cart.totals.discount}` : "";
  React.useEffect(() => {
    if (!ready || !cartKey) return;
    let cancelled = false;
    previewCheckout({ state: state || undefined, pincode: pincode || undefined, deliveryMethod, paymentMethod }).then((p) => {
      if (!cancelled && p) setPreview(p);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, cartKey, state, pincode, deliveryMethod, paymentMethod]);

  // Fall back to COD when online payment isn't configured, and vice versa.
  React.useEffect(() => {
    if (!preview) return;
    if (paymentMethod === "RAZORPAY" && !preview.onlineAvailable && preview.codAvailable) setValue("paymentMethod", "COD");
    if (paymentMethod === "COD" && !preview.codAvailable && preview.onlineAvailable) setValue("paymentMethod", "RAZORPAY");
  }, [preview, paymentMethod, setValue]);

  async function next(current: Step) {
    const ok = await form.trigger(STEP_FIELDS[current]);
    if (!ok) return;
    const n = Math.min(current + 1, 5) as Step;
    setStep(n);
    setMaxStep((m) => (n > m ? n : m));
    requestAnimationFrame(() => document.getElementById(`step-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function onSubmit(values: CheckoutValues) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await placeOrder(values);
      if (!res.ok) {
        toast.error(res.error);
        if (res.fieldErrors) setStep(1);
        await refresh();
        return;
      }
      if (res.kind === "cod") {
        toast.success("Order placed successfully");
        await refresh();
        router.push(res.redirectTo);
        return;
      }
      const outcome = await payWithRazorpay(res.payment);
      await refresh();
      if (outcome.status === "paid") {
        toast.success("Payment successful — order confirmed");
        router.push(res.redirectTo);
      } else if (outcome.status === "pending") {
        router.push(res.redirectTo);
      } else if (outcome.status === "failed") {
        router.push(`${res.redirectTo}&status=failed`);
      } else {
        toast("Payment not completed. You can retry from your order page.");
        router.push(res.redirectTo);
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]" role="status" aria-label="Loading checkout">
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
        <div className="skeleton h-96" />
      </div>
    );
  }

  const items = (cart?.items ?? []).filter((i) => i.quantity > 0);
  if (!items.length) {
    return (
      <EmptyState icon={<ShoppingBag />} title="Your cart is empty" description="Add a laptop to your cart to check out.">
        <Button asChild>
          <Link href="/laptops">Shop laptops</Link>
        </Button>
      </EmptyState>
    );
  }

  const totals = preview?.totals ?? cart!.totals;
  const quotes = preview?.quotes ?? [];
  const v = getValues();

  const summary = (
    <div>
      <ul className="divide-y divide-border">
        {items.map((i) => (
          <li key={i.productId} className="flex gap-3 py-3 first:pt-0">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-stage">
              <ProductImage src={i.image?.url} alt={i.image?.alt ?? i.name} fill sizes="64px" className="object-contain p-1.5" />
              <span className="num absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] text-white">
                {i.quantity}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-sm font-medium">{i.name}</span>
              <span className="block truncate font-mono text-[11px] text-muted">{i.specs}</span>
            </span>
            <span className="num text-sm font-medium">{formatPrice(i.price * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <SummaryRows
        totals={totals}
        couponCode={cart?.coupon?.code}
        shippingLabel={deliveryMethod === "EXPRESS" ? "Express shipping" : "Shipping"}
        className="mt-4 border-t border-border pt-4"
      />
    </div>
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid items-start gap-6 lg:grid-cols-[1fr_400px] lg:gap-8">
      {/* Mobile summary toggle */}
      <div className="rounded-xl border border-border bg-surface lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          aria-expanded={summaryOpen}
          className="flex w-full items-center justify-between px-5 py-4 text-sm"
        >
          <span className="inline-flex items-center gap-2 font-medium">
            <ShoppingBag className="size-4" aria-hidden /> {summaryOpen ? "Hide" : "Show"} order summary
            <ChevronDown className={cn("size-4 transition-transform", summaryOpen && "rotate-180")} aria-hidden />
          </span>
          <span className="num text-base font-semibold">{formatPrice(totals.total)}</span>
        </button>
        {summaryOpen && <div className="border-t border-border px-5 py-4">{summary}</div>}
      </div>

      <div className="min-w-0 space-y-3">
        <StepCard
          step={1}
          active={step === 1}
          done={maxStep > 1}
          onEdit={() => setStep(1)}
          summary={`${v.customer.name} · ${v.customer.email} · ${v.customer.phone}`}
        >
          {!signedIn && (
            <p className="mb-4 text-sm text-muted">
              Have an account?{" "}
              <Link href="/login?next=/checkout" className="font-medium text-accent hover:underline">
                Sign in
              </Link>{" "}
              for faster checkout. Or continue as a guest.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" error={errors.customer?.name?.message} className="sm:col-span-2">
              <Input id="name" autoComplete="name" aria-invalid={!!errors.customer?.name} {...register("customer.name")} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.customer?.email?.message} hint="For your order confirmation and invoice">
              <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.customer?.email} {...register("customer.email")} />
            </Field>
            <Field label="Mobile number" htmlFor="phone" error={errors.customer?.phone?.message} hint="For delivery updates">
              <Input id="phone" type="tel" autoComplete="tel-national" inputMode="tel" placeholder="98765 43210" aria-invalid={!!errors.customer?.phone} {...register("customer.phone")} />
            </Field>
          </div>
          <Button type="button" className="mt-5" onClick={() => next(1)}>
            Continue to shipping
          </Button>
        </StepCard>

        <StepCard
          step={2}
          active={step === 2}
          done={maxStep > 2}
          onEdit={() => setStep(2)}
          summary={[v.address.line1, v.address.line2, v.address.city, v.address.state, v.address.pincode].filter(Boolean).join(", ")}
        >
          {addresses.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium">Saved addresses</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setValue("address.line1", a.line1, { shouldValidate: true });
                      setValue("address.line2", a.line2 ?? "");
                      setValue("address.landmark", a.landmark ?? "");
                      setValue("address.city", a.city, { shouldValidate: true });
                      setValue("address.state", a.state as CheckoutInput["address"]["state"], { shouldValidate: true });
                      setValue("address.pincode", a.pincode, { shouldValidate: true });
                    }}
                    className="rounded-lg border border-border p-3 text-left text-[13px] hover:border-foreground/40"
                  >
                    <span className="font-medium">{a.fullName}</span>
                    <span className="mt-0.5 block text-muted">
                      {a.line1}, {a.city} {a.pincode}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Flat / house no., building, street" htmlFor="line1" error={errors.address?.line1?.message} className="sm:col-span-2">
              <Input id="line1" autoComplete="address-line1" aria-invalid={!!errors.address?.line1} {...register("address.line1")} />
            </Field>
            <Field label="Area / locality" htmlFor="line2" optional className="sm:col-span-2">
              <Input id="line2" autoComplete="address-line2" {...register("address.line2")} />
            </Field>
            <Field label="Landmark" htmlFor="landmark" optional>
              <Input id="landmark" {...register("address.landmark")} />
            </Field>
            <Field label="PIN code" htmlFor="pincode" error={errors.address?.pincode?.message}>
              <Input id="pincode" autoComplete="postal-code" inputMode="numeric" maxLength={6} aria-invalid={!!errors.address?.pincode} {...register("address.pincode")} />
            </Field>
            <Field label="City" htmlFor="city" error={errors.address?.city?.message}>
              <Input id="city" autoComplete="address-level2" aria-invalid={!!errors.address?.city} {...register("address.city")} />
            </Field>
            <Field label="State" htmlFor="state" error={errors.address?.state?.message}>
              <NativeSelect id="state" autoComplete="address-level1" aria-invalid={!!errors.address?.state} {...register("address.state")}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          {signedIn && (
            <label className="mt-4 flex items-center gap-2 text-sm">
              <Checkbox checked={!!saveAddress} onCheckedChange={(c) => setValue("saveAddress", c === true)} />
              Save this address to my account
            </label>
          )}
          <Button type="button" className="mt-5" onClick={() => next(2)}>
            Continue to delivery
          </Button>
        </StepCard>

        <StepCard
          step={3}
          active={step === 3}
          done={maxStep > 3}
          onEdit={() => setStep(3)}
          summary={quotes.find((q) => q.method === deliveryMethod)?.label}
        >
          <fieldset>
            <legend className="sr-only">Choose delivery method</legend>
            <div className="grid gap-3">
              {(quotes.length ? quotes : [{ method: "STANDARD" as const, label: "Standard delivery", fee: 0, minDays: 3, maxDays: 7, available: true }]).map((q) => (
                <label
                  key={q.method}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors",
                    deliveryMethod === q.method ? "border-foreground bg-subtle" : "border-border hover:border-border-strong",
                  )}
                >
                  <input type="radio" value={q.method} className="size-4 accent-[#111827]" {...register("deliveryMethod")} />
                  <Truck className="size-5 text-muted" aria-hidden />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{q.label}</span>
                    <span className="block text-[13px] text-muted">
                      {q.minDays}–{q.maxDays} business days after dispatch
                    </span>
                  </span>
                  <span className="num text-sm font-semibold">{q.fee === 0 ? <span className="text-success">Free</span> : formatPrice(q.fee)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="button" className="mt-5" onClick={() => next(3)}>
            Continue to payment
          </Button>
        </StepCard>

        <StepCard
          step={4}
          active={step === 4}
          done={maxStep > 4}
          onEdit={() => setStep(4)}
          summary={paymentMethod === "COD" ? "Cash on delivery" : "Pay online (UPI, cards, net banking, wallets)"}
        >
          <fieldset>
            <legend className="sr-only">Choose payment method</legend>
            <div className="grid gap-3">
              <label
                className={cn(
                  "flex items-center gap-4 rounded-lg border p-4 transition-colors",
                  preview && !preview.onlineAvailable ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                  paymentMethod === "RAZORPAY" ? "border-foreground bg-subtle" : "border-border hover:border-border-strong",
                )}
              >
                <input type="radio" value="RAZORPAY" disabled={!!preview && !preview.onlineAvailable} className="size-4 accent-[#111827]" {...register("paymentMethod")} />
                <CreditCard className="size-5 text-muted" aria-hidden />
                <span className="flex-1">
                  <span className="block text-sm font-medium">Pay online</span>
                  <span className="block text-[13px] text-muted">
                    {preview && !preview.onlineAvailable ? "Temporarily unavailable" : "UPI, credit/debit cards, net banking and wallets via Razorpay"}
                  </span>
                </span>
              </label>
              <label
                className={cn(
                  "flex items-center gap-4 rounded-lg border p-4 transition-colors",
                  preview && !preview.codAvailable ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                  paymentMethod === "COD" ? "border-foreground bg-subtle" : "border-border hover:border-border-strong",
                )}
              >
                <input type="radio" value="COD" disabled={!!preview && !preview.codAvailable} className="size-4 accent-[#111827]" {...register("paymentMethod")} />
                <Banknote className="size-5 text-muted" aria-hidden />
                <span className="flex-1">
                  <span className="block text-sm font-medium">Cash on delivery</span>
                  <span className="block text-[13px] text-muted">
                    {preview && !preview.codAvailable
                      ? "Not available for this order"
                      : preview?.codFee
                        ? `${formatPrice(preview.codFee)} COD fee applies`
                        : "Pay when your laptop arrives"}
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
          <Button type="button" className="mt-5" onClick={() => next(4)}>
            Review order
          </Button>
        </StepCard>

        <StepCard step={5} active={step === 5} done={false} onEdit={() => setStep(5)}>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="eyebrow">Contact</dt>
              <dd className="mt-1">
                {v.customer.name}
                <br />
                {v.customer.email}
                <br />
                {v.customer.phone}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Ship to</dt>
              <dd className="mt-1">
                {v.address.line1}
                {v.address.line2 ? `, ${v.address.line2}` : ""}
                <br />
                {v.address.city}, {v.address.state} {v.address.pincode}
              </dd>
            </div>
          </dl>
          <Field label="Order notes" htmlFor="notes" optional className="mt-5">
            <Textarea id="notes" rows={2} maxLength={300} placeholder="Delivery instructions, GST details for invoice…" {...register("notes")} />
          </Field>
          <Button type="submit" size="lg" className="mt-5 w-full sm:w-auto" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : <Lock />}
            {paymentMethod === "COD" ? `Place order · ${formatPrice(totals.total)}` : `Pay ${formatPrice(totals.total)}`}
          </Button>
          <p className="mt-3 text-xs text-muted">
            By placing your order you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">
              terms
            </Link>
            ,{" "}
            <Link href="/returns" className="underline underline-offset-2">
              return policy
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline underline-offset-2">
              privacy policy
            </Link>
            .
          </p>
        </StepCard>
      </div>

      <aside aria-label="Order summary" className="hidden rounded-xl border border-border bg-surface p-6 lg:sticky lg:top-32 lg:block">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Order summary</h2>
        {summary}
        <p className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted">
          <Lock className="size-3.5" aria-hidden /> Payments are verified securely on our servers.
        </p>
      </aside>
    </form>
  );
}
