"use client";

import { STORAGE_TYPE_LABEL } from "@/lib/constants";
import { FormSection, Grid, NumberField, SelectField, TextField } from "@/components/admin/form/fields";
import { STORAGE_TYPES } from "@/server/admin/schemas/product";

export function SpecsSection() {
  return (
    <FormSection id="specs" title="Specifications" description="Structured specs power filters, comparison and search.">
      <div role="group" aria-labelledby="spec-group-1" className="flex flex-col gap-4">
        <p id="spec-group-1" className="eyebrow">Processor</p>
        <TextField name="processor" label="Processor" placeholder="Intel Core i5-8350U (up to 3.6 GHz, 4 cores)" />
        <Grid cols={3}>
          <SelectField
            name="processorBrand"
            label="Processor brand"
            options={["Intel", "AMD", "Apple", "Qualcomm", "MediaTek"].map((v) => ({ value: v, label: v }))}
          />
          <TextField name="processorFamily" label="Family" placeholder="Core i5" hint="Used by filters" />
          <TextField name="processorGeneration" label="Generation" optional placeholder="8th Gen" />
        </Grid>
      </div>

      <div role="group" aria-labelledby="spec-group-2" className="flex flex-col gap-4 border-t border-border pt-4">
        <p id="spec-group-2" className="eyebrow">Memory & storage</p>
        <Grid>
          <NumberField name="ramGb" label="RAM" suffix="GB" min={1} />
          <TextField name="ramType" label="RAM type" optional placeholder="DDR4" />
          <NumberField name="storageGb" label="Storage" suffix="GB" min={1} hint="1TB = 1024" />
          <SelectField
            name="storageType"
            label="Storage type"
            options={STORAGE_TYPES.map((s) => ({ value: s, label: STORAGE_TYPE_LABEL[s] }))}
          />
        </Grid>
      </div>

      <div role="group" aria-labelledby="spec-group-3" className="flex flex-col gap-4 border-t border-border pt-4">
        <p id="spec-group-3" className="eyebrow">Display & graphics</p>
        <Grid cols={3}>
          <NumberField name="displaySize" label="Display size" suffix="in" step="0.1" min={7} max={21} />
          <TextField name="resolution" label="Resolution" optional placeholder="1920 × 1080" />
          <TextField name="displayType" label="Display type" optional placeholder="IPS, anti-glare" />
        </Grid>
        <Grid>
          <TextField name="graphics" label="Graphics" placeholder="Intel UHD Graphics 620" />
          <SelectField
            name="gpuType"
            label="GPU type"
            options={[
              { value: "INTEGRATED", label: "Integrated" },
              { value: "DEDICATED", label: "Dedicated" },
            ]}
          />
        </Grid>
      </div>

      <div role="group" aria-labelledby="spec-group-4" className="flex flex-col gap-4 border-t border-border pt-4">
        <p id="spec-group-4" className="eyebrow">Other</p>
        <Grid>
          <TextField name="operatingSystem" label="Operating system" placeholder="Windows 11 Pro" />
          <NumberField name="weightKg" label="Weight" suffix="kg" step="0.01" nullable optional />
          <TextField name="color" label="Colour" optional placeholder="Black" />
          <TextField name="keyboard" label="Keyboard" optional placeholder="Backlit, full-size" />
        </Grid>
      </div>
    </FormSection>
  );
}
