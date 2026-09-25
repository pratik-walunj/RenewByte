"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ProductImage } from "@/components/product/product-image";
import { cn } from "@/lib/utils";

type Img = { url: string; alt: string };

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);
  const [zoom, setZoom] = React.useState<{ x: number; y: number } | null>(null);
  const [fullscreen, setFullscreen] = React.useState(false);
  const reduce = useReducedMotion();
  const count = images.length;
  const current = images[index];

  const go = React.useCallback(
    (next: number) => {
      if (!count) return;
      setDirection(next > index ? 1 : -1);
      setIndex((next + count) % count);
    },
    [count, index],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(index + 1);
    if (e.key === "ArrowLeft") go(index - 1);
  };

  if (!count) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-stage">
        <ProductImage alt={name} />
      </div>
    );
  }

  const slide = {
    enter: (d: number) => ({ x: reduce ? 0 : d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: reduce ? 0 : d * -40, opacity: 0 }),
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse">
      <div
        className="group relative aspect-[4/3] flex-1 touch-pan-y overflow-hidden rounded-2xl border border-border bg-stage"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${name} images`}
        tabIndex={0}
        onKeyDown={onKey}
        onMouseMove={(e) => {
          if (window.matchMedia("(hover: none)").matches) return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 || info.velocity.x < -400) go(index + 1);
              else if (info.offset.x > 60 || info.velocity.x > 400) go(index - 1);
            }}
            className="absolute inset-0 cursor-zoom-in"
            onClick={() => setFullscreen(true)}
          >
            <Image
              src={current.url}
              alt={current.alt}
              fill
              priority={index === 0}
              fetchPriority={index === 0 ? "high" : undefined}
              sizes="(min-width: 1024px) 640px, 100vw"
              draggable={false}
              className="object-contain p-4 transition-transform duration-200 ease-out select-none sm:p-8"
              style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-card backdrop-blur hover:bg-surface"
          aria-label="View fullscreen"
        >
          <Expand className="size-4" />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="absolute top-1/2 left-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-card opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 sm:inline-flex"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="absolute top-1/2 right-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-card opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 sm:inline-flex"
              aria-label="Next image"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden" aria-hidden>
              {images.map((_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-4 bg-foreground" : "w-1.5 bg-foreground/25")} />
              ))}
            </div>
          </>
        )}
        <p className="sr-only" aria-live="polite">
          Image {index + 1} of {count}: {current.alt}
        </p>
      </div>

      {count > 1 && (
        <ul className="scrollbar-none flex gap-2 overflow-x-auto lg:w-20 lg:flex-col lg:overflow-visible" aria-label="Choose image">
          {images.map((img, i) => (
            <li key={img.url + i} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Show image ${i + 1}: ${img.alt}`}
                aria-current={i === index}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-lg border bg-stage transition-colors sm:size-20",
                  i === index ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-border-strong",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="h-[calc(100dvh-2rem)] max-w-[min(1200px,calc(100vw-2rem))] p-0" onKeyDown={onKey}>
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <DialogDescription className="sr-only">
            Image {index + 1} of {count}. Use the arrow keys to browse.
          </DialogDescription>
          <div className="relative size-full bg-stage">
            <Image src={current.url} alt={current.alt} fill sizes="100vw" className="object-contain p-6 sm:p-12" />
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  className="absolute top-1/2 left-3 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface shadow-card"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  className="absolute top-1/2 right-3 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface shadow-card"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5" />
                </button>
                <p className="num absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-surface px-3 py-1 text-xs font-medium shadow-card">
                  {index + 1} / {count}
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
