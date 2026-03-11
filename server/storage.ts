import { db } from "./db";
import {
  volunteers, events, attendances,
  type InsertVolunteer, type UpdateVolunteerRequest, type Volunteer,
  type InsertEvent, type UpdateEventRequest, type Event,
  type InsertAttendance, type Attendance, type RankingRecord
} from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";

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
  recordAttendances(eventId: number, records: { volunteerId: number; attended: boolean }[]): Promise<boolean>;

  // Rankings
  getVolunteerRankings(): Promise<RankingRecord[]>;
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

  async recordAttendances(eventId: number, records: { volunteerId: number; attended: boolean }[]): Promise<boolean> {
    // Delete existing records for this event
    await db.delete(attendances).where(eq(attendances.eventId, eventId));
    
    // Insert new records
    if (records.length > 0) {
      const inserts = records.map(r => ({
        eventId,
        volunteerId: r.volunteerId,
        attended: r.attended
      }));
      await db.insert(attendances).values(inserts);
    }
    
    return true;
  }

  // --- Rankings ---
  async getVolunteerRankings(): Promise<RankingRecord[]> {
    const records = await db.select({
      volunteer: volunteers,
      attendanceCount: sql<number>`cast(count(${attendances.id}) as integer)`
    })
    .from(volunteers)
    .leftJoin(attendances, sql`${volunteers.id} = ${attendances.volunteerId} and ${attendances.attended} = true`)
    .groupBy(volunteers.id)
    .orderBy(desc(sql`count(${attendances.id})`));
    
    return records;
  }
}

export const storage = new DatabaseStorage();
