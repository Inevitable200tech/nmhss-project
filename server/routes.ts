import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertContactMessageSchema,
  insertEventSchema,
  insertNewsSchema,
  insertSectionSchema,
  insertTeacherSchema,
  MediaDatabaseModel,
  StudentMediaZodSchema,
} from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import multer from "multer";
import { SectionModel } from "@shared/schema";
import { GridFSBucket } from "mongodb";
import { MediaModel } from "@shared/schema";
import mongoose from "mongoose";
import { Readable } from "stream";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { getBestMediaDB, mediaConnections, reloadMediaDBs } from "./mediaDb";
import { pendingUploads } from "@shared/memoryUploads";
import { randomUUID } from "crypto";
import nodemailer from "nodemailer";



type UploadTracker = {
  count: number;
  month: number; // track month (1-12)
  lastUpload: number;
};

const userUploadTracker = new Map<string, UploadTracker>();
const rootEnvPath = path.resolve("cert.env");
const folderEnvPath = path.resolve("cert_env", "cert.env");
export const envPath = fs.existsSync(rootEnvPath) ? rootEnvPath : folderEnvPath;

dotenv.config({ path: envPath }); // Adjust the path if your .env is elsewhere

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "password";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
export const upload = multer({ storage: multer.memoryStorage() });

