import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertContactMessageSchema,
  insertEventSchema,
  insertNewsSchema,
  insertSectionSchema,
  Media
} from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import multer from "multer";
import { SectionModel } from "@shared/schema";
import { Db, GridFSBucket } from "mongodb";


// Store uploads in memory buffer

import { MediaModel } from "@shared/schema";
import mongoose from "mongoose";
import { Readable } from "stream";
const ADMIN_USER = "admin";
const ADMIN_PASS = "brocookedhard";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
export const upload = multer({ storage: multer.memoryStorage() });


let gridFSBucket: GridFSBucket | undefined;
mongoose.connection.once("open", () => {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection database is not available");
  }
  gridFSBucket = new GridFSBucket(mongoose.connection.db as Db, {
    bucketName: "media",
    chunkSizeBytes: 1024 * 1024 * 2, // 255KB chunk size
  });
});


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
      const sectionData = insertSectionSchema.parse(req.body);
      const updated = await storage.updateSection(req.params.id, sectionData);
      if (!updated) return res.status(404).json({ error: "Section not found" });
      res.json(updated);
    } catch (error) {
      console.error(error);
    }
  });


  // Replace the GET /api/media/:id route
  app.get("/api/media/:id", async (req, res) => {
    try {
      if (!gridFSBucket) {
        return res.status(503).json({ message: "Database connection not ready" });
      }

      const files = await gridFSBucket
        .find({ _id: new mongoose.Types.ObjectId(req.params.id) })
        .toArray();

      if (!files[0]) {
        return res.status(404).json({ message: "File not found" });
      }

      const file = files[0];
      const fileSize = file.length;
      const range = req.headers.range;

      // Add caching for faster reloads
      res.set("Cache-Control", "public, max-age=31536000, immutable");

      if (range) {
        // Example: "bytes=0-"
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": file.contentType,
        });

        gridFSBucket
          .openDownloadStream(new mongoose.Types.ObjectId(req.params.id), { start, end: end + 1 })
          .pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": file.contentType,
        });
        gridFSBucket.openDownloadStream(new mongoose.Types.ObjectId(req.params.id)).pipe(res);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: (err as Error).message });
    }
  });


  // Replace the GET /api/gallery route
  app.get("/api/gallery", async (req, res) => {
    try {
      if (!gridFSBucket) {
        return res.status(503).json({ message: "Database connection not ready" });
      }
      const [images, videos, section] = await Promise.all([
        storage.getGalleryImages(),
        storage.getGalleryVideos(),
        storage.getSections("gallery"),
      ]);
      res.json({
        images: images.map((img) => ({ id: img.id, url: img.url, uploadedAt: img.uploadedAt })),
        videos: videos.map((vid) => ({ id: vid.id, url: vid.url, uploadedAt: vid.uploadedAt })),
        title: section[0]?.title || "Photo Gallery & Timeline",
        subtitle: section[0]?.subtitle || "Explore our school's history through timeline and captured moments",
        stats: section[0]?.stats || [],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch gallery data" });
    }
  });

  // POST /api/gallery/images
  app.post("/api/gallery/images", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      if (!gridFSBucket) {
        return res.status(503).json({ message: "Database connection not ready" });
      }
      const maxSize = 100 * 1024 * 1024; // 100MB limit
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "File size exceeds 100MB limit" });
      }
      const uploadedAt = z
        .preprocess((val) => (val ? new Date(val as string) : undefined), z.date())
        .parse(req.body.uploadedAt);

      // Create a Readable stream from the multer buffer
      const readableStream = Readable.from(req.file.buffer);

      // Upload to GridFS
      const writeStream = gridFSBucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: { type: "image", uploadedAt },
      });

      // Pipe the buffer stream to GridFS
      readableStream.pipe(writeStream);

      const mediaId = await new Promise<string>((resolve, reject) => {
        writeStream.on("finish", () => resolve(writeStream.id.toString()));
        writeStream.on("error", reject);
      });

      // Store metadata in MediaModel
      await MediaModel.create({
        _id: new mongoose.Types.ObjectId(mediaId),
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        type: "image",
        uploadedAt,
      });

      const image = await storage.createGalleryImage(mediaId, `/api/media/${mediaId}`, uploadedAt);
      res.json({ id: image.id, url: image.url, uploadedAt: image.uploadedAt });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log(error);
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error(error);
        res.status(500).json({ error: "Failed to upload image" });
      }
    }
  });


  // POST /api/gallery/videos
  app.post("/api/gallery/videos", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      if (!gridFSBucket) {
        return res.status(503).json({ message: "Database connection not ready" });
      }
      const maxSize = 100 * 1024 * 1024; // 100MB limit
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "File size exceeds 100MB limit" });
      }
      const uploadedAt = z
        .preprocess((val) => (val ? new Date(val as string) : undefined), z.date())
        .parse(req.body.uploadedAt);

      // Create a Readable stream from the multer buffer
      const readableStream = Readable.from(req.file.buffer);

      // Upload to GridFS
      const writeStream = gridFSBucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: { type: "video", uploadedAt },
      });

      // Pipe the buffer stream to GridFS
      readableStream.pipe(writeStream);

      const mediaId = await new Promise<string>((resolve, reject) => {
        writeStream.on("finish", () => resolve(writeStream.id.toString()));
        writeStream.on("error", reject);
      });

      // Store metadata in MediaModel
      await MediaModel.create({
        _id: new mongoose.Types.ObjectId(mediaId),
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        type: "video",
        uploadedAt,
      });

      const video = await storage.createGalleryVideo(mediaId, `/api/media/${mediaId}`, uploadedAt);
      res.json({ id: video.id, url: video.url, uploadedAt: video.uploadedAt });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log(error);
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error(error);
        res.status(500).json({ error: "Failed to upload video" });
      }
    }
  });

  // DELETE /api/gallery/images/:id
  app.delete("/api/gallery/images/:id", async (req, res) => {
    try {
      if (!gridFSBucket) {
        return res.status(503).json({ message: "Database connection not ready" });
      }
      const deleted = await storage.deleteGalleryImage(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Image not found" });
      // Delete GridFS file using mediaId from GalleryImage
      await gridFSBucket.delete(new mongoose.Types.ObjectId(deleted.mediaId));
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // DELETE /api/gallery/videos/:id
  app.delete("/api/gallery/videos/:id", async (req, res) => {
    try {
      if (!gridFSBucket) {
        return res.status(503).json({ message: "Database connection not ready" });
      }
      const deleted = await storage.deleteGalleryVideo(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Video not found" });
      // Delete GridFS file using mediaId from GalleryVideo
      await gridFSBucket.delete(new mongoose.Types.ObjectId(deleted.mediaId));
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // POST /api/media
  app.post("/api/media", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      if (!gridFSBucket) {
        return res.status(503).json({ message: "Database connection not ready" });
      }
      const maxSize = 100 * 1024 * 1024; // 100MB limit
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "File size exceeds 100MB limit" });
      }

      // Create a Readable stream from the multer buffer
      const readableStream = Readable.from(req.file.buffer);

      // Upload to GridFS
      const writeStream = gridFSBucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: { type: req.file.mimetype.startsWith("image/") ? "image" : "video" },
      });

      // Pipe the buffer stream to GridFS
      readableStream.pipe(writeStream);

      const mediaId = await new Promise<string>((resolve, reject) => {
        writeStream.on("finish", () => resolve(writeStream.id.toString()));
        writeStream.on("error", reject);
      });

      // Store metadata in MediaModel
      await MediaModel.create({
        _id: new mongoose.Types.ObjectId(mediaId),
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        type: req.file.mimetype.startsWith("image/") ? "image" : "video",
        uploadedAt: new Date(),
      });

      res.json({
        id: mediaId,
        filename: req.file.originalname,
        type: req.file.mimetype.startsWith("image/") ? "image" : "video",
        url: `/api/media/${mediaId}`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // DELETE /api/media/:id
  app.delete("/api/media/:id", async (req, res) => {
    try {
      if (!gridFSBucket) {
        return res.status(503).json({ message: "Database connection not ready" });
      }
      const file = await gridFSBucket
        .find({ _id: new mongoose.Types.ObjectId(req.params.id) })
        .toArray();
      if (!file[0]) return res.status(404).json({ message: "File not found" });
      await gridFSBucket.delete(new mongoose.Types.ObjectId(req.params.id));
      await MediaModel.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
      await SectionModel.updateMany(
        { "images.id": req.params.id },
        { $pull: { images: { id: req.params.id } } }
      );
      res.json({ message: "Deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // ---------------- HERO VIDEO ROUTES ----------------

  // Get hero video (public)
  app.get("/api/hero-video", async (req, res) => {
    try {
      const video = await storage.getHeroVideo();
      res.json({ video });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hero video" });
    }
  });

  // Create/replace hero video (admin only)
  app.post("/api/hero-video", requireAuth, async (req, res) => {
    const schema = z.object({
      mediaId: z.string().min(1, "mediaId is required"),
      url: z.string().min(1, "URL is required"), // ✅ allow relative paths
    });

    const { mediaId, url } = schema.parse(req.body);

    const video = await storage.createHeroVideo(mediaId, url, new Date());

    res.json(video);
  });


  // Delete hero video (admin only)
  app.delete("/api/hero-video/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteHeroVideo(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Video not found" });

      // also delete associated GridFS media
      if (gridFSBucket) {
        await gridFSBucket.delete(new mongoose.Types.ObjectId(deleted.mediaId));
      }

      res.json({ success: true, id: req.params.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete hero video" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}


