import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertContactMessageSchema,
  insertEventSchema,
  insertNewsSchema,
  insertSectionSchema
} from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import multer from "multer";
import { SectionModel } from "@shared/schema";

// Store uploads in memory buffer

import { MediaModel } from "@shared/schema";
const ADMIN_USER = "admin";
const ADMIN_PASS = "brocookedhard";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
export const upload = multer({ storage: multer.memoryStorage() });

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin login route
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });
      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Admin token verification route
  app.get("/api/admin/verify", requireAuth, (req, res) => {
    res.json({ success: true, message: "Token is valid" });
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(contactData);
      res.json({ success: true, message: "Message sent successfully!", id: message.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  // Get events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });


  // Get news
  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });



  // Create event (admin only)
  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.json({ success: true, event });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create event" });
      }
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Event not found" });
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Update event (admin only)
  app.put("/api/events/:id", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const updated = await storage.updateEvent(req.params.id, eventData);
      if (!updated) return res.status(404).json({ error: "Event not found" });
      res.json({ success: true, event: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update event" });
      }
    }
  });

  // Create news (admin only)
  app.post("/api/news", async (req, res) => {
    try {
      const newsData = insertNewsSchema
        .extend({
          expiresAt: z
            .union([z.string(), z.null()])
            .optional()
            .transform((val) => (val ? new Date(val) : null))
            .refine(
              (date) => !date || date > new Date(),
              { message: "Expiry date must be in the future" }
            ),
        })
        .parse(req.body);

      const news = await storage.createNews(newsData);
      res.json({ success: true, news });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create news" });
      }
    }
  });


  // Update news (admin only)
  app.put("/api/news/:id", async (req, res) => {
    try {
      const newsData = insertNewsSchema
        .extend({
          expiresAt: z
            .union([z.string(), z.null()])
            .optional()
            .transform((val) => (val ? new Date(val) : null))
            .refine(
              (date) => !date || date > new Date(),
              { message: "Expiry date must be in the future" }
            ),
        })
        .parse(req.body);

      const updated = await storage.updateNews(req.params.id, newsData);
      if (!updated) return res.status(404).json({ error: "News not found" });
      res.json({ success: true, news: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update news" });
      }
    }
  });

  // Delete news (admin only)
  app.delete("/api/news/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteNews(req.params.id);
      if (!deleted) return res.status(404).json({ error: "News not found" });
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete news" });
    }
  });

  // Get sections (public)
  app.get("/api/sections", async (req, res) => {
    try {
      const name = req.query.name as string;
      const sections = await storage.getSections(name);
      if (name && sections.length === 0) {
        res.status(404).json({ error: `No section found with name: ${name}` });
      } else {
        res.json(sections);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  // Create section (admin only)
  app.post("/api/sections", async (req, res) => {
    try {
      const sectionData = insertSectionSchema.parse(req.body);
      const section = await storage.createSection(sectionData);
      res.json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create section" });
      }
    }
  });

  app.put("/api/sections/:id", async (req, res) => {
    try {
      console.log("Updating section with ID:", req.params.id);
      console.log("Request body:", req.body);

      const sectionData = insertSectionSchema.parse(req.body);
      const updated = await storage.updateSection(req.params.id, sectionData);
      if (!updated) return res.status(404).json({ error: "Section not found" });
      res.json(updated);
    } catch (error) {
      console.error(error);
    }
  });


  // Upload file (image or video)

  app.post("/api/media", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const media = new MediaModel({
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        data: req.file.buffer,
        type: req.file.mimetype.startsWith("image/") ? "image" : "video",
      });

      await media.save();

      res.json({
        id: media._id,
        filename: media.filename,
        type: media.type,
        url: `/api/media/${media._id}`,
      });
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // Get media by id
  app.get("/api/media/:id", async (req, res) => {
    try {
      const media = await MediaModel.findById(req.params.id);
      if (!media) return res.status(404).json({ message: "File not found" });

      res.set("Content-Type", media.contentType);
      res.send(media.data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // Delete media by id
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const file = await MediaModel.findByIdAndDelete(req.params.id);
      if (!file) return res.status(404).json({ message: "File not found" });

      // 🔄 Remove orphan references from all sections
      await SectionModel.updateMany(
        { "images.id": req.params.id },
        { $pull: { images: { id: req.params.id } } }
      );

      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}