const validContentTypes = {
  image: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  video: [
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/wmv",
    "video/flv",
    "video/webm",
    "video/ogg",
    "video/mpeg",
  ],
  audio: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
  ],
};

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

  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactMessageSchema.parse(req.body);

      // Gmail transporter (App Password required!)
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_SENDER,     // Gmail address
          pass: process.env.EMAIL_SENDER_ID, // Gmail App Password
        },
      });

      // Send the email
      await transporter.sendMail({
        from: process.env.EMAIL_SENDER,
        replyTo: contactData.email, // so replies go to the user
        to: process.env.EMAIL_DESTINATION, // destination (your inbox)
        subject: `Contact Us Message: ${contactData.subject}`,
        text: `Name: ${contactData.firstName} ${contactData.lastName}
        Email: ${contactData.email}
        Phone: ${contactData.phone || "N/A"}
        Message:${contactData.message}`,
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <h2 style="color: #444;">📩 New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${contactData.firstName} ${contactData.lastName}</p>
          <p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
          <p><strong>Phone:</strong> ${contactData.phone || "N/A"}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-line; background: #f9f9f9; padding: 10px; border-radius: 6px; border: 1px solid #eee;">
            ${contactData.message}
          </p>
        </div>
      `,
      });

      res.json({ success: true, message: "Message sent successfully!" });
    } catch (error: any) {
      console.error("Gmail API error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });



  //------------------- EVENTS ROUTES ----------------

  // Get events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Create event (admin only)
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

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Event not found" });
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Update event (admin only)
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

  //------------------- NEWS ROUTES ----------------

  // Get news
  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // Create news (admin only)
  app.post("/api/news", requireAuth, async (req, res) => {
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
  app.put("/api/news/:id", requireAuth, async (req, res) => {
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
  app.delete("/api/news/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteNews(req.params.id);
      if (!deleted) return res.status(404).json({ error: "News not found" });
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete news" });
    }
  });

  // ---------------- SECTION ROUTES ----------------

  // Get sections (public)
  app.get("/api/sections/:name", async (req, res) => {
    try {
      const name = req.params.name;
      const sections = await storage.getSections(name);
      if (sections.length === 0) {
        res.status(404).json({ error: `No section found with name: ${name}` });
      } else {
        res.json(sections[0]); // return single section
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch section" });
    }
  });

  // Create section (admin only)
  app.post("/api/sections", requireAuth, async (req, res) => {
    try {
      const sectionData = insertSectionSchema.parse(req.body);
      const section = await storage.createSection(sectionData);
      res.json({ success: true, section });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create section" });
      }
    }
  });

  // Update section (admin only)
  app.put("/api/sections/:name", requireAuth, async (req, res) => {
    try {
      const sectionData = insertSectionSchema.parse(req.body);
      const updated = await storage.updateSection(req.params.name, sectionData);
      if (!updated) return res.status(404).json({ error: `Section not found: ${req.params.name}` });
      res.json({ success: true, section: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update section" });
      }
    }
  });

  //---------------- GALLERY ROUTES ----------------

  // Replace the GET /api/gallery route
  app.get("/api/gallery", async (req, res) => {
    try {
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
  app.post("/api/gallery/images", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const maxSize = 100 * 1024 * 1024; // 100MB limit
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "File size exceeds 100MB limit" });
      }

      const uploadedAt = z
        .preprocess((val) => (val ? new Date(val as string) : undefined), z.date())
        .parse(req.body.uploadedAt);

      // 1. Pick the best DB for this file
      const dbConn = await getBestMediaDB(req.file.size);
      const bucket = new GridFSBucket(dbConn.db!, { bucketName: "media" });

      // 2. Create a Readable stream from the multer buffer
      const readableStream = Readable.from(req.file.buffer);

      // 3. Upload to GridFS
      const writeStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: { type: "image", uploadedAt },
      });

      readableStream.pipe(writeStream);

      const mediaId = await new Promise<string>((resolve, reject) => {
        writeStream.on("finish", () => resolve(writeStream.id.toString()));
        writeStream.on("error", reject);
      });

      // 4. Store metadata in main DB
      await MediaModel.create({
        _id: new mongoose.Types.ObjectId(mediaId),
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        type: "image",
        uploadedAt,
        dbName: dbConn.name, // ✅ track where file was stored
      });

      // 5. Store gallery entry in main DB
      const image = await storage.createGalleryImage(mediaId, `/api/media/${mediaId}`, uploadedAt);

      // 6. Respond
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
  app.post("/api/gallery/videos", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const maxSize = 100 * 1024 * 1024; // 100MB limit
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "File size exceeds 100MB limit" });
      }

      const uploadedAt = z
        .preprocess((val) => (val ? new Date(val as string) : undefined), z.date())
        .parse(req.body.uploadedAt);

      // 1. Pick the best DB for this file
      const dbConn = await getBestMediaDB(req.file.size);
      const bucket = new GridFSBucket(dbConn.db!, { bucketName: "media" });

      // 2. Create a Readable stream from the multer buffer
      const readableStream = Readable.from(req.file.buffer);

      // 3. Upload to GridFS
      const writeStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: { type: "video", uploadedAt },
      });

      readableStream.pipe(writeStream);

      const mediaId = await new Promise<string>((resolve, reject) => {
        writeStream.on("finish", () => resolve(writeStream.id.toString()));
        writeStream.on("error", reject);
      });

      // 4. Store metadata in main DB
      await MediaModel.create({
        _id: new mongoose.Types.ObjectId(mediaId),
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        type: "video",
        uploadedAt,
        dbName: dbConn.name, // ✅ track which DB file was stored in
      });

      // 5. Store gallery entry in main DB
      const video = await storage.createGalleryVideo(mediaId, `/api/media/${mediaId}`, uploadedAt);

      // 6. Respond
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
  app.delete("/api/gallery/images/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteGalleryImage(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Image not found" });

      // 1. Find Media metadata
      const mediaDoc = await MediaModel.findById(deleted.mediaId);
      if (!mediaDoc) {
        return res.status(404).json({ error: "Media metadata not found" });
      }

      // 2. Get correct DB connection
      const dbConn = mediaConnections.get(mediaDoc.dbName)?.conn;
      if (!dbConn) {
        return res.status(500).json({ error: "Media DB not connected" });
      }

      const bucket = new GridFSBucket(dbConn.db!, { bucketName: "media" });

      // 3. Delete file from GridFS using deleted.mediaId
      await bucket.delete(new mongoose.Types.ObjectId(deleted.mediaId));

      // 4. Delete Media metadata from main DB
      await MediaModel.deleteOne({ _id: mediaDoc._id });

      res.json({ success: true, id: req.params.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });



  // DELETE /api/gallery/videos/:id
  app.delete("/api/gallery/videos/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteGalleryVideo(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Video not found" });

      // 1. Find Media metadata
      const mediaDoc = await MediaModel.findById(deleted.mediaId);
      if (!mediaDoc) {
        return res.status(404).json({ error: "Media metadata not found" });
      }

      // 2. Get correct DB connection
      const dbConn = mediaConnections.get(mediaDoc.dbName)?.conn;
      if (!dbConn) {
        return res.status(500).json({ error: "Media DB not connected" });
      }

      const bucket = new GridFSBucket(dbConn.db!, { bucketName: "media" });

      // 3. Delete file from GridFS using deleted.mediaId
      await bucket.delete(new mongoose.Types.ObjectId(deleted.mediaId));

      // 4. Delete Media metadata from main DB
      await MediaModel.deleteOne({ _id: mediaDoc._id });

      // 5. Respond
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });


  // ---------------- MEDIA ROUTES ----------------

  // Replace the GET /api/media/:id route
  app.get("/api/media/:id", async (req, res) => {
    try {
      // 1. Find metadata in main DB
      const mediaDoc = await MediaModel.findById(req.params.id);
      if (!mediaDoc) {
        return res.status(404).json({ message: "File not found (metadata)" });
      }

      // 2. Get correct DB connection
      const dbConn = mediaConnections.get(mediaDoc.dbName)?.conn;
      if (!dbConn) {
        return res.status(500).json({ message: "Media DB not connected" });
      }

      const bucket = new GridFSBucket(dbConn.db!, { bucketName: "media" });

      // 3. Get file details
      const files = await bucket
        .find({ _id: new mongoose.Types.ObjectId(req.params.id) })
        .toArray();

      if (!files[0]) {
        return res.status(404).json({ message: "File not found in GridFS" });
      }

      const file = files[0];
      const fileSize = file.length;
      const range = req.headers.range;

      // 4. Add caching for faster reloads
      res.set("Cache-Control", "public, max-age=31536000, immutable");

      // 5. Handle range requests (video/audio streaming)
      if (range) {
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

        bucket
          .openDownloadStream(new mongoose.Types.ObjectId(req.params.id), { start, end: end + 1 })
          .pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": file.contentType,
        });
        bucket.openDownloadStream(new mongoose.Types.ObjectId(req.params.id)).pipe(res);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: (err as Error).message });
    }
  });


  // POST /api/media
  // Modified endpoint
  app.post("/api/media", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const maxSize = 100 * 1024 * 1024; // 100MB limit
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "File size exceeds 100MB limit" });
      }

      // Validate MIME type
      const mimeType = req.file.mimetype.toLowerCase();
      const isValidType = Object.values(validContentTypes).some(types => types.includes(mimeType));
      if (!isValidType) {
        return res.status(400).json({ error: "Unsupported file type. Please upload image, video, or audio files only." });
      }

      // Determine media type
      const mediaType = mimeType.startsWith("image/") ? "image" :
        mimeType.startsWith("audio/") ? "audio" :
          "video";

      // 1. Pick the best DB for this file
      const dbConn = await getBestMediaDB(req.file.size);
      const bucket = new GridFSBucket(dbConn.db!, { bucketName: "media" });

      // 2. Create a Readable stream from the multer buffer
      const readableStream = Readable.from(req.file.buffer);

      // 3. Upload to GridFS
      const writeStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: {
          type: mediaType,
          uploadedAt: new Date(),
        },
      });

      readableStream.pipe(writeStream);

      const mediaId = await new Promise<string>((resolve, reject) => {
        writeStream.on("finish", () => resolve(writeStream.id.toString()));
        writeStream.on("error", reject);
      });

      // 4. Store metadata in main DB
      await MediaModel.create({
        _id: new mongoose.Types.ObjectId(mediaId),
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        type: mediaType,
        uploadedAt: new Date(),
        dbName: dbConn.name,
      });

      // 5. Respond to client
      res.json({
        id: mediaId,
        filename: req.file.originalname,
        type: mediaType,
        url: `/api/media/${mediaId}`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // DELETE /api/media/:id
  app.delete("/api/media/:id", requireAuth, async (req, res) => {
    try {
      // 1. Find metadata in main DB
      const mediaDoc = await MediaModel.findById(req.params.id);
      if (!mediaDoc) {
        console.error("File not found (metadata)");
        return res.status(404).json({ message: "File not found (metadata)" });
      }

      // 2. Get the correct DB connection
      const dbConn = mediaConnections.get(mediaDoc.dbName)?.conn;
      if (!dbConn) {
        return res.status(500).json({ message: "Media DB not connected" });
      }

      const bucket = new GridFSBucket(dbConn.db!, { bucketName: "media" });

      // 3. Check file exists in GridFS
      const files = await bucket
        .find({ _id: new mongoose.Types.ObjectId(req.params.id) })
        .toArray();
      if (!files[0]) {
        console.error("File not found in GridFS");
        return res.status(404).json({ message: "File not found in GridFS" });
      }

      // 4. Delete from GridFS
      await bucket.delete(new mongoose.Types.ObjectId(req.params.id));

      // 5. Delete Media metadata from main DB
      await MediaModel.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

      // 6. Remove references from Sections
      await SectionModel.updateMany(
        { "images.mediaId": req.params.id },
        { $pull: { images: { mediaId: req.params.id } } }
      );

      res.json({ message: "Deleted" });
      console.log("Deleted media and references:", req.params.id);
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


  // DELETE /api/hero-video/:id
  app.delete("/api/hero-video/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteHeroVideo(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Video not found" });

      // 1. Find Media metadata
      const mediaDoc = await MediaModel.findById(deleted.mediaId);
      if (!mediaDoc) {
        return res.status(404).json({ error: "Media metadata not found" });
      }

      // 2. Get correct DB connection
      const dbConn = mediaConnections.get(mediaDoc.dbName)?.conn;
      if (!dbConn) {
        return res.status(500).json({ error: "Media DB not connected" });
      }

      const bucket = new GridFSBucket(dbConn.db!, { bucketName: "media" });

      // 3. Delete file from GridFS using mediaId
      await bucket.delete(new mongoose.Types.ObjectId(deleted.mediaId));

      // 4. Delete Media metadata from main DB
      await MediaModel.deleteOne({ _id: mediaDoc._id });

      res.json({ success: true, id: req.params.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete hero video" });
    }
  });


  // ---------------- FACULTY SECTION ROUTES ----------------

  // Get faculty section (public)
  app.get("/api/faculty", async (req, res) => {
    try {
      const section = await storage.getFacultySection();
      if (!section) {
        return res.status(404).json({ error: "Faculty section not found" });
      }
      res.json(section);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch faculty section" });
    }
  });

  // Create or update faculty section (admin only)
  app.post("/api/faculty", requireAuth, async (req, res) => {
    try {
      // validate with zod
      const schema = z.object({
        title: z.string(),
        subtitle: z.string(),
        stats: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
            description: z.string(),
          })
        ).length(3),
        profiles: z.array(
          z.object({
            name: z.string(),
            role: z.string(),
            description: z.string(),
            mediaId: z.string().optional(),
            imageUrl: z.string().optional(),
          })
        ).length(3),
      });

      const data = schema.parse(req.body);
      const updated = await storage.createOrUpdateFacultySection(data);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error(error);
        res.status(500).json({ error: "Failed to save faculty section" });
      }
    }
  });

  // Delete faculty section (admin only)
  app.delete("/api/faculty", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteFacultySection();
      if (!deleted) {
        return res.status(404).json({ error: "Faculty section not found" });
      }
      res.json({ success: true, id: deleted.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete faculty section" });
    }
  });

  //------------------- MEDIA DATABASE ROUTES ----------------

  // GET /api/admin/media-dbs
  app.get("/api/admin/media-dbs", requireAuth, async (_req, res) => {
    try {
      const mediaDbs = await MediaDatabaseModel.find().lean();

      const mediaDbsWithStats = await Promise.all(
        mediaDbs.map(async (db) => {
          let logicalUsedMB: string | null = null;
          let allocatedMB: string | null = null;

          try {
            const conn = mediaConnections.get(db.name)?.conn;
            if (conn && conn.db) {
              try {
                const stats = await conn.db.command({ dbStats: 1 });
                logicalUsedMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
                allocatedMB = (stats.storageSize / (1024 * 1024)).toFixed(2);

                console.log(
                  `[MEDIA-DB][${db.name}] dbStats OK → logical=${logicalUsedMB} MB, allocated=${allocatedMB} MB`
                );
              } catch (dbStatsErr) {
                console.warn(`[MEDIA-DB][${db.name}] dbStats failed, falling back to collStats`, dbStatsErr);

                const chunkStats = await conn.db.command({ collStats: "media.chunks" });
                logicalUsedMB = (chunkStats.size / (1024 * 1024)).toFixed(2);
                allocatedMB = (chunkStats.storageSize / (1024 * 1024)).toFixed(2);

                console.log(
                  `[MEDIA-DB][${db.name}] collStats fallback → logical=${logicalUsedMB} MB, allocated=${allocatedMB} MB`
                );
              }
            }
          } catch (err) {
            console.error(`[MEDIA-DB][${db.name}] ERROR computing stats:`, err);
          }

          return {
            id: db._id.toString(),
            name: db.name,
            uri: db.uri,
            createdAt: db.createdAt,
            logicalUsedMB,
            allocatedMB,
            maxMB: 512,
          };
        })
      );

      console.log(`[MEDIA-DB] Returning stats for ${mediaDbsWithStats.length} DB(s)`);
      res.json(mediaDbsWithStats);
    } catch (err) {
      console.error(`[MEDIA-DB] Failed to fetch media databases`, err);
      res.status(500).json({ error: "Failed to fetch media databases" });
    }
  });

  // POST /api/admin/media-dbs
  app.post("/api/admin/media-dbs", requireAuth, async (req, res) => {
    try {
      const { uri } = req.body;
      if (!uri) return res.status(400).json({ error: "URI is required" });

      const count = await MediaDatabaseModel.countDocuments();
      if (count >= 80) {
        return res.status(400).json({ error: "Maximum of 80 media DBs reached" });
      }

      // Test connection
      const conn = await mongoose.createConnection(uri).asPromise();
      const dbName = conn.name;
      await conn.close();

      const mediaDb = await MediaDatabaseModel.create({ uri, name: dbName });

      await reloadMediaDBs(); // Reload all connections in memory

      res.status(201).json({
        id: mediaDb._id.toString(),
        name: mediaDb.name,
        uri: mediaDb.uri,
        createdAt: mediaDb.createdAt,
        totalSlots: 80,
        usedSlots: count + 1,
      });
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: "Invalid URI or unable to connect" });
    }
  });

  // DELETE /api/admin/media-dbs/:id
  app.delete("/api/admin/media-dbs/:id", requireAuth, async (req, res) => {
    try {
      const dbEntry = await MediaDatabaseModel.findById(req.params.id);
      if (!dbEntry) return res.status(404).json({ error: "Media database not found" });

      const conn = mediaConnections.get(dbEntry.name)?.conn;
      if (conn && conn.db) {
        const filesCount = await conn.db.collection("media.files").countDocuments();
        if (filesCount > 0) {
          return res.status(400).json({ error: "Cannot delete non-empty database" });
        }
      }

      await MediaDatabaseModel.findByIdAndDelete(req.params.id);
      await reloadMediaDBs();

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete media database" });
    }
  });

  //------------------- STUDENTS MEDIA MANAGEMENT ----------------

  // Create StudentMedia
  app.post("/api/admin-students", requireAuth, async (req, res) => {
    try {
      const validated = StudentMediaZodSchema.parse(req.body);
      const studentMedia = await storage.createStudentMedia(validated);
      res.status(201).json({ success: true, studentMedia });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create student media" });
    }
  });

  // Get all StudentMedia
  app.get("/api/students", async (req, res) => {
    try {
      const { batch, type, year } = req.query;

      const query: any = {};
      if (batch) query.batch = batch;        // "+1" | "+2"
      if (type) query.type = type;          // "image" | "video"
      if (year) query.year = parseInt(year as string); // numeric

      const studentMedia = await storage.getStudentMedia(query);
      res.json(studentMedia);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch student media" });
    }
  });


  // Delete StudentMedia + associated file
  app.delete("/api/admin-students/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteStudentMedia(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Student media not found" });

      const mediaDoc = await MediaModel.findById(deleted.mediaId);
      if (!mediaDoc) return res.status(404).json({ error: "Associated media not found" });

      const dbConn = mediaConnections.get(mediaDoc.dbName)?.conn;
      if (!dbConn) return res.status(500).json({ error: "Media DB not connected" });

      const bucket = new GridFSBucket(dbConn.db!, { bucketName: "media" });

      await bucket.delete(new mongoose.Types.ObjectId(deleted.mediaId));

      await MediaModel.deleteOne({ _id: mediaDoc._id });

      res.json({ success: true, id: req.params.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete student media" });
    }
  });

  //-------------TEMP-UPLOAD-VIDEO------------------------------

  app.post("/api/students-upload", upload.single("file"), (req, res) => {
    const userId = req.cookies.userUploadId;

    if (!userId) {
      return res.status(400).json({ error: "Upload tracking failed" });
    }

    const now = new Date();

    const currentMonth = now.getMonth(); // 0-11
    let tracker = userUploadTracker.get(userId);


    if (!tracker) {
      tracker = { count: 0, month: currentMonth, lastUpload: 0 };
      userUploadTracker.set(userId, tracker);
    }

    // ✅ Reset count if month changed
    if (tracker.month !== currentMonth) {
      tracker.count = 0;
      tracker.month = currentMonth;
    }

    // ✅ Monthly limit
    if (tracker.count >= 30) {
      return res.status(429).json({ error: "Monthly upload limit (30) reached" });
    }

    if (Date.now() - tracker.lastUpload < 25000) {
      const wait = Math.ceil((tracker.lastUpload + 25000 - Date.now()) / 1000);
      return res.status(429).json({ error: `Please wait ${wait}s before next upload` });
    }

    tracker.count++;
    tracker.lastUpload = Date.now();

    const { type, batch, year, description } = req.body;

    if (!req.file || !type || !batch || !year)
      return res.status(400).json({ error: "Missing required fields" });

    // ✅ Add this debug log
    console.log("Stored file:", {
      isBuffer: Buffer.isBuffer(req.file.buffer),
      mime: req.file.mimetype,
      length: req.file.buffer.length,
    });

    const tempId = randomUUID();
    pendingUploads.set(tempId, {
      tempId,
      file: Buffer.from(req.file.buffer), // <-- ensure Node Buffer
      mimeType: req.file.mimetype,
      filename: req.file.originalname,
      type: type as "image" | "video",
      batch: batch as "+1" | "+2",
      year: parseInt(year),
      description,
    });

    res.json({ tempId, message: "Upload successful, pending approval" });
  });

  app.get("/api/admin/pending-file/:tempId", (req, res) => {
    const pending = pendingUploads.get(req.params.tempId);
    if (!pending) return res.status(404).json({ error: "File not found" });

    // Explicit headers
    res.setHeader("Content-Type", pending.mimeType);
    res.setHeader("Content-Length", pending.file.length);
    res.setHeader("Content-Disposition", `inline; filename="${pending.filename}"`);

    // Important: use res.send(Buffer) here
    return res.send(Buffer.from(pending.file));
  });

  app.get("/api/admin/pending-uploads", requireAuth, (_req, res) => {
    const list = Array.from(pendingUploads.values()).map(({ tempId, type, batch, year, description, filename }) => ({
      tempId, type, batch, year, description, filename
    }));
    res.json(list);
  });

  app.post("/api/admin/approve-upload/:tempId", requireAuth, async (req, res) => {
    const pending = pendingUploads.get(req.params.tempId);
    if (!pending) return res.status(404).json({ error: "Upload not found" });

    try {
      // 1. Pick the best DB for this file
      const dbConn = await getBestMediaDB(pending.file.length);
      const bucket = new GridFSBucket(dbConn.db!, { bucketName: "media" });

      const readableStream = Readable.from(pending.file);
      const writeStream = bucket.openUploadStream(pending.filename, {
        contentType: pending.mimeType,
        metadata: { type: pending.type, uploadedAt: new Date() },
      });

      const mediaId = await new Promise<string>((resolve, reject) => {
        writeStream.on("finish", () => resolve(writeStream.id.toString()));
        writeStream.on("error", reject);
        readableStream.pipe(writeStream);
      });

      // 2. Store metadata in MediaModel
      await MediaModel.create({
        _id: new mongoose.Types.ObjectId(mediaId),
        filename: pending.filename,
        contentType: pending.mimeType,
        type: pending.type,
        uploadedAt: new Date(),
        dbName: dbConn.name,
      });

      // 3. Store in StudentMedia collection
      const studentMedia = await storage.createStudentMedia({
        mediaId,
        url: `/api/media/${mediaId}`,
        type: pending.type,
        batch: pending.batch,
        year: pending.year,
        description: pending.description,
      });

      // 4. Remove from memory
      pendingUploads.delete(req.params.tempId);

      res.json({ success: true, studentMedia });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to approve upload" });
    }
  });

  app.delete("/api/admin/disapprove-upload/:tempId", requireAuth, (req, res) => {
    const deleted = pendingUploads.delete(req.params.tempId);
    if (!deleted) return res.status(404).json({ error: "Upload not found" });
    res.json({ success: true });
  });

  app.get("/api/students-upload/quota", (req, res) => {
    const userId = req.cookies.userUploadId;
    if (!userId) return res.json({ remaining: 30, cooldownRemaining: 0 });

    const tracker = userUploadTracker.get(userId);
    const currentMonth = new Date().getMonth();

    if (!tracker || tracker.month !== currentMonth) {
      return res.json({ remaining: 30, cooldownRemaining: 0 });
    }

    const now = Date.now();
    const cooldownRemaining = Math.max(0, Math.ceil((tracker.lastUpload + 25000 - now) / 1000));

    res.json({
      remaining: Math.max(30 - tracker.count, 0),
      cooldownRemaining,
    });
  });

  //------------------- TEACHER MANAGEMENT ----------------

  // Get all teachers (public)
  app.get("/api/teachers", async (req, res) => {
    try {
      const teachers = await storage.getTeachers();
      res.json(teachers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  });

  // Create teacher (admin only)
  app.post("/api/admin/teachers", requireAuth, async (req, res) => {
    try {
      const teacherData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(teacherData);
      res.status(201).json({ success: true, teacher });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error(error);
      res.status(500).json({ error: "Failed to create teacher" });
    }
  });

  // Delete teacher (admin only)
  app.delete("/api/admin/teachers/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteTeacher(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      // Delete associated media if exists
      if (deleted.mediaId) {
        // 1. Find Media metadata
        const mediaDoc = await MediaModel.findById(deleted.mediaId);
        if (!mediaDoc) {
          return res.status(404).json({ error: "Media metadata not found" });
        }

        // 2. Get correct DB connection
        const dbConn = mediaConnections.get(mediaDoc.dbName)?.conn;
        if (!dbConn) {
          return res.status(500).json({ error: "Media DB not connected" });
        }

        const bucket = new GridFSBucket(dbConn.db!, { bucketName: "media" });

        // 3. Delete file from GridFS
        await bucket.delete(new mongoose.Types.ObjectId(deleted.mediaId));

        // 4. Delete Media metadata from main DB
        await MediaModel.deleteOne({ _id: mediaDoc._id });
      }

      res.json({ success: true, id: req.params.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete teacher" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}


