/**
 * Seed script: creates the admin demo account.
 * Run with: pnpm --filter @workspace/scripts run seed:admin
 *
 * Idempotent — safe to run multiple times. If admin@marketplace.com already
 * exists it will update the password and ensure the role is set to admin.
 */

import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@marketplace.com";
const ADMIN_PASSWORD = "password123";
const ADMIN_NAME = "Admin";

async function main() {
  console.log("Seeding admin account…");

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await db
    .insert(usersTable)
    .values({ email: ADMIN_EMAIL, passwordHash: hash, name: ADMIN_NAME, role: "admin" })
    .onConflictDoUpdate({
      target: usersTable.email,
      set: { passwordHash: hash, role: "admin", name: ADMIN_NAME },
    });

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.email, ADMIN_EMAIL));

  console.log(`✓ Admin account ready: id=${user.id}, email=${user.email}, role=${user.role}`);
  console.log(`  Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
