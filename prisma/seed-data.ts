/**
 * DEMO DATA — sample catalogue for development and previews.
 *
 * Every product created from this file is flagged `isDemo: true` and shows a
 * "Demo listing" notice on the storefront. Specifications are realistic for
 * each model, but prices, stock and battery figures are illustrative only.
 * Delete demo products from /admin before going live.
 */

export const BRANDS = [
  { name: "Dell", slug: "dell", description: "Latitude business laptops and XPS premium ultrabooks, known for serviceability and robust build quality." },
  { name: "HP", slug: "hp", description: "EliteBook and ProBook business machines with strong keyboards, security features and long support life." },
  { name: "Lenovo", slug: "lenovo", description: "ThinkPad laptops, famous for their keyboards, durability testing and easy upgradability." },
  { name: "Apple", slug: "apple", description: "MacBook Air and MacBook Pro with Apple silicon — excellent battery life and build quality." },
  { name: "Acer", slug: "acer", description: "Value-focused laptops from the Aspire, Swift and Nitro ranges." },
  { name: "Asus", slug: "asus", description: "ZenBook ultraportables and TUF / ROG gaming laptops." },
  { name: "Microsoft", slug: "microsoft", description: "Surface laptops and 2-in-1s with high-resolution touch displays." },
  { name: "MSI", slug: "msi", description: "Performance and gaming laptops with dedicated graphics." },
];

export const CATEGORIES = [
  { name: "Business Laptops", slug: "business-laptops", description: "Durable, secure machines built for all-day work." },
  { name: "Student Laptops", slug: "student-laptops", description: "Reliable, portable laptops for classes, assignments and online learning." },
  { name: "Gaming Laptops", slug: "gaming-laptops", description: "Dedicated graphics and high-refresh displays for gaming and creative work." },
  { name: "MacBooks", slug: "macbooks", description: "Refurbished MacBook Air and MacBook Pro with Apple silicon." },
  { name: "Budget Laptops", slug: "budget-laptops", description: "Dependable everyday laptops at the lowest prices." },
  { name: "Premium Laptops", slug: "premium-laptops", description: "Flagship build, displays and performance at a refurbished price." },
  { name: "2-in-1 Laptops", slug: "2-in-1-laptops", description: "Convertible touchscreen laptops that fold into a tablet." },
  { name: "Ultrabooks", slug: "ultrabooks", description: "Thin, light laptops for working on the move." },
];

type Grade = "A_PLUS" | "A" | "B" | "C";
type Style = "silver" | "graphite" | "black" | "spacegray" | "midnight" | "gaming";

export type SeedProduct = {
  name: string;
  brand: string;
  category: string;
  sku: string;
  price: number; // rupees
  mrp: number; // rupees
  grade: Grade;
  warranty: number;
  processor: string;
  processorBrand: "Intel" | "AMD" | "Apple";
  family: string;
  generation: string | null;
  ram: number;
  ramType: string;
  storage: number;
  storageType: "NVME_SSD" | "SSD";
  display: number;
  resolution: string;
  displayType: string;
  graphics: string;
  dedicated?: boolean;
  os: string;
  battery: number;
  backup: string;
  weight: number;
  color: string;
  keyboard: string;
  ports: string[];
  features: string[];
  stock: number;
  style: Style;
  flags?: { featured?: boolean; bestSeller?: boolean; deal?: boolean; dealDays?: number };
  short: string;
};

const WIN_PORTS_BIZ = ["2 × USB-A 3.2", "1 × USB-C / Thunderbolt 4", "HDMI 2.0", "3.5 mm audio", "RJ-45 Ethernet"];
const MAC_PORTS = ["2 × Thunderbolt / USB 4", "3.5 mm headphone jack"];

