import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const POSITIONS = [
  "President", "Vice President", "Financial Officer", "Fundraising Officer",
  "Communication Officer", "Education Officer", "Administration Officer",
  "Assisting Board Member", "Active Volunteer", "Student Volunteer",
  "Medical Volunteer", "Advisor"
] as const;

export const EVENT_TYPES = [
  "Meeting", "Workshop", "Training", "Surgical Programs",
  "Awareness", "Fundraising", "Outing"
] as const;

export const volunteers = pgTable("volunteers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  contact: text("contact").notNull(),
  address: text("address").notNull(),
  email: text("email").notNull(),
  photo: text("photo"), // URL or base64 representation
  studyField: text("study_field"),
  major: text("major"),
  position: text("position").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendances = pgTable("attendances", {
  id: serial("id").primaryKey(),
  volunteerId: integer("volunteer_id").notNull(), // Manually handling ref for simplicity, though Drizzle supports it
  eventId: integer("event_id").notNull(),
  attended: boolean("attended").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const volunteersRelations = relations(volunteers, ({ many }) => ({
  attendances: many(attendances),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  attendances: many(attendances),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
  volunteer: one(volunteers, {
    fields: [attendances.volunteerId],
    references: [volunteers.id],
  }),
  event: one(events, {
    fields: [attendances.eventId],
    references: [events.id],
  }),
}));

export const insertVolunteerSchema = createInsertSchema(volunteers).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertAttendanceSchema = createInsertSchema(attendances).omit({ id: true, createdAt: true });

export type Volunteer = typeof volunteers.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Attendance = typeof attendances.$inferSelect;

export type InsertVolunteer = z.infer<typeof insertVolunteerSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type UpdateVolunteerRequest = Partial<InsertVolunteer>;
export type UpdateEventRequest = Partial<InsertEvent>;
export type UpdateAttendanceRequest = Partial<InsertAttendance>;

export type RankingRecord = {
  volunteer: Volunteer;
  attendanceCount: number;
};
