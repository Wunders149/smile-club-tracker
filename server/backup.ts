import { promises as fs } from "fs";
import { join } from "path";
import { db } from "./db";
import { volunteers, events, attendances } from "@shared/schema";
import { log } from "./index";

const BACKUPS_DIR = join(process.cwd(), "backups");
const MAX_BACKUPS = 10;

async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create backups directory:", err);
  }
}

async function cleanOldBackups() {
  try {
    const files = await fs.readdir(BACKUPS_DIR);
    const backupFiles = files
      .filter((f) => f.startsWith("backup-") && f.endsWith(".json"))
      .sort()
      .reverse();

    // Keep only the last MAX_BACKUPS files
    for (let i = MAX_BACKUPS; i < backupFiles.length; i++) {
      await fs.unlink(join(BACKUPS_DIR, backupFiles[i]));
    }
  } catch (err) {
    console.error("Failed to clean old backups:", err);
  }
}

export async function createBackup() {
  try {
    await ensureBackupDir();

    // Fetch all data
    const volunteersData = await db.select().from(volunteers);
    const eventsData = await db.select().from(events);
    const attendanceData = await db.select().from(attendances);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        volunteers: volunteersData,
        events: eventsData,
        attendance: attendanceData,
      },
    };

    // Create timestamped backup file
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const backupPath = join(BACKUPS_DIR, `backup-${timestamp}.json`);

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    log(`Database backup created: backups/backup-${timestamp}.json`, "backup");

    // Clean old backups
    await cleanOldBackups();
  } catch (err) {
    console.error("Backup creation failed:", err);
  }
}
