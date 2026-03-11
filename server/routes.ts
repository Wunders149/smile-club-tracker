import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

async function seedDatabase() {
  const existingVolunteers = await storage.getVolunteers();
  if (existingVolunteers.length === 0) {
    const v1 = await storage.createVolunteer({
      fullName: "Jane Doe",
      contact: "+261 34 00 000 00",
      address: "Majunga Be",
      email: "jane.doe@example.com",
      position: "President",
      studyField: "Medicine",
      major: "General",
      photo: ""
    });
    
    const v2 = await storage.createVolunteer({
      fullName: "John Smith",
      contact: "+261 32 11 111 11",
      address: "Tsaramandroso",
      email: "john.smith@example.com",
      position: "Vice President",
      studyField: "Management",
      major: "Finance",
      photo: ""
    });

    const v3 = await storage.createVolunteer({
      fullName: "Alice Johnson",
      contact: "+261 33 22 222 22",
      address: "Amborovy",
      email: "alice.j@example.com",
      position: "Active Volunteer",
      studyField: "Engineering",
      major: "Civil",
      photo: ""
    });

    const e1 = await storage.createEvent({
      name: "Annual General Meeting",
      type: "Meeting",
      date: new Date(new Date().setHours(new Date().getHours() - 48)),
      description: "Discussing the yearly goals."
    });

    const e2 = await storage.createEvent({
      name: "Beach Cleanup",
      type: "Awareness",
      date: new Date(new Date().setHours(new Date().getHours() + 48)),
      description: "Cleaning the tourist beach."
    });

    await storage.recordAttendances(e1.id, [
      { volunteerId: v1.id, status: "on_time" },
      { volunteerId: v2.id, status: "late" },
      { volunteerId: v3.id, status: "absent" }
    ]);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Seed DB on startup
  seedDatabase().catch(console.error);

  // --- Volunteers ---
  app.get(api.volunteers.list.path, async (req, res) => {
    const data = await storage.getVolunteers();
    res.json(data);
  });

  app.get(api.volunteers.ranking.path, async (req, res) => {
    const data = await storage.getVolunteerRankings();
    res.json(data);
  });

  app.get(api.volunteers.get.path, async (req, res) => {
    const item = await storage.getVolunteer(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    res.json(item);
  });

  app.post(api.volunteers.create.path, async (req, res) => {
    try {
      const input = api.volunteers.create.input.parse(req.body);
      const item = await storage.createVolunteer(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.volunteers.update.path, async (req, res) => {
    try {
      const input = api.volunteers.update.input.parse(req.body);
      const item = await storage.updateVolunteer(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.volunteers.delete.path, async (req, res) => {
    await storage.deleteVolunteer(Number(req.params.id));
    res.status(204).send();
  });


  // --- Events ---
  app.get(api.events.list.path, async (req, res) => {
    const data = await storage.getEvents();
    res.json(data);
  });

  app.get(api.events.get.path, async (req, res) => {
    const item = await storage.getEvent(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(item);
  });

  app.post(api.events.create.path, async (req, res) => {
    try {
      // Coerce dates from strings
      const bodySchema = api.events.create.input.extend({
        date: z.coerce.date(),
        endTime: z.coerce.date().nullable().optional()
      });
      const input = bodySchema.parse(req.body);
      const item = await storage.createEvent(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.events.update.path, async (req, res) => {
    try {
      const bodySchema = api.events.update.input.extend({
        date: z.coerce.date().optional(),
        endTime: z.coerce.date().nullable().optional()
      });
      const input = bodySchema.parse(req.body);
      const item = await storage.updateEvent(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.events.delete.path, async (req, res) => {
    await storage.deleteEvent(Number(req.params.id));
    res.status(204).send();
  });


  // --- Attendances ---
  app.get(api.attendances.listByEvent.path, async (req, res) => {
    const data = await storage.getAttendancesByEvent(Number(req.params.eventId));
    res.json(data);
  });

  app.post(api.attendances.record.path, async (req, res) => {
    try {
      const input = api.attendances.record.input.parse(req.body);
      await storage.recordAttendances(input.eventId, input.records);
      res.status(201).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // --- Statistics ---
  app.get(api.statistics.get.path, async (req, res) => {
    const stats = await storage.getStatistics();
    res.json(stats);
  });

  return httpServer;
}
