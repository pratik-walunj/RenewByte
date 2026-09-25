"use client";

import { useWatch } from "react-hook-form";
import { discountPercent, formatPrice, rupeesToPaise } from "@/lib/format";
import { CONDITION_GRADES, GRADE_LABEL } from "@/lib/constants";
import { FormSection, Grid, NumberField, SelectField, TextField } from "@/components/admin/form/fields";

export function PricingSection() {
  const [mrp, price] = useWatch({ name: ["mrpRupees", "priceRupees"] }) as [number, number];
  const valid = Number.isFinite(mrp) && Number.isFinite(price) && mrp > 0 && price > 0;
  const pct = valid ? discountPercent(rupeesToPaise(mrp), rupeesToPaise(price)) : 0;

  return (
    <FormSection id="pricing" title="Pricing" description="Enter amounts in rupees. Prices are stored exactly, to the paisa.">
      <Grid>
        <NumberField name="mrpRupees" label="MRP (₹)" step="0.01" min={0} hint="Price of the equivalent new unit" />
        <NumberField name="priceRupees" label="Selling price (₹)" step="0.01" min={0} />
      </Grid>
      <p className="rounded-lg bg-subtle px-3 py-2.5 text-sm" aria-live="polite">
        {valid ? (
          price > mrp ? (
            <span className="text-sale">Selling price is above MRP.</span>
          ) : (
            <>
              Customers see <strong className="num">{formatPrice(rupeesToPaise(price))}</strong>
              {pct > 0 && (
                <>
                  {" "}
                  — <strong className="num">{pct}% off</strong>, saving{" "}
                  <span className="num">{formatPrice(rupeesToPaise(mrp - price))}</span>
                </>
              )}
              .
            </>
          )
        ) : (
          <span className="text-muted">Enter MRP and selling price to see the discount.</span>
        )}
      </p>
    </FormSection>
  );
}

export function ConditionSection() {
  return (
    <FormSection id="condition" title="Condition & warranty">
      <Grid>
        <SelectField
          name="conditionGrade"
          label="Condition grade"
          options={CONDITION_GRADES.map((g) => ({ value: g, label: GRADE_LABEL[g] }))}
        />
        <NumberField name="warrantyMonths" label="Warranty" suffix="months" min={0} max={60} />
        <NumberField name="batteryHealth" label="Battery health" suffix="%" nullable optional min={0} max={100} />
        <TextField name="batteryBackup" label="Battery backup" optional placeholder="3–4 hours typical use" />
      </Grid>
    </FormSection>
  );
}
