import fs from "fs";
import path from "path";

// Manually load .env at the VERY BEGINNING
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join("=").trim();
      if (key) {
        process.env[key] = value;
      }
    }
  });
}

// Now imports can happen
import { db } from "./server/db";
import { attendances, volunteers } from "./shared/schema";
import { sql } from "drizzle-orm";

async function cleanup() {
  console.log("Starting database cleanup...");
  try {
    const allVols = await db.select({ id: volunteers.id }).from(volunteers);
    const validIds = allVols.map(v => v.id);

    if (validIds.length === 0) {
      console.log("No volunteers found. Wiping all attendances.");
      const deleted = await db.delete(attendances).returning();
      console.log(`Removed ${deleted.length} records.`);
    } else {
      const deleted = await db.delete(attendances)
        .where(sql`volunteer_id NOT IN (${sql.raw(validIds.join(','))})`)
        .returning();
      console.log(`Success! Removed ${deleted.length} orphaned attendance records from deleted duplicates.`);
    }
  } catch (err) {
    console.error("Cleanup failed:", err);
  } finally {
    process.exit(0);
  }
}

cleanup();
