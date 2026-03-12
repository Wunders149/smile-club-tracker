import { db } from "./db";
import { volunteers, events, attendances } from "@shared/schema";
import { log } from "./index";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // e.g. "username/repo"
const GITHUB_PATH = process.env.GITHUB_PATH || "data.json";

async function getGithubFile() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.warn("GitHub backup/restore skipped: GITHUB_TOKEN or GITHUB_REPO not set");
    return null;
  }

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
  const response = await fetch(url, {
    headers: {
      "Authorization": `token ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "SmileClub-Backup-App"
    }
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return await response.json();
}

export async function createBackup() {
  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO) return;

    // 1. Fetch all data from DB
    const volunteersData = await db.select().from(volunteers);
    const eventsData = await db.select().from(events);
    const attendanceData = await db.select().from(attendances);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.1",
      data: {
        volunteers: volunteersData,
        events: eventsData,
        attendance: attendanceData,
      },
    };

    const content = JSON.stringify(backupData, null, 2);
    const encodedContent = Buffer.from(content).toString("base64");

    // 2. Get current file SHA if it exists
    const currentFile = await getGithubFile();
    const sha = currentFile?.sha;

    // 3. Update/Create file on GitHub
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `token ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "SmileClub-Backup-App"
      },
      body: JSON.stringify({
        message: `Database backup: ${new Date().toISOString()}`,
        content: encodedContent,
        sha: sha // Required to update an existing file
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to push to GitHub: ${error.message}`);
    }

    log(`Database backup synced to GitHub: ${GITHUB_REPO}/${GITHUB_PATH}`, "backup");
  } catch (err) {
    console.error("GitHub backup creation failed:", err);
  }
}

export async function restoreBackup() {
  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO) return;

    const latestBackupFile = GITHUB_PATH;
    const fileData = await getGithubFile();
    if (!fileData || !fileData.content) {
      log("No backup found on GitHub to restore.", "backup");
      return;
    }

    // Decode base64 content
    const content = Buffer.from(fileData.content, "base64").toString("utf-8");
    const backupData = JSON.parse(content);
    
    log(`Restore data preview: ${JSON.stringify(backupData.data.volunteers?.map((v: any) => v.fullName))}`, "backup");

    // Clear existing data
    await db.delete(attendances);
    await db.delete(events);
    await db.delete(volunteers);

    // Restore volunteers
    if (backupData.data.volunteers && backupData.data.volunteers.length > 0) {
      const volunteersToInsert = backupData.data.volunteers.map((v: any) => ({
        ...v,
        createdAt: v.createdAt ? new Date(v.createdAt) : new Date()
      }));
      await db.insert(volunteers).values(volunteersToInsert);
      log(`Inserted ${volunteersToInsert.length} volunteers into DB`, "backup");
    }

    // Restore events
    if (backupData.data.events && backupData.data.events.length > 0) {
      const eventsToInsert = backupData.data.events.map((e: any) => ({
        ...e,
        createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
        date: e.date ? new Date(e.date) : new Date(),
        endTime: e.endTime ? new Date(e.endTime) : null
      }));
      await db.insert(events).values(eventsToInsert);
      log(`Inserted ${eventsToInsert.length} events into DB`, "backup");
    }

    // Restore attendances
    if (backupData.data.attendance && backupData.data.attendance.length > 0) {
      const attendancesToInsert = backupData.data.attendance.map((a: any) => ({
        ...a,
        createdAt: a.createdAt ? new Date(a.createdAt) : new Date()
      }));
      await db.insert(attendances).values(attendancesToInsert);
      log(`Inserted ${attendancesToInsert.length} attendance records into DB`, "backup");
    }

    const volunteerCount = backupData.data.volunteers?.length || 0;
    const eventCount = backupData.data.events?.length || 0;
    const attendanceCount = backupData.data.attendance?.length || 0;

    log(
      `Database restored from GitHub (${GITHUB_REPO}): ${volunteerCount} volunteers, ${eventCount} events, ${attendanceCount} records`,
      "backup"
    );
  } catch (err) {
    console.error("GitHub backup restoration failed:", err);
  }
}
