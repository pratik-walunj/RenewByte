/**
 * Development seed: brands, categories, 24 DEMO products with inventory,
 * store settings, shipping zones, sample coupons and the first admin account.
 *
 *   npm run db:seed
 *
 * Safe to re-run: records are upserted by their unique keys.
 * No reviews or orders are generated — reviews must come from real customers.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/scrypt";
import { BRANDS, CATEGORIES, PRODUCTS, type SeedProduct } from "./seed-data";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function productSlug(p: SeedProduct) {
  const storage = p.storage >= 1024 ? `${p.storage / 1024}tb` : `${p.storage}gb`;
  return slugify(`${p.name} ${p.family} ${p.ram}gb ${storage}`);
}

function highlights(p: SeedProduct) {
  const list = [
    `${p.processor}${p.generation ? ` (${p.generation})` : ""}`,
    `${p.ram}GB ${p.ramType} memory`,
    `${p.storage >= 1024 ? `${p.storage / 1024}TB` : `${p.storage}GB`} ${p.storageType === "NVME_SSD" ? "NVMe SSD" : "SSD"} for fast boot and app loading`,
    `${p.display}" ${p.resolution} ${p.displayType} display`,
    `Battery health measured at ${p.battery}% of original capacity`,
    `${p.warranty}-month warranty included`,
  ];
  return list;
}

function specs(p: SeedProduct) {
  const storage = p.storage >= 1024 ? `${p.storage / 1024}TB` : `${p.storage}GB`;
  return [
    ["Processor", "Processor", p.processor],
    ["Processor", "Generation", p.generation ?? "—"],
    ["Memory", "RAM", `${p.ram}GB ${p.ramType}`],
    ["Storage", "Storage", `${storage} ${p.storageType === "NVME_SSD" ? "NVMe SSD" : "SATA SSD"}`],
    ["Display", "Screen size", `${p.display} inch`],
    ["Display", "Resolution", p.resolution],
    ["Display", "Panel", p.displayType],
    ["Graphics", "Graphics", p.graphics],
    ["Software", "Operating system", p.os],
    ["Input", "Keyboard", p.keyboard],
    ["Battery", "Battery health", `${p.battery}%`],
    ["Battery", "Typical backup", p.backup],
    ["Physical", "Weight", `${p.weight} kg`],
    ["Physical", "Colour", p.color],
  ].map(([group, label, value], i) => ({ group, label, value, sortOrder: i }));
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user.");
    return;
  }
  if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
  await db.user.upsert({
    where: { email },
    create: {
      email,
      name: process.env.ADMIN_NAME || "Store Admin",
      passwordHash: await hashPassword(password),
      role: "ADMIN",
    },
    update: { role: "ADMIN" },
  });
  console.log(`Admin ready: ${email}`);
}

async function main() {
  console.log("Seeding RenewByte (demo data)…");

  for (const [i, b] of BRANDS.entries()) {
    await db.brand.upsert({
      where: { slug: b.slug },
      create: { ...b, sortOrder: i, seoTitle: `Refurbished ${b.name} Laptops`, seoDescription: b.description },
      update: { name: b.name, description: b.description, sortOrder: i },
    });
  }
  for (const [i, c] of CATEGORIES.entries()) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: { ...c, sortOrder: i, seoTitle: `Refurbished ${c.name}`, seoDescription: c.description },
      update: { name: c.name, description: c.description, sortOrder: i },
    });
  }

  const brands = Object.fromEntries((await db.brand.findMany()).map((b) => [b.slug, b.id]));
  const categories = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));

  for (const [index, p] of PRODUCTS.entries()) {
    const slug = productSlug(p);
    const price = p.price * 100;
    const mrp = p.mrp * 100;
    const data = {
      name: p.name,
      slug,
      brandId: brands[p.brand],
      categoryId: categories[p.category],
      shortDescription: p.short,
      description: `${p.short}\n\nThis unit has been fully inspected, diagnosed and cleaned, and graded ${p.grade.replace("_PLUS", "+")} for cosmetic condition. Measured battery health is ${p.battery}% of the original design capacity.\n\nDemo listing: this product is sample data for development. Specifications reflect the model; price, stock and battery figures are illustrative.`,
      mrp,
      price,
      discountPercent: Math.round(((mrp - price) / mrp) * 100),
      conditionGrade: p.grade,
      warrantyMonths: p.warranty,
      processor: p.processor,
      processorBrand: p.processorBrand,
      processorFamily: p.family,
      processorGeneration: p.generation,
      ramGb: p.ram,
      ramType: p.ramType,
      storageGb: p.storage,
      storageType: p.storageType,
      displaySize: p.display,
      resolution: p.resolution,
      displayType: p.displayType,
      graphics: p.graphics,
      gpuType: p.dedicated ? ("DEDICATED" as const) : ("INTEGRATED" as const),
      operatingSystem: p.os,
      batteryHealth: p.battery,
      batteryBackup: p.backup,
      weightKg: p.weight,
      color: p.color,
      keyboard: p.keyboard,
      ports: p.ports,
      features: p.features,
      highlights: highlights(p),
      whatsIncluded: ["Laptop", "Compatible charger", "Protective packaging", "Warranty card & invoice"],
      isFeatured: p.flags?.featured ?? false,
      isBestSeller: p.flags?.bestSeller ?? false,
      isDeal: p.flags?.deal ?? false,
      dealEndsAt: p.flags?.dealDays ? new Date(Date.now() + p.flags.dealDays * 86_400_000) : null,
      status: "PUBLISHED" as const,
      isDemo: true,
      soldCount: Math.max(0, 40 - index * 2),
      seoTitle: `Refurbished ${p.name} — ${p.family}, ${p.ram}GB RAM`,
      seoDescription: `${p.short} Grade ${p.grade.replace("_PLUS", "+")}, ${p.warranty}-month warranty.`,
    };

    const product = await db.product.upsert({
      where: { sku: p.sku },
      create: { ...data, sku: p.sku },
      update: data,
    });

    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.createMany({
      data: (["angle", "front", "closed", "side"] as const).map((view, i) => ({
        productId: product.id,
        url: `/images/products/${p.style}-${view}.webp`,
        alt: `${p.name} — ${{ angle: "three-quarter view", front: "front view, screen open", closed: "lid closed", side: "side profile showing ports" }[view]}`,
        sortOrder: i,
      })),
    });

    await db.productSpecification.deleteMany({ where: { productId: product.id } });
    await db.productSpecification.createMany({ data: specs(p).map((s) => ({ ...s, productId: product.id })) });

    await db.inventory.upsert({
      where: { productId: product.id },
      create: { productId: product.id, quantity: p.stock, lowStockThreshold: 3 },
      update: { quantity: p.stock },
    });
  }
  console.log(`Products: ${PRODUCTS.length} demo listings`);

  await db.storeSettings.upsert({ where: { id: "default" }, create: { id: "default" }, update: {} });

  const zones = [
    {
      id: "zone-remote",
      name: "North-East & islands",
      states: ["Arunachal Pradesh", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura", "Andaman and Nicobar Islands", "Lakshadweep", "Ladakh"],
      pincodePrefixes: [],
      fee: 0,
      expressFee: 79900,
      minDays: 6,
      maxDays: 10,
      sortOrder: 0,
    },
    {
      id: "zone-metro",
      name: "Metro cities",
      states: [],
      pincodePrefixes: ["110", "400", "560", "600", "700", "500", "411", "380"],
      fee: 0,
      expressFee: 39900,
      minDays: 2,
      maxDays: 4,
      sortOrder: 1,
    },
  ];
  for (const z of zones) {
    await db.shippingZone.upsert({ where: { id: z.id }, create: z, update: z });
  }

  const coupons = [
    { code: "WELCOME500", description: "₹500 off your first order above ₹20,000", type: "FIXED" as const, value: 50000, minOrderValue: 2000000, perUserLimit: 1 },
    { code: "STUDENT5", description: "5% off student laptops (max ₹1,500)", type: "PERCENTAGE" as const, value: 5, maxDiscount: 150000 },
  ];
  for (const c of coupons) {
    await db.coupon.upsert({ where: { code: c.code }, create: c, update: {} });
  }
  const student = await db.category.findUnique({ where: { slug: "student-laptops" } });
  if (student) {
    await db.coupon.update({ where: { code: "STUDENT5" }, data: { categories: { set: [{ id: student.id }] } } });
  }

  await seedAdmin();
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
