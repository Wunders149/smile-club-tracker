import { db } from "./db";
import {
  volunteers, events, attendances,
  type InsertVolunteer, type UpdateVolunteerRequest, type Volunteer,
  type InsertEvent, type UpdateEventRequest, type Event,
  type InsertAttendance, type Attendance, type RankingRecord, type StatisticsData,
  getAttendancePoints
} from "@shared/schema";
import { asc, and, eq, inArray, sql } from "drizzle-orm";
import { sendAttendanceEmail } from "./email";

export interface IStorage {
  // Volunteers
  getVolunteers(): Promise<Volunteer[]>;
  getVolunteer(id: number): Promise<Volunteer | undefined>;
  createVolunteer(volunteer: InsertVolunteer): Promise<Volunteer>;
  updateVolunteer(id: number, updates: UpdateVolunteerRequest): Promise<Volunteer>;
  deleteVolunteer(id: number): Promise<void>;
  
  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: UpdateEventRequest): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Attendances
  getAttendancesByEvent(eventId: number): Promise<Attendance[]>;
  recordAttendances(eventId: number, records: { volunteerId: number; status: string }[]): Promise<boolean>;

  // Rankings
  getVolunteerRankings(year?: number): Promise<RankingRecord[]>;

  // Statistics
  getStatistics(): Promise<StatisticsData>;
}

export class DatabaseStorage implements IStorage {
  // --- Volunteers ---
  async getVolunteers(): Promise<Volunteer[]> {
    return await db.select().from(volunteers).orderBy(asc(volunteers.fullName));
  }

  async getVolunteer(id: number): Promise<Volunteer | undefined> {
    const [volunteer] = await db.select().from(volunteers).where(eq(volunteers.id, id));
    return volunteer;
  }

  async createVolunteer(volunteer: InsertVolunteer): Promise<Volunteer> {
    // 1. Check for duplicate email (only if provided)
    if (volunteer.email && volunteer.email.trim() !== "") {
      const [existingByEmail] = await db.select().from(volunteers).where(eq(volunteers.email, volunteer.email));
      if (existingByEmail) {
        throw new Error("A volunteer with this email already exists.");
      }
    }

    // 2. Check for duplicate Name + Contact combination (for everyone)
    const [existingByNameContact] = await db.select().from(volunteers).where(
      sql`${volunteers.fullName} = ${volunteer.fullName} AND ${volunteers.contact} = ${volunteer.contact}`
    );
    
    if (existingByNameContact) {
      throw new Error("A volunteer with this name and contact already exists.");
    }

    const [created] = await db.insert(volunteers).values(volunteer).returning();
    return created;
  }

  async updateVolunteer(id: number, updates: UpdateVolunteerRequest): Promise<Volunteer> {
    const [updated] = await db.update(volunteers)
      .set(updates)
      .where(eq(volunteers.id, id))
      .returning();
    return updated;
  }

  async deleteVolunteer(id: number): Promise<void> {
    // 1. Delete all attendance records associated with this volunteer first
    await db.delete(attendances).where(eq(attendances.volunteerId, id));
    
    // 2. Delete the volunteer
    await db.delete(volunteers).where(eq(volunteers.id, id));
  }

