import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertContactMessageSchema,
  insertEventSchema,
  insertNewsSchema,
  insertOrUpdateAcademicResultSchema,
  insertSectionSchema,
  insertTeacherSchema,
  MediaDatabaseModel,
  StudentMediaZodSchema,
} from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import multer from "multer";
import { SectionModel } from "@shared/schema";
import { MediaModel } from "@shared/schema";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { pendingUploads } from "@shared/memoryUploads";
import { randomUUID } from "crypto";
import nodemailer from "nodemailer";
import { s3Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "./s3.ts";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

      // --- R2 MODIFICATION START ---

      // 1. Generate a unique ID and R2 Key
      const mediaId = new mongoose.Types.ObjectId().toString();
      // Store file under a clean key path (the Key acts as the MediaModel.filename)
      const Key = `gallery/images/${mediaId}-${req.file.originalname}`;
      // Construct the public URL (assuming R2_PUBLIC_URL is defined)
      const url = `${R2_PUBLIC_URL}/${Key}`;

      // 2. Upload to R2
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        Metadata: {
          type: "image",
          uploadedat: uploadedAt.toISOString(),
        },
      });

      await s3Client.send(command);

      // 3. Store metadata in main DB (using the unique ID and R2 Key)
      await MediaModel.create({
        _id: mediaId, // Use the unique ID for easy lookups
        filename: Key, // Store the R2 Key/path here
        contentType: req.file.mimetype,
        type: "image",
        uploadedAt,
        dbName: "r2", // Tracking placeholder for storage type
      });

      // 4. Store gallery entry in main DB (using the unique ID and public URL)
      const image = await storage.createGalleryImage(mediaId, url, uploadedAt);

      // --- R2 MODIFICATION END ---

      // 5. Respond
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

      // --- R2 MODIFICATION START ---

      // 1. Generate a unique ID and R2 Key
      const mediaId = new mongoose.Types.ObjectId().toString();
      // Store file under a clean key path (the Key acts as the MediaModel.filename)
      const Key = `gallery/videos/${mediaId}-${req.file.originalname}`;
      // Construct the public URL (assuming R2_PUBLIC_URL is defined)
      const url = `${R2_PUBLIC_URL}/${Key}`;

      // 2. Upload to R2
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        Metadata: {
          type: "video",
          uploadedat: uploadedAt.toISOString(),
        },
      });

      await s3Client.send(command);

      // 3. Store metadata in main DB (using the unique ID and R2 Key)
      await MediaModel.create({
        _id: mediaId, // Use the unique ID for easy lookups
        filename: Key, // Store the R2 Key/path here
        contentType: req.file.mimetype,
        type: "video",
        uploadedAt,
        dbName: "r2", // Tracking placeholder for storage type
      });

      // 4. Store gallery entry in main DB (using the unique ID and public URL)
      const video = await storage.createGalleryVideo(mediaId, url, uploadedAt);

      // --- R2 MODIFICATION END ---

      // 5. Respond
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
  // DELETE /api/gallery/images/:id
  app.delete("/api/gallery/images/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteGalleryImage(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Image not found" });

      // 1. Find Media metadata using the ID of the deleted gallery entry
      const mediaDoc = await MediaModel.findById(deleted.mediaId);

      // --- R2 MODIFICATION START ---

      if (mediaDoc) {
        // The R2 Key/path is stored in the filename field
        const Key = mediaDoc.filename;

        // 2. Delete file from R2
        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: Key,
        });

        await s3Client.send(deleteCommand);

        // 3. Delete Media metadata from main DB
        await MediaModel.deleteOne({ _id: mediaDoc._id });
      }
      // Note: If mediaDoc is not found, we assume the file was already cleaned up
      // and only the gallery entry needed removal, which is handled above.

      // --- R2 MODIFICATION END ---

      res.json({ success: true, id: req.params.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });



  // DELETE /api/gallery/videos/:id
  // DELETE /api/gallery/videos/:id
  app.delete("/api/gallery/videos/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteGalleryVideo(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Video not found" });

      // 1. Find Media metadata using the ID of the deleted gallery entry
      const mediaDoc = await MediaModel.findById(deleted.mediaId);

      // --- R2 MODIFICATION START ---

      if (mediaDoc) {
        // The R2 Key/path is stored in the filename field
        const Key = mediaDoc.filename;

        // 2. Delete file from R2
        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: Key,
        });

        await s3Client.send(deleteCommand);

        // 3. Delete Media metadata from main DB
        await MediaModel.deleteOne({ _id: mediaDoc._id });
      }
      // --- R2 MODIFICATION END ---

      // 4. Respond
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

      // --- R2 MODIFICATION START ---

      // The R2 Key/path is stored in the filename field
      const Key = mediaDoc.filename;

      // 2. Create the command to get the object
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key,
      });

      // 3. Generate a signed URL for the client to directly access the file from R2
      // We set a short expiration (e.g., 60 seconds) for security.
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

      // 4. Redirect the client to the signed R2 URL
      // REMOVED: res.set("Cache-Control", "public, max-age=31536000, immutable"); 
      // The global middleware in index.ts now sets 'no-store, no-cache',
      // which is correct for a redirect to a short-lived signed URL.
      res.redirect(302, signedUrl);

      // --- R2 MODIFICATION END ---

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

      // --- R2 MODIFICATION START ---

      // 1. Generate unique ID and R2 Key
      const mediaId = new mongoose.Types.ObjectId().toString();
      const Key = `${mediaType}s/${mediaId}-${req.file.originalname}`;

      // 2. Upload to R2
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        Metadata: {
          type: mediaType,
          uploadedat: new Date().toISOString(),
        },
      });

      await s3Client.send(command);

      // 3. Store metadata in main DB
      await MediaModel.create({
        _id: mediaId,
        filename: Key, // Store the R2 Key here for retrieval/deletion
        contentType: req.file.mimetype,
        type: mediaType,
        uploadedAt: new Date(),
        dbName: "r2", // Tracking placeholder for storage type
      });

      // --- R2 MODIFICATION END ---

      // 4. Respond to client
      res.json({
        id: mediaId,
        filename: req.file.originalname,
        type: mediaType,
        url: `/api/media/${mediaId}`, // URL points to the secure API endpoint
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

      // --- R2 MODIFICATION START ---

      // The R2 Key is stored in the filename field
      const Key = mediaDoc.filename;

      // 2. Delete file from R2
      const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: Key,
      });

      await s3Client.send(deleteCommand);

      // 3. Delete Media metadata from main DB
      await MediaModel.deleteOne({ _id: mediaDoc._id });

      // --- R2 MODIFICATION END ---

      // 4. Remove references from Sections (This logic remains intact)
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
      // 1. Delete the HeroVideo entry from the main DB
      const deleted = await storage.deleteHeroVideo(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Video not found" });

      // 2. Find Media metadata using the mediaId (which references the R2 Key)
      const mediaDoc = await MediaModel.findById(deleted.mediaId);

      // --- R2 MODIFICATION START ---

      if (mediaDoc) {
        // The R2 Key/path is stored in the filename field
        const Key = mediaDoc.filename;

        // 3. Delete file from R2
        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: Key,
        });

        // Send the delete command to the R2 client
        await s3Client.send(deleteCommand);

        // 4. Delete Media metadata from the main DB
        await MediaModel.deleteOne({ _id: mediaDoc._id });
      } else {
        // Log a warning if the media metadata is missing, but continue since the hero entry was deleted.
        console.warn(`Media metadata not found for hero video mediaId: ${deleted.mediaId}`);
      }
      
      // --- R2 MODIFICATION END ---

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
  // Delete StudentMedia + associated file
