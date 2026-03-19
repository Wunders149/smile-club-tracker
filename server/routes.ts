import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

import { createBackup } from "./backup";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- Backup ---
  app.post("/api/backup", async (req, res) => {
    try {
      await createBackup();
      res.json({ success: true, message: "Backup synced to GitHub successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Volunteers ---
  app.get(api.volunteers.list.path, async (req, res) => {
    const data = await storage.getVolunteers();
    res.json(data);
  });

  app.get(api.volunteers.ranking.path, async (req, res) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const data = await storage.getVolunteerRankings(year);
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
      // Sync backup to GitHub
      createBackup().catch(err => console.error("Auto-backup failed:", err));
      res.status(201).json(item);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      if (err.message === "A volunteer with this email already exists." || 
          err.message === "A volunteer with this name and contact already exists.") {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  app.put(api.volunteers.update.path, async (req, res) => {
    try {
      const input = api.volunteers.update.input.parse(req.body);
      const item = await storage.updateVolunteer(Number(req.params.id), input);
      createBackup().catch(err => console.error("Auto-backup failed:", err));
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
    createBackup().catch(err => console.error("Auto-backup failed:", err));
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
      createBackup().catch(err => console.error("Auto-backup failed:", err));
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
      createBackup().catch(err => console.error("Auto-backup failed:", err));
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
    createBackup().catch(err => console.error("Auto-backup failed:", err));
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
      createBackup().catch(err => console.error("Auto-backup failed:", err));
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
