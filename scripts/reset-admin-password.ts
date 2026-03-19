#!/usr/bin/env npx tsx
/**
 * Reset admin password to demo123
 * Run: npm run db:reset-admin
 * Use with: DATABASE_URL="your-neon-url" npm run db:reset-admin
 */

import "dotenv/config";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set.");
    process.exit(1);
  }

  const [admin] = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
  if (!admin) {
    console.error("❌ No admin user found. Run 'npm run db:seed' first.");
    process.exit(1);
  }

  const hashedPassword = await hashPassword("demo123");
  await db.update(users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(users.id, admin.id));

  console.log("✅ Admin password reset to: demo123\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