app.delete("/api/admin-students/:id", requireAuth, async (req, res) => {
    try {
      // 1. Delete the StudentMedia database entry
      const deleted = await storage.deleteStudentMedia(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Student media not found" });

      // 2. Find Media metadata using the mediaId
      const mediaDoc = await MediaModel.findById(deleted.mediaId);
      if (!mediaDoc) {
        console.warn(`Associated media metadata not found for Student Media ID: ${req.params.id}. Database record deleted.`);
        return res.json({ success: true, id: req.params.id, warning: "Media metadata was missing, only Student Media record was deleted." });
      }

      // --- R2 MODIFICATION START ---

      // The R2 Key/path is stored in the filename field
      const Key = mediaDoc.filename;

      // 3. Delete file from R2
      const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: Key,
      });

      await s3Client.send(deleteCommand);

      // 4. Delete Media metadata from main DB
      await MediaModel.deleteOne({ _id: mediaDoc._id });

      // --- R2 MODIFICATION END ---

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
      // --- R2 MODIFICATION START ---

      // 1. Generate unique ID and R2 Key
      const mediaId = new mongoose.Types.ObjectId().toString();
      // Store file under a clean key path (the Key acts as the MediaModel.filename)
      const Key = `${pending.type}s/${mediaId}-${pending.filename}`;

      // 2. Upload the file buffer to R2
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key,
        Body: pending.file, // The file is a buffer from memory
        ContentType: pending.mimeType,
        Metadata: {
          type: pending.type,
          uploadedat: new Date().toISOString(),
        },
      });

      await s3Client.send(command);

      // 3. Store metadata in MediaModel
      await MediaModel.create({
        _id: mediaId, // Use the unique ID for easy lookups
        filename: Key, // Store the R2 Key/path here for deletion/retrieval
        contentType: pending.mimeType,
        type: pending.type,
        uploadedAt: new Date(),
        dbName: "r2", // Tracking placeholder for storage type
      });

      // 4. Store in StudentMedia collection
      const studentMedia = await storage.createStudentMedia({
        mediaId,
        url: `/api/media/${mediaId}`, // Points to the secure R2 signed URL endpoint
        type: pending.type,
        batch: pending.batch,
        year: pending.year,
        description: pending.description,
      });

      // --- R2 MODIFICATION END ---

      // 5. Remove from memory
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
          console.warn(`Associated media metadata not found for Teacher ID: ${req.params.id}. Teacher record deleted.`);
        } else {
          // --- R2 MODIFICATION START ---

          // The R2 Key/path is stored in the filename field
          const Key = mediaDoc.filename;

          // 2. Delete file from R2
          const deleteCommand = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: Key,
          });

          // Send the delete command to the R2 client
          await s3Client.send(deleteCommand);

          // 3. Delete Media metadata from main DB
          await MediaModel.deleteOne({ _id: mediaDoc._id });
          
          // --- R2 MODIFICATION END ---
        }
      }

      res.json({ success: true, id: req.params.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete teacher" });
    }
  });

  //------academic-results------------------------
  

  // 1. Get all available years (for dropdown)
