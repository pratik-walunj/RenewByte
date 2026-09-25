import Image, { type ImageProps } from "next/image";
import { Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

/** next/image with a graceful placeholder when a product has no photo yet. */
export function ProductImage({
  src,
  alt,
  className,
  ...props
}: Omit<ImageProps, "src" | "alt"> & { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className={cn("flex size-full items-center justify-center text-faint", className)} role="img" aria-label={alt}>
        <Laptop className="size-1/3 max-h-16 max-w-16" strokeWidth={1.25} />
      </div>
    );
  }
  return <Image src={src} alt={alt} className={className} {...props} />;
}
