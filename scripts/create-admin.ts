/**
 * Create or promote an administrator.
 *
 *   npm run admin:create -- admin@yourstore.in "Strong password" "Full Name"
 *
 * Falls back to ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from .env.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/scrypt";

async function main() {
  const [emailArg, passwordArg, nameArg] = process.argv.slice(2);
  const email = (emailArg || process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = passwordArg || process.env.ADMIN_PASSWORD || "";
  const name = nameArg || process.env.ADMIN_NAME || "Store Admin";
  if (!email || !password) throw new Error("Usage: npm run admin:create -- <email> <password> [name]");
  if (password.length < 10) throw new Error("Password must be at least 10 characters.");

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const user = await db.user.upsert({
      where: { email },
      create: { email, name, passwordHash: await hashPassword(password), role: "ADMIN" },
      update: { role: "ADMIN", passwordHash: await hashPassword(password), isActive: true },
    });
    console.log(`Administrator ready: ${user.email}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
