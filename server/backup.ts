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

export async function restoreBackup() {
  try {
    // Check if backups directory exists
    try {
      await fs.access(BACKUPS_DIR);
    } catch {
      // No backups directory - nothing to restore
      return;
    }

    // Find the most recent backup file
    const files = await fs.readdir(BACKUPS_DIR);
    const backupFiles = files
      .filter((f) => f.startsWith("backup-") && f.endsWith(".json"))
      .sort()
      .reverse();

    if (backupFiles.length === 0) {
      // No backup files found
      return;
    }

    const latestBackupFile = backupFiles[0];
    const backupPath = join(BACKUPS_DIR, latestBackupFile);
    const backupContent = await fs.readFile(backupPath, "utf-8");
    const backupData = JSON.parse(backupContent);

    // Clear existing data
    await db.delete(attendances);
    await db.delete(events);
    await db.delete(volunteers);

    // Restore volunteers (convert createdAt strings back to Date)
    if (backupData.data.volunteers && backupData.data.volunteers.length > 0) {
      const volunteersToInsert = backupData.data.volunteers.map((v: any) => ({
        ...v,
        createdAt: v.createdAt ? new Date(v.createdAt) : new Date()
      }));
      await db.insert(volunteers).values(volunteersToInsert);
    }

    // Restore events (convert createdAt strings back to Date)
    if (backupData.data.events && backupData.data.events.length > 0) {
      const eventsToInsert = backupData.data.events.map((e: any) => ({
        ...e,
        createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
        date: e.date ? new Date(e.date) : new Date()
      }));
      await db.insert(events).values(eventsToInsert);
    }

    // Restore attendances (convert date strings back to Date)
    if (backupData.data.attendance && backupData.data.attendance.length > 0) {
      const attendancesToInsert = backupData.data.attendance.map((a: any) => ({
        ...a,
        createdAt: a.createdAt ? new Date(a.createdAt) : new Date()
      }));
      await db.insert(attendances).values(attendancesToInsert);
    }

    const volunteerCount = backupData.data.volunteers?.length || 0;
    const eventCount = backupData.data.events?.length || 0;
    const attendanceCount = backupData.data.attendance?.length || 0;

    log(
      `Database restored from ${latestBackupFile}: ${volunteerCount} volunteers, ${eventCount} events, ${attendanceCount} attendance records`,
      "backup"
    );
  } catch (err) {
    console.error("Backup restoration failed:", err);
  }
}