export const PRODUCTS: SeedProduct[] = [
  // ─── Dell ────────────────────────────────────────────────
  {
    name: "Dell Latitude 5420", brand: "dell", category: "business-laptops", sku: "RB-DL5420-01",
    price: 34999, mrp: 42999, grade: "A", warranty: 6,
    processor: "Intel Core i5-1145G7", processorBrand: "Intel", family: "Core i5", generation: "11th Gen",
    ram: 16, ramType: "DDR4 3200MHz", storage: 512, storageType: "NVME_SSD",
    display: 14, resolution: "1920 × 1080 (FHD)", displayType: "IPS anti-glare", graphics: "Intel Iris Xe",
    os: "Windows 11 Pro", battery: 88, backup: "6–7 hours", weight: 1.44, color: "Grey", keyboard: "English (US), backlit",
    ports: WIN_PORTS_BIZ, features: ["Fingerprint reader", "Backlit keyboard", "Webcam privacy shutter", "Wi-Fi 6"],
    stock: 12, style: "graphite", flags: { featured: true, bestSeller: true },
    short: "A dependable 14-inch business laptop with 11th Gen Core i5, 16GB RAM and a fast NVMe SSD.",
  },
  {
    name: "Dell Latitude 5410", brand: "dell", category: "business-laptops", sku: "RB-DL5410-01",
    price: 27999, mrp: 36999, grade: "B", warranty: 6,
    processor: "Intel Core i5-10310U", processorBrand: "Intel", family: "Core i5", generation: "10th Gen",
    ram: 8, ramType: "DDR4 2666MHz", storage: 256, storageType: "NVME_SSD",
    display: 14, resolution: "1920 × 1080 (FHD)", displayType: "IPS anti-glare", graphics: "Intel UHD Graphics",
    os: "Windows 11 Pro", battery: 81, backup: "4–5 hours", weight: 1.52, color: "Grey", keyboard: "English (US)",
    ports: WIN_PORTS_BIZ, features: ["Fingerprint reader", "Upgradeable RAM", "Wi-Fi 6"],
    stock: 8, style: "graphite", flags: { deal: true, dealDays: 5 },
    short: "Affordable 10th Gen Latitude — a solid workhorse for office work and study.",
  },
  {
    name: "Dell Latitude 7420", brand: "dell", category: "premium-laptops", sku: "RB-DL7420-01",
    price: 44999, mrp: 56999, grade: "A_PLUS", warranty: 12,
    processor: "Intel Core i7-1185G7", processorBrand: "Intel", family: "Core i7", generation: "11th Gen",
    ram: 16, ramType: "LPDDR4x 4266MHz", storage: 512, storageType: "NVME_SSD",
    display: 14, resolution: "1920 × 1080 (FHD)", displayType: "IPS, 400 nits", graphics: "Intel Iris Xe",
    os: "Windows 11 Pro", battery: 92, backup: "8–9 hours", weight: 1.26, color: "Aluminium", keyboard: "English (US), backlit",
    ports: ["2 × Thunderbolt 4", "1 × USB-A 3.2", "HDMI 2.0", "3.5 mm audio"], features: ["Carbon-fibre / aluminium build", "Fingerprint reader", "IR camera", "Wi-Fi 6"],
    stock: 4, style: "silver", flags: { featured: true, bestSeller: true },
    short: "Premium, lightweight Latitude with Core i7, Thunderbolt 4 and excellent battery life.",
  },
  {
    name: "Dell Latitude 3510", brand: "dell", category: "budget-laptops", sku: "RB-DL3510-01",
    price: 21999, mrp: 29999, grade: "B", warranty: 6,
    processor: "Intel Core i5-10210U", processorBrand: "Intel", family: "Core i5", generation: "10th Gen",
    ram: 8, ramType: "DDR4 2666MHz", storage: 256, storageType: "SSD",
    display: 15.6, resolution: "1366 × 768 (HD)", displayType: "Anti-glare", graphics: "Intel UHD Graphics",
    os: "Windows 11 Pro", battery: 78, backup: "4 hours", weight: 1.84, color: "Black", keyboard: "English (US) with numpad",
    ports: ["3 × USB-A 3.2", "1 × USB-C", "HDMI", "RJ-45 Ethernet", "SD card reader"], features: ["Numeric keypad", "Upgradeable RAM & storage"],
    stock: 15, style: "black", flags: { deal: true, dealDays: 5, bestSeller: true },
    short: "Large-screen value laptop with a full numeric keypad — ideal for spreadsheets and billing.",
  },
  {
    name: "Dell XPS 13 9310", brand: "dell", category: "ultrabooks", sku: "RB-DXPS9310-01",
    price: 52999, mrp: 69999, grade: "A", warranty: 12,
    processor: "Intel Core i7-1165G7", processorBrand: "Intel", family: "Core i7", generation: "11th Gen",
    ram: 16, ramType: "LPDDR4x 4267MHz", storage: 512, storageType: "NVME_SSD",
    display: 13.4, resolution: "1920 × 1200 (FHD+)", displayType: "InfinityEdge, 500 nits", graphics: "Intel Iris Xe",
    os: "Windows 11 Home", battery: 89, backup: "8 hours", weight: 1.27, color: "Platinum silver", keyboard: "English (US), backlit",
    ports: ["2 × Thunderbolt 4", "microSD reader"], features: ["16:10 display", "Fingerprint in power button", "Wi-Fi 6"],
    stock: 3, style: "silver", flags: { featured: true },
    short: "Compact flagship ultrabook with a sharp 16:10 display and machined aluminium body.",
  },
  {
    name: "Dell Latitude 7490", brand: "dell", category: "student-laptops", sku: "RB-DL7490-01",
    price: 24499, mrp: 32999, grade: "A", warranty: 6,
    processor: "Intel Core i5-8350U", processorBrand: "Intel", family: "Core i5", generation: "8th Gen",
    ram: 8, ramType: "DDR4 2400MHz", storage: 256, storageType: "NVME_SSD",
    display: 14, resolution: "1920 × 1080 (FHD)", displayType: "IPS anti-glare", graphics: "Intel UHD Graphics 620",
    os: "Windows 11 Pro", battery: 84, backup: "5–6 hours", weight: 1.4, color: "Black", keyboard: "English (US), backlit",
    ports: WIN_PORTS_BIZ, features: ["Backlit keyboard", "Carbon-fibre lid", "Upgradeable RAM"],
    stock: 10, style: "black",
    short: "Lightweight, well-built 14-inch laptop that handles study and office work with ease.",
  },

  // ─── HP ─────────────────────────────────────────────────
  {
    name: "HP EliteBook 840 G8", brand: "hp", category: "business-laptops", sku: "RB-HP840G8-01",
    price: 38999, mrp: 49999, grade: "A", warranty: 6,
    processor: "Intel Core i5-1135G7", processorBrand: "Intel", family: "Core i5", generation: "11th Gen",
    ram: 16, ramType: "DDR4 3200MHz", storage: 512, storageType: "NVME_SSD",
    display: 14, resolution: "1920 × 1080 (FHD)", displayType: "IPS, 400 nits", graphics: "Intel Iris Xe",
    os: "Windows 11 Pro", battery: 90, backup: "7–8 hours", weight: 1.33, color: "Silver", keyboard: "English (US), backlit",
    ports: ["2 × Thunderbolt 4", "2 × USB-A 3.2", "HDMI 2.0", "3.5 mm audio"], features: ["Aluminium chassis", "Fingerprint reader", "Bang & Olufsen audio", "Wi-Fi 6"],
    stock: 9, style: "silver", flags: { featured: true, bestSeller: true },
    short: "Premium aluminium business laptop with Thunderbolt 4, great speakers and 16GB RAM.",
  },
  {
    name: "HP EliteBook 830 G7", brand: "hp", category: "ultrabooks", sku: "RB-HP830G7-01",
    price: 31999, mrp: 41999, grade: "A", warranty: 6,
    processor: "Intel Core i5-10310U", processorBrand: "Intel", family: "Core i5", generation: "10th Gen",
    ram: 16, ramType: "DDR4 2666MHz", storage: 256, storageType: "NVME_SSD",
    display: 13.3, resolution: "1920 × 1080 (FHD)", displayType: "IPS", graphics: "Intel UHD Graphics",
    os: "Windows 11 Pro", battery: 86, backup: "6–7 hours", weight: 1.28, color: "Silver", keyboard: "English (US), backlit",
    ports: ["1 × Thunderbolt 3", "2 × USB-A 3.1", "HDMI 1.4", "3.5 mm audio"], features: ["Compact 13.3-inch body", "Fingerprint reader", "Privacy camera shutter"],
    stock: 6, style: "silver", flags: { deal: true, dealDays: 3 },
    short: "Compact, travel-friendly 13-inch EliteBook with 16GB RAM.",
  },
  {
    name: "HP ProBook 450 G8", brand: "hp", category: "student-laptops", sku: "RB-HP450G8-01",
    price: 29999, mrp: 39999, grade: "B", warranty: 6,
    processor: "Intel Core i5-1135G7", processorBrand: "Intel", family: "Core i5", generation: "11th Gen",
    ram: 8, ramType: "DDR4 3200MHz", storage: 512, storageType: "NVME_SSD",
    display: 15.6, resolution: "1920 × 1080 (FHD)", displayType: "IPS anti-glare", graphics: "Intel Iris Xe",
    os: "Windows 11 Pro", battery: 83, backup: "5–6 hours", weight: 1.74, color: "Pike silver", keyboard: "English (US) with numpad",
    ports: ["1 × USB-C", "2 × USB-A 3.1", "HDMI 2.0", "RJ-45 Ethernet", "3.5 mm audio"], features: ["Numeric keypad", "Fingerprint reader", "Wi-Fi 6"],
    stock: 11, style: "spacegray", flags: { bestSeller: true },
    short: "15.6-inch FHD laptop with Iris Xe graphics — a great all-rounder for students.",
  },
  {
    name: "HP EliteBook x360 1030 G3", brand: "hp", category: "2-in-1-laptops", sku: "RB-HPX3601030-01",
    price: 33999, mrp: 45999, grade: "A", warranty: 6,
    processor: "Intel Core i7-8650U", processorBrand: "Intel", family: "Core i7", generation: "8th Gen",
    ram: 16, ramType: "LPDDR3 2133MHz", storage: 512, storageType: "NVME_SSD",
    display: 13.3, resolution: "1920 × 1080 (FHD)", displayType: "Touchscreen, 360° hinge", graphics: "Intel UHD Graphics 620",
    os: "Windows 11 Pro", battery: 82, backup: "6 hours", weight: 1.25, color: "Silver", keyboard: "English (US), backlit",
    ports: ["2 × Thunderbolt 3", "1 × USB-A 3.1", "HDMI 1.4", "3.5 mm audio"], features: ["Convertible 2-in-1", "Pen support", "Touchscreen", "Fingerprint reader"],
    stock: 5, style: "silver",
    short: "Premium convertible that flips into a tablet, with touchscreen and pen support.",
  },
  {
    name: "HP 250 G8", brand: "hp", category: "budget-laptops", sku: "RB-HP250G8-01",
    price: 18999, mrp: 26999, grade: "B", warranty: 6,
    processor: "Intel Core i3-1115G4", processorBrand: "Intel", family: "Core i3", generation: "11th Gen",
    ram: 8, ramType: "DDR4 3200MHz", storage: 256, storageType: "NVME_SSD",
    display: 15.6, resolution: "1366 × 768 (HD)", displayType: "Anti-glare", graphics: "Intel UHD Graphics",
    os: "Windows 11 Home", battery: 80, backup: "4 hours", weight: 1.74, color: "Dark ash silver", keyboard: "English (US) with numpad",
    ports: ["2 × USB-A 3.1", "1 × USB-A 2.0", "HDMI 1.4", "RJ-45 Ethernet", "3.5 mm audio"], features: ["Numeric keypad", "SSD storage"],
    stock: 14, style: "graphite", flags: { deal: true, dealDays: 7 },
    short: "Entry-level laptop for browsing, video calls and office documents.",
  },

  // ─── Lenovo ─────────────────────────────────────────────
  {
    name: "Lenovo ThinkPad T14 Gen 2", brand: "lenovo", category: "business-laptops", sku: "RB-LT14G2-01",
    price: 36999, mrp: 47999, grade: "A", warranty: 6,
    processor: "Intel Core i5-1145G7", processorBrand: "Intel", family: "Core i5", generation: "11th Gen",
    ram: 16, ramType: "DDR4 3200MHz", storage: 512, storageType: "NVME_SSD",
    display: 14, resolution: "1920 × 1080 (FHD)", displayType: "IPS anti-glare", graphics: "Intel Iris Xe",
    os: "Windows 11 Pro", battery: 87, backup: "7 hours", weight: 1.47, color: "Black", keyboard: "English (US), backlit, spill-resistant",
    ports: ["1 × Thunderbolt 4", "1 × USB-C", "2 × USB-A 3.2", "HDMI 2.0", "RJ-45 Ethernet"], features: ["TrackPoint", "Spill-resistant keyboard", "Fingerprint reader", "Wi-Fi 6"],
    stock: 10, style: "black", flags: { featured: true, bestSeller: true },
    short: "The classic ThinkPad: excellent keyboard, TrackPoint and full-size ports.",
  },
  {
    name: "Lenovo ThinkPad X1 Carbon Gen 8", brand: "lenovo", category: "premium-laptops", sku: "RB-LX1C8-01",
    price: 47999, mrp: 64999, grade: "A_PLUS", warranty: 12,
    processor: "Intel Core i7-10610U", processorBrand: "Intel", family: "Core i7", generation: "10th Gen",
    ram: 16, ramType: "LPDDR3 2133MHz", storage: 512, storageType: "NVME_SSD",
    display: 14, resolution: "1920 × 1080 (FHD)", displayType: "IPS, 400 nits", graphics: "Intel UHD Graphics",
    os: "Windows 11 Pro", battery: 91, backup: "8 hours", weight: 1.09, color: "Black", keyboard: "English (US), backlit",
    ports: ["2 × Thunderbolt 3", "2 × USB-A 3.1", "HDMI 1.4", "3.5 mm audio"], features: ["Carbon-fibre chassis", "Under 1.1 kg", "Fingerprint reader", "Dolby Atmos speakers"],
    stock: 3, style: "black", flags: { featured: true },
    short: "Ultra-light carbon-fibre flagship ThinkPad at just 1.09 kg.",
  },
  {
    name: "Lenovo ThinkPad E14 Gen 2", brand: "lenovo", category: "student-laptops", sku: "RB-LE14G2-01",
    price: 26499, mrp: 35999, grade: "A", warranty: 6,
    processor: "AMD Ryzen 5 4500U", processorBrand: "AMD", family: "Ryzen 5", generation: "Ryzen 4000",
    ram: 8, ramType: "DDR4 3200MHz", storage: 256, storageType: "NVME_SSD",
    display: 14, resolution: "1920 × 1080 (FHD)", displayType: "IPS", graphics: "AMD Radeon Graphics",
    os: "Windows 11 Home", battery: 85, backup: "6 hours", weight: 1.59, color: "Black", keyboard: "English (US)",
    ports: ["1 × USB-C", "2 × USB-A 3.1", "HDMI 2.0", "RJ-45 Ethernet", "3.5 mm audio"], features: ["6-core processor", "Aluminium lid", "Upgradeable RAM"],
    stock: 9, style: "black", flags: { deal: true, dealDays: 5 },
    short: "Six-core Ryzen performance in a sturdy ThinkPad — great value for students.",
  },
  {
    name: "Lenovo ThinkPad L480", brand: "lenovo", category: "budget-laptops", sku: "RB-LL480-01",
    price: 16999, mrp: 23999, grade: "C", warranty: 3,
    processor: "Intel Core i5-8250U", processorBrand: "Intel", family: "Core i5", generation: "8th Gen",
    ram: 8, ramType: "DDR4 2400MHz", storage: 256, storageType: "SSD",
    display: 14, resolution: "1366 × 768 (HD)", displayType: "Anti-glare", graphics: "Intel UHD Graphics 620",
    os: "Windows 11 Pro", battery: 72, backup: "3–4 hours", weight: 1.68, color: "Black", keyboard: "English (US)",
    ports: ["1 × USB-C", "2 × USB-A 3.1", "HDMI", "VGA", "RJ-45 Ethernet"], features: ["TrackPoint", "Upgradeable RAM & storage"],
    stock: 7, style: "black",
    short: "Lowest-cost ThinkPad in stock. Heavier cosmetic wear, fully tested internals.",
  },
  {
    name: "Lenovo ThinkPad X1 Yoga Gen 5", brand: "lenovo", category: "2-in-1-laptops", sku: "RB-LX1Y5-01",
    price: 54999, mrp: 72999, grade: "A", warranty: 12,
    processor: "Intel Core i7-10610U", processorBrand: "Intel", family: "Core i7", generation: "10th Gen",
    ram: 16, ramType: "LPDDR3 2133MHz", storage: 512, storageType: "NVME_SSD",
    display: 14, resolution: "1920 × 1080 (FHD)", displayType: "Touchscreen, 360° hinge", graphics: "Intel UHD Graphics",
    os: "Windows 11 Pro", battery: 88, backup: "7 hours", weight: 1.35, color: "Iron grey", keyboard: "English (US), backlit",
    ports: ["2 × Thunderbolt 3", "2 × USB-A 3.1", "HDMI 1.4", "3.5 mm audio"], features: ["Garaged pen", "Convertible 2-in-1", "Aluminium body", "Fingerprint reader"],
    stock: 2, style: "spacegray",
    short: "Premium aluminium 2-in-1 with a built-in stylus garage.",
  },

  // ─── Apple ──────────────────────────────────────────────
  {
    name: "Apple MacBook Air M1 (2020)", brand: "apple", category: "macbooks", sku: "RB-MBA-M1-01",
    price: 49999, mrp: 69900, grade: "A", warranty: 6,
    processor: "Apple M1 (8-core CPU, 7-core GPU)", processorBrand: "Apple", family: "Apple M1", generation: null,
    ram: 8, ramType: "Unified memory", storage: 256, storageType: "NVME_SSD",
    display: 13.3, resolution: "2560 × 1600 (Retina)", displayType: "IPS, True Tone, 400 nits", graphics: "Apple 7-core GPU",
    os: "macOS Sonoma", battery: 89, backup: "12–14 hours", weight: 1.29, color: "Space grey", keyboard: "English (US), Magic Keyboard, backlit",
    ports: MAC_PORTS, features: ["Fanless, silent design", "Touch ID", "Retina display"],
    stock: 8, style: "spacegray", flags: { featured: true, bestSeller: true },
    short: "Silent, fanless and exceptionally efficient — still one of the best-value laptops you can buy.",
  },
  {
    name: "Apple MacBook Air M2 (2022)", brand: "apple", category: "macbooks", sku: "RB-MBA-M2-01",
    price: 69999, mrp: 99900, grade: "A_PLUS", warranty: 12,
    processor: "Apple M2 (8-core CPU, 8-core GPU)", processorBrand: "Apple", family: "Apple M2", generation: null,
    ram: 8, ramType: "Unified memory", storage: 256, storageType: "NVME_SSD",
    display: 13.6, resolution: "2560 × 1664 (Liquid Retina)", displayType: "IPS, 500 nits", graphics: "Apple 8-core GPU",
    os: "macOS Sonoma", battery: 94, backup: "14–15 hours", weight: 1.24, color: "Midnight", keyboard: "English (US), Magic Keyboard, backlit",
    ports: ["MagSafe 3", ...MAC_PORTS], features: ["MagSafe charging", "1080p FaceTime camera", "Touch ID", "Fanless design"],
    stock: 3, style: "midnight", flags: { featured: true },
    short: "The redesigned MacBook Air with MagSafe, a brighter display and 1080p camera.",
  },
  {
    name: "Apple MacBook Pro 13 M1 (2020)", brand: "apple", category: "macbooks", sku: "RB-MBP13-M1-01",
    price: 56999, mrp: 122900, grade: "B", warranty: 6,
    processor: "Apple M1 (8-core CPU, 8-core GPU)", processorBrand: "Apple", family: "Apple M1", generation: null,
    ram: 8, ramType: "Unified memory", storage: 512, storageType: "NVME_SSD",
    display: 13.3, resolution: "2560 × 1600 (Retina)", displayType: "IPS, True Tone, 500 nits", graphics: "Apple 8-core GPU",
    os: "macOS Sonoma", battery: 86, backup: "15+ hours", weight: 1.4, color: "Silver", keyboard: "English (US), backlit",
    ports: MAC_PORTS, features: ["Active cooling for sustained performance", "Touch Bar", "Touch ID"],
    stock: 4, style: "silver", flags: { deal: true, dealDays: 4 },
    short: "Actively cooled M1 with 512GB storage — great for long coding and editing sessions.",
  },
  {
    name: "Apple MacBook Pro 14 M1 Pro (2021)", brand: "apple", category: "premium-laptops", sku: "RB-MBP14-M1P-01",
    price: 104999, mrp: 194900, grade: "A", warranty: 12,
    processor: "Apple M1 Pro (8-core CPU, 14-core GPU)", processorBrand: "Apple", family: "Apple M1 Pro", generation: null,
    ram: 16, ramType: "Unified memory", storage: 512, storageType: "NVME_SSD",
    display: 14.2, resolution: "3024 × 1964 (Liquid Retina XDR)", displayType: "Mini-LED, 120Hz ProMotion", graphics: "Apple 14-core GPU",
    os: "macOS Sonoma", battery: 90, backup: "12–15 hours", weight: 1.6, color: "Space grey", keyboard: "English (US), backlit",
    ports: ["3 × Thunderbolt 4", "HDMI", "SDXC card slot", "MagSafe 3", "3.5 mm headphone jack"], features: ["XDR mini-LED display", "120Hz ProMotion", "Six-speaker sound system"],
    stock: 2, style: "spacegray", flags: { featured: true },
    short: "A professional-grade MacBook Pro with a stunning XDR display, at nearly half the original price.",
  },

  // ─── Acer ───────────────────────────────────────────────
  {
    name: "Acer Swift 3 SF314-59", brand: "acer", category: "ultrabooks", sku: "RB-ACSF3-01",
    price: 28999, mrp: 38999, grade: "A", warranty: 6,
    processor: "Intel Core i5-1135G7", processorBrand: "Intel", family: "Core i5", generation: "11th Gen",
    ram: 8, ramType: "LPDDR4x 4266MHz", storage: 512, storageType: "NVME_SSD",
    display: 14, resolution: "1920 × 1080 (FHD)", displayType: "IPS", graphics: "Intel Iris Xe",
    os: "Windows 11 Home", battery: 87, backup: "7–8 hours", weight: 1.2, color: "Pure silver", keyboard: "English (US), backlit",
    ports: ["1 × Thunderbolt 4", "2 × USB-A 3.2", "HDMI 2.0", "3.5 mm audio"], features: ["Aluminium body", "Fingerprint reader", "Wi-Fi 6"],
    stock: 6, style: "silver",
    short: "Light, all-metal ultrabook with Thunderbolt 4 at an accessible price.",
  },
  {
    name: "Acer Nitro 5 AN515-57", brand: "acer", category: "gaming-laptops", sku: "RB-ACNITRO5-01",
    price: 54999, mrp: 74999, grade: "A", warranty: 6,
    processor: "Intel Core i5-11400H", processorBrand: "Intel", family: "Core i5", generation: "11th Gen",
    ram: 16, ramType: "DDR4 3200MHz", storage: 512, storageType: "NVME_SSD",
    display: 15.6, resolution: "1920 × 1080 (FHD)", displayType: "IPS, 144Hz", graphics: "NVIDIA GeForce RTX 3050 4GB", dedicated: true,
    os: "Windows 11 Home", battery: 84, backup: "4–5 hours", weight: 2.2, color: "Shale black", keyboard: "English (US), red backlit",
    ports: ["1 × USB-C", "3 × USB-A 3.2", "HDMI 2.1", "RJ-45 Ethernet", "3.5 mm audio"], features: ["144Hz display", "Dual-fan cooling", "Upgradeable RAM & storage"],
    stock: 5, style: "gaming", flags: { bestSeller: true, deal: true, dealDays: 6 },
    short: "Entry gaming laptop with RTX 3050 and a smooth 144Hz display.",
  },

  // ─── Asus ───────────────────────────────────────────────
  {
    name: "Asus ZenBook 14 UX425EA", brand: "asus", category: "ultrabooks", sku: "RB-ASUX425-01",
    price: 39999, mrp: 54999, grade: "A_PLUS", warranty: 6,
    processor: "Intel Core i7-1165G7", processorBrand: "Intel", family: "Core i7", generation: "11th Gen",
    ram: 16, ramType: "LPDDR4x 4266MHz", storage: 512, storageType: "NVME_SSD",
    display: 14, resolution: "1920 × 1080 (FHD)", displayType: "IPS, 400 nits", graphics: "Intel Iris Xe",
    os: "Windows 11 Home", battery: 91, backup: "9 hours", weight: 1.17, color: "Lilac mist", keyboard: "English (US), backlit",
    ports: ["2 × Thunderbolt 4", "1 × USB-A 3.2", "HDMI 1.4", "microSD reader"], features: ["Ultra-slim 13.9 mm", "Military-grade durability tested", "Wi-Fi 6"],
    stock: 4, style: "silver",
    short: "Slim, near-new ZenBook with Core i7 and 16GB RAM.",
  },
  {
    name: "Asus TUF Gaming F15 FX506LH", brand: "asus", category: "gaming-laptops", sku: "RB-ASTUF15-01",
    price: 47999, mrp: 64999, grade: "B", warranty: 6,
    processor: "Intel Core i5-10300H", processorBrand: "Intel", family: "Core i5", generation: "10th Gen",
    ram: 8, ramType: "DDR4 2933MHz", storage: 512, storageType: "NVME_SSD",
    display: 15.6, resolution: "1920 × 1080 (FHD)", displayType: "IPS, 144Hz", graphics: "NVIDIA GeForce GTX 1650 4GB", dedicated: true,
    os: "Windows 11 Home", battery: 80, backup: "3–4 hours", weight: 2.3, color: "Bonfire black", keyboard: "English (US), RGB backlit",
    ports: ["1 × USB-C", "3 × USB-A", "HDMI 2.0", "RJ-45 Ethernet", "3.5 mm audio"], features: ["144Hz display", "Upgradeable RAM", "Durable TUF chassis"],
    stock: 6, style: "gaming", flags: { deal: true, dealDays: 6 },
    short: "Budget-friendly gaming with a GTX 1650 and 144Hz screen.",
  },
];