app.get("/api/academic-results/years", async (_req, res) => {
  try {
    const years = await storage.getAllAcademicYears();
    res.json(years);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch years" });
  }
});

// 2. Get full result for a specific year (public page uses this)
app.get("/api/academic-results/:year", async (req, res) => {
  const year = parseInt(req.params.year);
  if (isNaN(year)) return res.status(400).json({ error: "Invalid year" });

  try {
    const result = await storage.getAcademicResultByYear(year);
    if (!result) return res.status(404).json({ error: "Result not found" });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch result" });
  }
});

// 3. Create or Update entire academic result (admin only)
app.post("/api/admin/academic-results", requireAuth, async (req, res) => {
  try {
    const data = insertOrUpdateAcademicResultSchema.parse(req.body);
    const result = await storage.createOrUpdateAcademicResult(data);
    res.json({ success: true, result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.errors });
    } else {
      console.error(err);
      res.status(500).json({ error: "Failed to save result" });
    }
  }
});

// 4. Update specific year (optional — same as POST but clearer)
app.put("/api/admin/academic-results/:year", requireAuth, async (req, res) => {
  const year = parseInt(req.params.year);
  if (isNaN(year)) return res.status(400).json({ error: "Invalid year" });

  try {
    const data = insertOrUpdateAcademicResultSchema.parse({
      ...req.body,
      year,
    });
    const result = await storage.createOrUpdateAcademicResult(data);
    res.json({ success: true, result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.errors });
    } else {
      console.error(err);
      res.status(500).json({ error: "Failed to update result" });
    }
  }
});

// 5. Delete entire year's result + ALL associated student photos (admin only)
app.delete("/api/admin/academic-results/:year", requireAuth, async (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (isNaN(year)) return res.status(400).json({ error: "Invalid year" });

  try {
    const result = await storage.getAcademicResultByYear(year);
    if (!result) return res.status(404).json({ error: "Result not found" });

    // Collect all mediaIds from top students
    const mediaIds = [
      ...result.topHSStudents.map(s => s.mediaId).filter(Boolean),
      ...result.topHSSStudents.map(s => s.mediaId).filter(Boolean),
    ] as string[];

    // Delete all associated media from R2 + DB
    if (mediaIds.length > 0) {
      await Promise.all(
        mediaIds.map(async (id) => {
          try {
            const media = await MediaModel.findById(id);
            if (media) {
              // Delete from R2
              await s3Client.send(
                new DeleteObjectCommand({
                  Bucket: R2_BUCKET_NAME,
                  Key: media.filename,
                })
              );
              // Delete from MongoDB
              await MediaModel.findByIdAndDelete(id);
            }
          } catch (err) {
            console.warn(`Failed to delete media ${id}:`, err);
            // Don't fail the whole operation if one image fails
          }
        })
      );
    }

    // Now delete the academic result document
    await storage.deleteAcademicResult(year);

    res.json({
      success: true,
      message: `Academic result ${year} and ${mediaIds.length} photos deleted successfully`,
      deletedPhotos: mediaIds.length,
    });
  } catch (err) {
    console.error("Failed to delete academic result:", err);
    res.status(500).json({ error: "Failed to delete result" });
  }
});


  //----------------HEALTH-------------------------
  app.get("/health", (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    res.status(200).json({ message: 'I am alive' });
  });



  const httpServer = createServer(app);
  return httpServer;
}