  // --- Events ---
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(asc(events.date));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event).returning();
    return created;
  }

  async updateEvent(id: number, updates: UpdateEventRequest): Promise<Event> {
    const [updated] = await db.update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(attendances).where(eq(attendances.eventId, id));
      await tx.delete(events).where(eq(events.id, id));
    });
  }

  // --- Attendances ---
  async getAttendancesByEvent(eventId: number): Promise<Attendance[]> {
    return await db.select().from(attendances)
      .where(eq(attendances.eventId, eventId))
      .orderBy(asc(attendances.volunteerId));
  }

  async recordAttendances(eventId: number, records: { volunteerId: number; status: string }[]): Promise<boolean> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error("Event not found");

    const volunteerIds = Array.from(new Set(records.map(record => record.volunteerId)));
    if (volunteerIds.length > 0) {
      const existingVolunteers = await db.select({ id: volunteers.id })
        .from(volunteers)
        .where(inArray(volunteers.id, volunteerIds));
      if (existingVolunteers.length !== volunteerIds.length) {
        throw new Error("One or more volunteers were not found");
      }
    }

    const validStatuses = new Set(["on_time", "late", "excused", "absent"]);
    if (records.some(record => !validStatuses.has(record.status))) {
      throw new Error("Invalid attendance status");
    }

    await db.transaction(async (tx) => {
      await tx.delete(attendances).where(eq(attendances.eventId, eventId));
      if (records.length > 0) {
        await tx.insert(attendances).values(records.map(record => ({
          eventId,
          volunteerId: record.volunteerId,
          status: record.status,
        })));
      }
    });
    
    // Send email to those who attended (not absent)
    {
      const year = new Date(event.date).getFullYear();
      const rankings = await this.getVolunteerRankings(year);
      
      const attendees = records.filter(r => r.status !== 'absent');
      for (const att of attendees) {
        const rankIndex = rankings.findIndex(r => r.volunteer.id === att.volunteerId);
        if (rankIndex !== -1) {
          const rankRecord = rankings[rankIndex];
          // Pass the 1-based index as the ranking
          sendAttendanceEmail(rankRecord.volunteer, rankIndex + 1, rankRecord.totalPoints, event.name)
            .catch(err => console.error(`Failed to send email to ${rankRecord.volunteer.email}:`, err));
        }
      }
    }
    
    return true;
  }

  // --- Rankings ---
  async getVolunteerRankings(year?: number): Promise<RankingRecord[]> {
    const targetYear = year || new Date().getFullYear();
    const points = sql<number>`coalesce(sum(case
      when ${events.id} is not null and ${attendances.status} = 'on_time' then 5
      when ${events.id} is not null and ${attendances.status} = 'late' then 3
      when ${events.id} is not null and ${attendances.status} = 'excused' then 1
      else 0
    end), 0)::int`;

    const rows = await db.select({ volunteer: volunteers, totalPoints: points })
      .from(volunteers)
      .leftJoin(attendances, eq(attendances.volunteerId, volunteers.id))
      .leftJoin(events, and(
        eq(events.id, attendances.eventId),
        sql`extract(year from ${events.date}) = ${targetYear}`,
      ))
      .groupBy(volunteers.id)
      .orderBy(sql`${points} desc`, asc(volunteers.fullName));

    const currentYear = new Date().getFullYear();
    return rows
      .filter(row => targetYear === currentYear || row.totalPoints > 0)
      .map(row => ({ volunteer: row.volunteer, totalPoints: Number(row.totalPoints) }));
  }

  // --- Statistics ---
  async getStatistics(): Promise<StatisticsData> {
    const allVolunteers = await db.select().from(volunteers);
    const allEvents = await db.select().from(events);
    const allAttendances = await db.select().from(attendances);

    // ── Volunteer counts ──
    const maleCount = allVolunteers.filter(v => v.gender === 'Male').length;
    const femaleCount = allVolunteers.filter(v => v.gender === 'Female').length;

    // ── Gender breakdown (use empty string for null to keep keys clean) ──
    const genderBreakdown = allVolunteers.reduce((acc, v) => {
      const key = v.gender ?? '';
      const existing = acc.find(g => g.gender === key);
      if (existing) existing.count++;
      else acc.push({ gender: key, count: 1 });
      return acc;
    }, [] as { gender: string; count: number }[]);

    // ── Field of study breakdown ──
    const fieldStudyBreakdown = allVolunteers.reduce((acc, v) => {
      const key = v.studyField ?? '';
      const existing = acc.find(f => f.field === key);
      if (existing) existing.count++;
      else acc.push({ field: key, count: 1 });
      return acc;
    }, [] as { field: string; count: number }[]);

    // ── Medical classification ──
    const medicalKeywords = [
      'medec', 'medic', 'chir', 'dent', 'pharma', 'infir', 'sage-f',
      'health', 'santé', 'sante', 'soins', 'kiné', 'kine', 'obstet',
      'biomed', 'paramed', 'nurs'
    ];
    const nonMedicalKeywords = [
      'high school', 'lycée', 'lycee', 'college',
      'informatique', 'computer', 'software', 'programm', 'web',
      'commerce', 'gestion', 'compta', 'droit', 'law', 'lettres',
      'histoire', 'géograph', 'philo', 'économie', 'economie',
      'agri', 'tourisme', 'transport', 'logist', 'architect'
    ];

    let medicalCount = 0;
    if (allVolunteers.length > 0) {
      for (const v of allVolunteers) {
        const field = (v.studyField || '').toLowerCase();
        // Non-medical studyField always overrides
        if (nonMedicalKeywords.some(k => field.includes(k))) continue;
        if (medicalKeywords.some(k => field.includes(k))) medicalCount++;
      }
    }

    const medicalBreakdown = allVolunteers.length > 0
      ? [
          { category: 'Medical Study', count: medicalCount },
          { category: 'Non-Medical Study', count: allVolunteers.length - medicalCount }
        ]
      : [];

    // ── Position breakdown ──
    const positionBreakdown = allVolunteers.reduce((acc, v) => {
      const existing = acc.find(p => p.position === v.position);
      if (existing) existing.count++;
      else acc.push({ position: v.position, count: 1 });
      return acc;
    }, [] as { position: string; count: number }[]).sort((a, b) => b.count - a.count);

    // ── Event type breakdown ──
    const eventTypeBreakdown = allEvents.reduce((acc, e) => {
      const existing = acc.find(t => t.type === e.type);
      if (existing) existing.count++;
      else acc.push({ type: e.type, count: 1 });
      return acc;
    }, [] as { type: string; count: number }[]).sort((a, b) => b.count - a.count);

    // ── Commitment trend — O(n) using a Map keyed by date string ──
    // Build a lookup of event → date string first
    const eventDateMap = new Map<number, string>();
    for (const ev of allEvents) {
      eventDateMap.set(ev.id, ev.date.toISOString().split('T')[0]);
    }

    // Build a Set of valid volunteer IDs for orphan filtering
    const volunteerIds = new Set(allVolunteers.map(v => v.id));

    // Accumulate points per day in a single pass over attendances
    const commitmentMap = new Map<string, number>();
    for (const att of allAttendances) {
      // Skip orphan attendance records
      if (!volunteerIds.has(att.volunteerId)) continue;
      const dateStr = eventDateMap.get(att.eventId);
      if (!dateStr) continue; // event was deleted or doesn't exist
      const points = getAttendancePoints(att.status as any);
      commitmentMap.set(dateStr, (commitmentMap.get(dateStr) || 0) + points);
    }

    const commitmentTrend = Array.from(commitmentMap.entries())
      .map(([date, points]) => ({ date, points }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Events done / left — compare against start of today ──
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const eventsDone = allEvents.filter(e => new Date(e.date) < startOfToday).length;
    const eventsLeft = allEvents.filter(e => new Date(e.date) >= startOfToday).length;

    return {
      genderBreakdown,
      fieldStudyBreakdown,
      medicalBreakdown,
      positionBreakdown,
      eventTypeBreakdown,
      commitmentTrend,
      totalVolunteers: allVolunteers.length,
      totalEvents: allEvents.length,
      eventsDone,
      eventsLeft,
      maleCount,
      femaleCount
    };
  }
}

export const storage = new DatabaseStorage();
