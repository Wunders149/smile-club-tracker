import { db } from "./db";
import {
  volunteers, events, attendances,
  type InsertVolunteer, type UpdateVolunteerRequest, type Volunteer,
  type InsertEvent, type UpdateEventRequest, type Event,
  type InsertAttendance, type Attendance, type RankingRecord, type StatisticsData,
  getAttendancePoints
} from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";
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
    return await db.select().from(volunteers);
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
    return await db.select().from(events);
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
    await db.delete(events).where(eq(events.id, id));
  }

  // --- Attendances ---
  async getAttendancesByEvent(eventId: number): Promise<Attendance[]> {
    return await db.select().from(attendances).where(eq(attendances.eventId, eventId));
  }

  async recordAttendances(eventId: number, records: { volunteerId: number; status: string }[]): Promise<boolean> {
    // Delete existing records for this event
    await db.delete(attendances).where(eq(attendances.eventId, eventId));
    
    // Insert new records
    if (records.length > 0) {
      const inserts = records.map(r => ({
        eventId,
        volunteerId: r.volunteerId,
        status: r.status
      }));
      await db.insert(attendances).values(inserts);
    }
    
    // Send email to those who attended (not absent)
    const event = await this.getEvent(eventId);
    if (event) {
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
    const allVolunteers = await db.select().from(volunteers);
    const targetYear = year || new Date().getFullYear();
    
    // Get all events for the target year
    const yearEvents = await db.select().from(events);
    const yearEventIds = yearEvents
      .filter(e => new Date(e.date).getFullYear() === targetYear)
      .map(e => e.id);

    const rankings: RankingRecord[] = [];
    for (const vol of allVolunteers) {
      const volAttendances = await db.select().from(attendances).where(eq(attendances.volunteerId, vol.id));
      
      // Only count attendances for events that happened in the target year
      const filteredAttendances = volAttendances.filter(a => yearEventIds.includes(a.eventId));
      
      const totalPoints = filteredAttendances.reduce((sum, att) => sum + getAttendancePoints(att.status as any), 0);
      
      // Only include volunteers who have at least one attendance record in that year, 
      // or if it's the current year include everyone
      if (totalPoints > 0 || targetYear === new Date().getFullYear()) {
        rankings.push({ volunteer: vol, totalPoints });
      }
    }
    
    return rankings.sort((a, b) => b.totalPoints - a.totalPoints);
  }

  // --- Statistics ---
  async getStatistics(): Promise<StatisticsData> {
    const allVolunteers = await db.select().from(volunteers);
    
    const genderBreakdown = allVolunteers.reduce((acc, v) => {
      const existing = acc.find(g => g.gender === (v.gender || null));
      if (existing) existing.count++;
      else acc.push({ gender: v.gender || null, count: 1 });
      return acc;
    }, [] as { gender: string | null; count: number }[]);
    
    const fieldStudyBreakdown = allVolunteers.reduce((acc, v) => {
      const existing = acc.find(f => f.field === (v.studyField || null));
      if (existing) existing.count++;
      else acc.push({ field: v.studyField || null, count: 1 });
      return acc;
    }, [] as { field: string | null; count: number }[]).map(({ field, count }) => ({ field, count }));

    const medicalKeywords = [
      'medec', 'medic', 'chir', 'dent', 'pharma', 'infir', 'sage-f', 
      'health', 'santé', 'sante', 'soins', 'kiné', 'kine', 'obstet',
      'biomed', 'paramed'
    ];
    const medicalCount = allVolunteers.filter(v => {
      const isMedicalPosition = v.position === 'Medical Volunteer';
      const field = (v.studyField || '').toLowerCase();
      const matchesKeyword = medicalKeywords.some(k => field.includes(k));
      return isMedicalPosition || matchesKeyword;
    }).length;

    const medicalBreakdown = [
      { category: 'Medical Study', count: medicalCount },
      { category: 'Non-Medical Study', count: allVolunteers.length - medicalCount }
    ];
    
    const positionBreakdown = allVolunteers.reduce((acc, v) => {
      const existing = acc.find(p => p.position === v.position);
      if (existing) existing.count++;
      else acc.push({ position: v.position, count: 1 });
      return acc;
    }, [] as { position: string; count: number }[]).sort((a, b) => b.count - a.count);
    
    const maleCount = allVolunteers.filter(v => v.gender === 'Male').length;
    const femaleCount = allVolunteers.filter(v => v.gender === 'Female').length;
    
    // Commitment Trend
    const allEvents = await db.select().from(events);
    const rawAttendances = await db.select().from(attendances);
    
    // Filter attendances to only include those from existing volunteers
    const volunteerIds = new Set(allVolunteers.map(v => v.id));
    const allAttendances = rawAttendances.filter(a => volunteerIds.has(a.volunteerId));
    
    const eventTypeBreakdown = allEvents.reduce((acc, e) => {
      const existing = acc.find(t => t.type === e.type);
      if (existing) existing.count++;
      else acc.push({ type: e.type, count: 1 });
      return acc;
    }, [] as { type: string; count: number }[]).sort((a, b) => b.count - a.count);

    const commitmentMap = new Map<string, number>();
    allEvents.forEach(ev => {
      const dateStr = ev.date.toISOString().split('T')[0];
      const eventAttendances = allAttendances.filter(a => a.eventId === ev.id);
      const dayPoints = eventAttendances.reduce((sum, a) => sum + getAttendancePoints(a.status as any), 0);
      commitmentMap.set(dateStr, (commitmentMap.get(dateStr) || 0) + dayPoints);
    });

    const commitmentTrend = Array.from(commitmentMap.entries())
      .map(([date, points]) => ({ date, points }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      genderBreakdown,
      fieldStudyBreakdown,
      medicalBreakdown,
      positionBreakdown,
      eventTypeBreakdown,
      commitmentTrend,
      totalVolunteers: allVolunteers.length,
      totalEvents: allEvents.length,
      maleCount,
      femaleCount
    };
  }
}

export const storage = new DatabaseStorage();
