import { db } from "./db";
import { volunteers, events, attendances } from "@shared/schema";
import { createBackup } from "./backup";
import { log } from "./index";

async function reset() {
  try {
    log("Starting database reset...", "reset");

    // 1. Delete all records
    // We delete in order of dependencies (though drizzle-orm doesn't have FKs enforced in pgTable here, 
    // it's good practice)
    await db.delete(attendances);
    log("Cleared attendances table", "reset");

    await db.delete(events);
    log("Cleared events table", "reset");

    await db.delete(volunteers);
    log("Cleared volunteers table", "reset");

    log("Database tables cleared successfully.", "reset");

    // 2. Sync empty state to GitHub backup if configured
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
      log("Syncing empty state to GitHub backup...", "reset");
      await createBackup();
      log("GitHub backup synced successfully.", "reset");
    } else {
      log("GitHub backup skipped: GITHUB_TOKEN or GITHUB_REPO not set", "reset");
    }

    log("Reset complete.", "reset");
    process.exit(0);
  } catch (err) {
    console.error("Reset failed:", err);
    process.exit(1);
  }
}

reset();
