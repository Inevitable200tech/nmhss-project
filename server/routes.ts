import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertContactMessageSchema,
  insertEventSchema,
  insertNewsSchema,
  insertSectionSchema,
} from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import multer from "multer";
import { GridFsStorage } from "multer-gridfs-storage";

// Create the storage engine using GridFsStorage
const storageEngine = new GridFsStorage({
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/myDatabase', // Ensure the MongoDB URI is set
  file: (req, file) => {
    return {
      bucketName: 'images', // Define the bucket name
      filename: `${Date.now()}-${file.originalname}`, // Name the file uniquely
    };
  }
});

// Define the upload middleware
const upload = multer({ storage: storageEngine });


const ADMIN_USER = "admin";
const ADMIN_PASS = "brocookedhard";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

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

  // Public contact form
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

  // Public GET routes
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getNews();
      res.json(news);
    } catch {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/sections", async (req, res) => {
    try {
      const name = req.query.name as string;
      const sections = await storage.getSections(name);
      if (name && sections.length === 0) {
        res.status(404).json({ error: `No section found with name: ${name}` });
      } else {
        res.json(sections);
      }
    } catch {
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  // -------------------
  // Admin-only routes
  // -------------------

  // Events
  app.post("/api/events", requireAuth, async (req, res) => {
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

  app.put("/api/events/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Event not found" });
      res.json({ success: true, id: req.params.id });
    } catch {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // News
  app.post("/api/news", requireAuth, async (req, res) => {
    try {
      const newsData = insertNewsSchema
        .extend({
          expiresAt: z
            .union([z.string(), z.null()])
            .optional()
            .transform((val) => (val ? new Date(val) : null))
            .refine((date) => !date || date > new Date(), {
              message: "Expiry date must be in the future",
            }),
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

  app.put("/api/news/:id", requireAuth, async (req, res) => {
    try {
      const newsData = insertNewsSchema
        .extend({
          expiresAt: z
            .union([z.string(), z.null()])
            .optional()
            .transform((val) => (val ? new Date(val) : null))
            .refine((date) => !date || date > new Date(), {
              message: "Expiry date must be in the future",
            }),
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

  app.delete("/api/news/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteNews(req.params.id);
      if (!deleted) return res.status(404).json({ error: "News not found" });
      res.json({ success: true, id: req.params.id });
    } catch {
      res.status(500).json({ error: "Failed to delete news" });
    }
  });



  // Define the upload 

  app.post("/api/sections", upload.array("images"), async (req, res) => {
    try {
      const formData = req.body; // form data containing other fields
      const files = req.files; // the uploaded files
      const images = formData.images || []; // Images can be URL or files

      // Process the images: If a file is present, store it using GridFS
      const processedImages = images.map((image: string | Express.Multer.File) => {
        if (typeof image === 'string') {
          // Handle image URLs
          return image;
        } else if (image && image.filename) {
          // Handle uploaded images using GridFS
          return `${process.env.MONGODB_URI}/images/${image.filename}`;
        } else {
          return null;
        }
      }).filter(Boolean);

      const newSection = await storage.createSection({
        ...formData,
        images: processedImages,
      });

      res.status(201).json(newSection);
    } catch (error: unknown) {
      // Explicitly cast error to Error type
      if (error instanceof Error) {
        console.error("Error creating section:", error.message);
        res.status(500).json({ error: 'Failed to create section', details: error.message });
      } else {
        // If error is not an instance of Error, handle it here
        console.error("Unknown error:", error);
        res.status(500).json({ error: 'Failed to create section', details: 'An unknown error occurred' });
      }
    }
  });




  app.put("/api/sections/:id", requireAuth, upload.single("image"), async (req, res) => {
    try {
      const sectionData = insertSectionSchema.parse(req.body);

      // Handle image URL or uploaded image
      let imageUrl = sectionData.images?.[0];
      if (req.file) {
        imageUrl = `${process.env.MONGODB_URI}/images/${req.file.filename}`;
      }

      const updatedSection = await storage.updateSection(req.params.id, {
        ...sectionData,
        images: imageUrl ? [imageUrl] : [],
      });

      if (!updatedSection) {
        return res.status(404).json({ error: "Section not found" });
      }

      res.json(updatedSection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update section" });
      }
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
