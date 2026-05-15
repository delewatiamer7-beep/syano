/**
 * Seed script: creates (or updates) the admin account.
 * Run with: pnpm --filter @workspace/scripts run seed:admin
 *
 * Idempotent — safe to run multiple times.
 * - If the target email already exists → update password/role in place.
 * - If the old demo email exists too → remove it (email changed).
 */

import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "delewatiamer7@gmail.com";
const ADMIN_PASSWORD = "00Amer00";
const ADMIN_NAME = "Admin";

const OLD_EMAIL = "admin@marketplace.com";

async function main() {
  console.log("Seeding admin account…");

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // Check what already exists
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, ADMIN_EMAIL));

  const [old] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, OLD_EMAIL));

  if (existing) {
    // Target email already in DB — just update credentials and role
    await db
      .update(usersTable)
      .set({ passwordHash: hash, role: "admin", name: ADMIN_NAME })
      .where(eq(usersTable.email, ADMIN_EMAIL));
    // Remove stale old demo account if it's a different row
    if (old) {
      await db.delete(usersTable).where(eq(usersTable.email, OLD_EMAIL));
      console.log(`  Removed old demo account: ${OLD_EMAIL}`);
    }
  } else if (old) {
    // Migrate: rename old demo account to new email
    await db
      .update(usersTable)
      .set({ email: ADMIN_EMAIL, passwordHash: hash, name: ADMIN_NAME, role: "admin" })
      .where(eq(usersTable.email, OLD_EMAIL));
    console.log(`  Migrated ${OLD_EMAIL} → ${ADMIN_EMAIL}`);
  } else {
    // Fresh insert
    await db
      .insert(usersTable)
      .values({ email: ADMIN_EMAIL, passwordHash: hash, name: ADMIN_NAME, role: "admin" });
  }

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.email, ADMIN_EMAIL));

  console.log(`✓ Admin account ready: id=${user.id}, email=${user.email}, role=${user.role}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
