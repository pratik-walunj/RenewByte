import type { MetadataRoute } from "next";

/** PWA manifest — makes the store installable; no service worker is required. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RenewByte — Certified Refurbished Laptops",
    short_name: "RenewByte",
    description: "Professionally tested refurbished laptops with warranty.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#111827",
    categories: ["shopping", "electronics"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
