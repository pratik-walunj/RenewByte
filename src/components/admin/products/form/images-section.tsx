"use client";

import { useRef, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Link2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection, RootError, TextField } from "@/components/admin/form/fields";

type Signature = { timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string };

async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
  const signRes = await fetch("/api/admin/cloudinary/sign", { method: "POST" });
  if (!signRes.ok) throw new Error("Could not authorise the upload.");
  const sig = (await signRes.json()) as Signature;
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("signature", sig.signature);
  body.append("folder", sig.folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(sig.cloudName)}/image/upload`, {
    method: "POST",
    body,
  });
  const json = (await res.json()) as { secure_url?: string; public_id?: string; error?: { message?: string } };
  if (!res.ok || !json.secure_url) throw new Error(json.error?.message ?? "Upload failed.");
  return { url: json.secure_url, publicId: json.public_id ?? "" };
}

const MAX_BYTES = 10 * 1024 * 1024;

export function ImagesSection({ cloudinaryEnabled, productName }: { cloudinaryEnabled: boolean; productName: string }) {
  const { control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name: "images" });
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const full = fields.length >= 12;

  function addUrl() {
    const value = url.trim();
    if (!value) return;
    if (!value.startsWith("/") && !/^https:\/\//.test(value)) {
      toast.error("Use an https:// URL or a path starting with /.");
      return;
    }
    append({ url: value, alt: productName, publicId: null }, { shouldFocus: false });
    setUrl("");
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 12 - fields.length);
    for (const file of list) {
      if (!file.type.startsWith("image/") || file.size > MAX_BYTES) {
        toast.error(`${file.name}: choose an image under 10 MB.`);
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const res = await uploadToCloudinary(file);
        append({ url: res.url, alt: productName, publicId: res.publicId || null }, { shouldFocus: false });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <FormSection
      id="images"
      title="Images"
      description="The first image is the main photo. Every image needs alt text describing what it shows."
    >
      {fields.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-4 py-8 text-center">
          <ImagePlus className="size-6 text-faint" aria-hidden />
          <p className="text-sm text-muted">No images yet. Add one by URL{cloudinaryEnabled ? " or upload" : ""}.</p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {fields.map((field, i) => (
            <ImageRow
              key={field.id}
              index={i}
              src={(field as { url?: string }).url ?? ""}
              count={fields.length}
              onUp={() => move(i, i - 1)}
              onDown={() => move(i, i + 1)}
              onRemove={() => remove(i)}
            />
          ))}
        </ol>
      )}
      <RootError name="images" />

      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="image-url" className="text-sm font-medium">
            Add image by URL
          </label>
          <Input
            id="image-url"
            type="url"
            inputMode="url"
            placeholder="https://res.cloudinary.com/…/laptop.jpg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={addUrl} disabled={full || !url.trim()}>
            <Link2 /> Add
          </Button>
          {cloudinaryEnabled && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => onFiles(e.target.files)}
              />
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()} disabled={full || uploading > 0}>
                <Upload /> {uploading > 0 ? "Uploading…" : "Upload"}
              </Button>
            </>
          )}
        </div>
      </div>
    </FormSection>
  );
}

function ImageRow({
  index,
  src,
  count,
  onUp,
  onDown,
  onRemove,
}: {
  index: number;
  src: string;
  count: number;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-start">
      <div className="flex items-start gap-3 sm:contents">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element -- previews of arbitrary admin-entered URLs */}
          <img src={src} alt="" className="size-full object-contain" />
          {index === 0 && (
            <span className="absolute inset-x-0 bottom-0 bg-primary/85 py-0.5 text-center text-[10px] font-medium text-white">Main</span>
          )}
        </div>
        <p className="min-w-0 flex-1 truncate pt-1 font-mono text-xs text-muted sm:hidden">{src}</p>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="hidden truncate font-mono text-xs text-muted sm:block">{src}</p>
        <TextField name={`images.${index}.alt`} label={`Alt text for image ${index + 1}`} placeholder="Front view, lid open, showing keyboard" />
      </div>
      <div className="flex gap-1 sm:flex-col">
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move image ${index + 1} up`} disabled={index === 0} onClick={onUp}>
          <ArrowUp />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move image ${index + 1} down`} disabled={index === count - 1} onClick={onDown}>
          <ArrowDown />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove image ${index + 1}`} onClick={onRemove}>
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
