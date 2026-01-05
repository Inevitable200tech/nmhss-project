import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import {
  insertEventSchema,
  insertNewsSchema,
  insertOrUpdateAcademicResultSchema,
  insertSectionSchema,
  insertTeacherSchema,
  StudentMediaZodSchema,
  insertOrUpdateSportsResultSchema,
  insertOrUpdateArtsScienceResultSchema,
  StudentMediaModel
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
import { s3Client, R2_BUCKET_NAME } from "./s3.ts";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Resend } from 'resend';

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

let ADMIN_USER = process.env.ADMIN_USER || "admin";
let ADMIN_PASS = process.env.ADMIN_PASS || "password";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL || "navamukundahss@gmail.com";
export const upload = multer({ storage: multer.memoryStorage() });
const resend = new Resend(process.env.RESEND_API_KEY || "");

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

// --- server/routes.ts ---

function requireAuth(req: Request, res: Response, next: NextFunction) {
  // 1. Try to get the token from the Header (Existing way)
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  // 2. Try to get the token from the Cookie (New secure way for Render)
  const cookieToken = req.cookies?.adminToken;

  // Use whichever token is available
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ message: "No token provided. Please log in." });
  }

  try {
    // Verify the token using your secret
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to the request for use in other routes
    (req as any).user = decoded;

    next();
  } catch (err) {
    console.log(`[AUTH] Invalid token attempt: ${err instanceof Error ? err.message : 'Unknown error'}`);
    res.status(401).json({ message: "Session expired or invalid. Please log in again." });
  }
}

// Rate limiter for admin-protected routes
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Store temporary verification codes in memory (expires after 10 minutes)
const developerVerificationCodes = new Map<string, { code: string; createdAt: number; email: string }>();

// Generate a 6-digit random code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean up expired verification codes (runs every minute)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of developerVerificationCodes.entries()) {
    if (now - value.createdAt > 10 * 60 * 1000) { // 10 minutes
      developerVerificationCodes.delete(key);
    }
  }
}, 60 * 1000);

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin login route
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });

      // SET THE COOKIE FOR BROWSER-LEVEL CSRF PROTECTION
      res.cookie("adminToken", token, {
        httpOnly: true,                   // Protects against XSS (scripting) attacks
        secure: true,                     // Required for Render.com (HTTPS)
        sameSite: "lax",                  // Recommended for Render to handle redirects
        maxAge: 60 * 60 * 1000            // 1 hour in milliseconds
      });

      // Keep the JSON response the same so your existing frontend doesn't break
      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });



  // Admin token verification route
  app.get("/api/admin/verify", requireAuth, adminRateLimiter, (req, res) => {
    res.json({ success: true, message: "Token is valid" });
  });

  // Update admin credentials route
  app.post("/api/admin/update-credentials", requireAuth, adminRateLimiter, (req, res) => {
    try {
      const { currentPassword, newUsername, newPassword } = req.body;

      // Validate current password
      if (currentPassword !== ADMIN_PASS) {
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
      }

      // Validate new credentials
      if (!newUsername || newUsername.trim().length < 3) {
        return res.status(400).json({ success: false, message: "Username must be at least 3 characters" });
      }

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      }

      // Update in-memory credentials
      ADMIN_USER = newUsername.trim();
      ADMIN_PASS = newPassword;

      // Also update environment variables
      process.env.ADMIN_USER = ADMIN_USER;
      process.env.ADMIN_PASS = ADMIN_PASS;

      res.json({ 
        success: true, 
        message: "Credentials updated successfully. You will need to log in again with the new credentials.",
        newUsername: ADMIN_USER
      });
    } catch (error) {
      console.error("Failed to update credentials:", error);
      res.status(500).json({ success: false, message: "Failed to update credentials" });
    }
  });

  // 1. Developer access request - generate and EMAIL code
  app.post("/api/admin/developer-request", async (req, res) => {
    try {
      const { email } = req.body;

      // Direct check
      if (!email || email.toLowerCase() !== DEVELOPER_EMAIL.toLowerCase()) {
        return res.status(403).json({ message: "Incorrect Email, Try again." });
      }

      const code = generateVerificationCode();
      const codeKey = `${email}-${code}`;

      developerVerificationCodes.set(codeKey, {
        code,
        createdAt: Date.now(),
        email,
      });

      // Send directly to your registered email
      const { error } = await resend.emails.send({
        from: 'NMHSS Admin <onboarding@resend.dev>',
        to: [DEVELOPER_EMAIL],
        subject: `Verification Code for NMHSS Thirunnavaya`,
        html: `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; padding: 50px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e1e4e8;">
        
        <div style="background-color: #0891b2; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">NMHSS Thirunnavaya</h1>
          <p style="color: #cffafe; margin: 5px 0 0 0; font-size: 14px;">Admin Dashboard Access</p>
        </div>

        <div style="padding: 40px 30px; text-align: center;">
          <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Verification Code</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
            A login attempt was made for the developer portal at 
            <a href="https://nmhss.onrender.com" style="color: #0891b2; text-decoration: none; font-weight: 600;">nmhss.onrender.com</a>.
            Use the code below to complete the verification.
          </p>
          
          <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 0 auto 30px auto; width: fit-content;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 900; color: #0891b2; letter-spacing: 8px;">
              ${code}
            </span>
          </div>

          <p style="color: #6b7280; font-size: 13px; margin: 0;">
            This code expires in <strong>10 minutes</strong>.
          </p>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; 2026 NMHSS Thirunnavaya Admin System.<br>
            If you did not request this, please ignore this message .
          </p>
        </div>

      </div>
    </div>
  `
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ message: "Email failed" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // 2. Verify developer code and issue SECURE COOKIE
  app.post("/api/admin/verify-developer-code", (req, res) => {
    try {
      const { email, code } = req.body;
      const codeKey = `${email}-${code}`;
      const storedCode = developerVerificationCodes.get(codeKey);

      if (!storedCode || (Date.now() - storedCode.createdAt > 10 * 60 * 1000)) {
        developerVerificationCodes.delete(codeKey);
        return res.status(401).json({ message: "Invalid or expired code" });
      }

      // Generate Token
      const token = jwt.sign({ email, isDeveloper: true }, JWT_SECRET, { expiresIn: "1h" });

      // SET SECURE COOKIE FOR RENDER
      res.cookie("adminToken", token, {
        httpOnly: true,
        secure: true,      // Essential for Render's HTTPS
        sameSite: "lax",
        maxAge: 3600000
      });

      developerVerificationCodes.delete(codeKey);

      // Return token in body as well for your current frontend state
      res.json({ success: true, token });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify code" });
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
  app.post("/api/events", requireAuth, adminRateLimiter, async (req, res) => {
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

  app.delete("/api/events/:id", requireAuth, adminRateLimiter, async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Event not found" });
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Update event (admin only)
  app.put("/api/events/:id", requireAuth, adminRateLimiter, async (req, res) => {
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
  app.post("/api/news", requireAuth, adminRateLimiter, async (req, res) => {
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
  app.put("/api/news/:id", requireAuth, adminRateLimiter, async (req, res) => {
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
  app.delete("/api/news/:id", requireAuth, adminRateLimiter, async (req, res) => {
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
  app.post("/api/sections", requireAuth, adminRateLimiter, async (req, res) => {
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
  app.put("/api/sections/:name", requireAuth, adminRateLimiter, async (req, res) => {
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

  // GET /api/gallery
  // Returns all gallery items with URLs pointing to the secure media endpoint
  app.get("/api/gallery", async (req, res) => {
    try {
      const [images, videos, section] = await Promise.all([
        storage.getGalleryImages(),
        storage.getGalleryVideos(),
        storage.getSections("gallery"),
      ]);

      const formatItem = (item: { id: any; _id: any; mediaId: any; uploadedAt: any; }) => ({
        id: item.id || item._id,
        url: `/api/media/${item.mediaId}`, // Redirects to the secure endpoint
        uploadedAt: item.uploadedAt,
      });

      res.json({
        images: (images || []).map(formatItem),
        videos: (videos || []).map(formatItem),
        title: section[0]?.title || "Photo Gallery & Timeline",
        subtitle: section[0]?.subtitle || "Captured moments",
        stats: section[0]?.stats || [],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch gallery data" });
    }
  });

  // POST /api/gallery/images
  app.post("/api/gallery/images", requireAuth, adminRateLimiter, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const uploadedAt = z
        .preprocess((val) => {
          // If val is missing, an empty object {}, or an empty string, return undefined
          if (!val || (typeof val === 'object' && Object.keys(val).length === 0)) {
            return undefined;
          }
          // Attempt to convert to a Date object
          const date = new Date(val as string);
          // Check if the date is valid
          return isNaN(date.getTime()) ? undefined : date;
        }, z.date({ required_error: "Please select a valid date" }))
        .parse(req.body.uploadedAt);

      const mediaId = new mongoose.Types.ObjectId().toString();
      const Key = `gallery/images/${mediaId}-${req.file.originalname}`;

      // 1. Upload to R2
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        Metadata: { type: "image" },
      }));

      // 2. Create Media Metadata
      await MediaModel.create({
        _id: mediaId,
        filename: Key,
        contentType: req.file.mimetype,
        type: "image",
        uploadedAt,
        dbName: "r2",
      });

      // 3. Create Gallery Entry
      const secureUrl = `/api/media/${mediaId}`;
      const image = await storage.createGalleryImage(mediaId, secureUrl, uploadedAt);

      res.json({ id: image.id, url: secureUrl, uploadedAt: image.uploadedAt });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // POST /api/gallery/videos
  app.post("/api/gallery/videos", requireAuth, adminRateLimiter, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const uploadedAt = z
        .preprocess((val) => {
          // If val is missing, an empty object {}, or an empty string, return undefined
          if (!val || (typeof val === 'object' && Object.keys(val).length === 0)) {
            return undefined;
          }
          // Attempt to convert to a Date object
          const date = new Date(val as string);
          // Check if the date is valid
          return isNaN(date.getTime()) ? undefined : date;
        }, z.date({ required_error: "Please select a valid date" }))
        .parse(req.body.uploadedAt);

      const mediaId = new mongoose.Types.ObjectId().toString();
      const Key = `gallery/videos/${mediaId}-${req.file.originalname}`;

      // 1. Upload to R2
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }));

      // 2. Create Media Metadata
      await MediaModel.create({
        _id: mediaId,
        filename: Key,
        contentType: req.file.mimetype,
        type: "video",
        uploadedAt,
        dbName: "r2",
      });

      // 3. Create Gallery Entry
      const secureUrl = `/api/media/${mediaId}`;
      const video = await storage.createGalleryVideo(mediaId, secureUrl, uploadedAt);

      res.json({ id: video.id, url: secureUrl, uploadedAt: video.uploadedAt });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  // DELETE /api/gallery/images/:id
  app.delete("/api/gallery/images/:id", requireAuth, adminRateLimiter, async (req, res) => {
    try {
      // 1. Delete from Gallery collection and get returned doc
      const deletedGalleryItem = await storage.deleteGalleryImage(req.params.id);
      if (!deletedGalleryItem) return res.status(404).json({ error: "Item not found" });

      // 2. Find Media metadata using mediaId from the gallery item
      const mediaDoc = await MediaModel.findById(deletedGalleryItem.mediaId);

      if (mediaDoc) {
        // 3. Delete from R2
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: mediaDoc.filename,
        }));

        // 4. Delete Media metadata
        await MediaModel.deleteOne({ _id: mediaDoc._id });
      }

      res.json({ success: true, message: "Gallery image and source file deleted" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // DELETE /api/gallery/videos/:id
  app.delete("/api/gallery/videos/:id", requireAuth, adminRateLimiter, async (req, res) => {
    try {
      const deletedGalleryItem = await storage.deleteGalleryVideo(req.params.id);
      if (!deletedGalleryItem) return res.status(404).json({ error: "Item not found" });

      const mediaDoc = await MediaModel.findById(deletedGalleryItem.mediaId);

      if (mediaDoc) {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: mediaDoc.filename,
        }));
        await MediaModel.deleteOne({ _id: mediaDoc._id });
      }

      res.json({ success: true, message: "Gallery video and source file deleted" });
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
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 120 });

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
  app.post("/api/media", requireAuth, adminRateLimiter, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const maxSize = 2000 * 1024 * 1024; // 2GB limit
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "File size exceeds 2GB limit" });
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
  app.delete("/api/media/:id", requireAuth, adminRateLimiter, async (req, res) => {
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

      await StudentMediaModel.deleteMany({ mediaId: req.params.id });

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
  app.post("/api/hero-video", requireAuth, adminRateLimiter, async (req, res) => {
    const schema = z.object({
      mediaId: z.string().min(1, "mediaId is required"),
      url: z.string().min(1, "URL is required"), // ✅ allow relative paths
    });

    const { mediaId, url } = schema.parse(req.body);

    const video = await storage.createHeroVideo(mediaId, url, new Date());

    res.json(video);
  });


  // DELETE /api/hero-video/:id
  app.delete("/api/hero-video/:id", requireAuth, adminRateLimiter, async (req, res) => {
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
  app.post("/api/faculty", requireAuth, adminRateLimiter, async (req, res) => {
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
  app.delete("/api/faculty", requireAuth, adminRateLimiter, async (req, res) => {
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
  app.post("/api/admin-students", requireAuth, adminRateLimiter, async (req, res) => {
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
  app.delete("/api/admin-students/:id", requireAuth, adminRateLimiter, async (req, res) => {
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

  app.get("/api/admin/pending-uploads", requireAuth, adminRateLimiter, (_req, res) => {
    const list = Array.from(pendingUploads.values()).map(({ tempId, type, batch, year, description, filename }) => ({
      tempId, type, batch, year, description, filename
    }));
    res.json(list);
  });

  app.post("/api/admin/approve-upload/:tempId", requireAuth, adminRateLimiter, async (req, res) => {
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

  app.delete("/api/admin/disapprove-upload/:tempId", requireAuth, adminRateLimiter, (req, res) => {
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
  app.post("/api/admin/teachers", requireAuth, adminRateLimiter, async (req, res) => {
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
  app.delete("/api/admin/teachers/:id", requireAuth, adminRateLimiter, async (req, res) => {
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
  app.post("/api/admin/academic-results", requireAuth, adminRateLimiter, async (req, res) => {
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

  // 4. Delete entire year's result + ALL associated student photos (admin only)
  app.delete("/api/admin/academic-results/:year", requireAuth, adminRateLimiter, async (req, res) => {
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

  //------SPORTS-RESULTS-ENDPOINTS------------------------

  // 1. Get all available years (for dropdown)
  app.get("/api/sports-results/years", async (_req, res) => {
    try {
      const years = await storage.getAllSportsYears();
      res.json(years);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch years" });
    }
  });

  // 2. Get full result for a specific year (public page uses this)
  app.get("/api/sports-results/:year", async (req, res) => {
    const year = parseInt(req.params.year);
    if (isNaN(year)) return res.status(400).json({ error: "Invalid year" });

    try {
      const result = await storage.getSportsResultByYear(year);
      if (!result) return res.status(404).json({ error: "Result not found" });
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch result" });
    }
  });

  // 3. Create or Update entire sports result (admin only)
  app.post("/api/admin/sports-results", requireAuth, adminRateLimiter, async (req, res) => {
    try {
      const data = insertOrUpdateSportsResultSchema.parse(req.body);
      const result = await storage.createOrUpdateSportsResult(data);
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
  app.put("/api/admin/sports-results/:year", requireAuth, adminRateLimiter, async (req, res) => {
    const year = parseInt(req.params.year);
    if (isNaN(year)) return res.status(400).json({ error: "Invalid year" });

    try {
      const data = insertOrUpdateSportsResultSchema.parse({
        ...req.body,
        year,
      });
      const result = await storage.createOrUpdateSportsResult(data);
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

  // New: Add a single champion to a year
  app.post("/api/admin/sports-results/:year/champions", requireAuth, adminRateLimiter, async (req, res) => {
    const year = parseInt(req.params.year);
    if (isNaN(year)) return res.status(400).json({ error: "Invalid year" });

    try {
      const championData = insertOrUpdateSportsResultSchema.shape.champions.element.parse(req.body);
      const { updatedResult, newIndex } = await storage.addChampionToYear(year, championData);
      if (!updatedResult) return res.status(404).json({ error: "Year not found" });

      res.json({
        success: true,
        result: updatedResult,
        championIndex: newIndex
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: err.errors });
      } else {
        console.error(err);
        res.status(500).json({ error: "Failed to add champion" });
      }
    }
  });

  app.put("/api/admin/sports-results/:year/champions/:championIndex", requireAuth, adminRateLimiter, async (req, res) => {
    const year = parseInt(req.params.year);
    const championIndex = parseInt(req.params.championIndex);

    if (isNaN(year) || isNaN(championIndex)) {
      return res.status(400).json({ error: "Invalid year or champion index" });
    }

    try {
      const championData = insertOrUpdateSportsResultSchema.shape.champions.element.parse(req.body);
      const updatedResult = await storage.updateChampionInYear(year, championIndex, championData);
      if (!updatedResult) return res.status(404).json({ error: "Year or champion not found" });
      res.json({ success: true, result: updatedResult });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: err.errors });
      } else {
        console.error(err);
        res.status(500).json({ error: "Failed to update champion" });
      }
    }
  });

  app.delete("/api/admin/sports-results/:year/champions/:championIndex", requireAuth, adminRateLimiter, async (req, res) => {
    const year = parseInt(req.params.year);
    const championIndex = parseInt(req.params.championIndex);

    if (isNaN(year) || isNaN(championIndex)) {
      return res.status(400).json({ error: "Invalid year or champion index" });
    }

    try {
      const result = await storage.deleteChampionFromYear(year, championIndex);

      if (!result) {
        return res.status(404).json({ error: "Champion not found" });
      }

      const { deletedChampion, mediaId } = result;

      if (mediaId) {
        try {
          const media = await MediaModel.findById(mediaId);
          if (media) {
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: media.filename,
              })
            );
            await MediaModel.findByIdAndDelete(mediaId);
          }
        } catch (err) {
          console.warn(`Failed to delete media ${mediaId}:`, err);
        }
      }

      res.json({
        success: true,
        message: `Champion deleted${mediaId ? ' and photo removed' : ''}`,
        deletedChampion,
      });
    } catch (err) {
      console.error("Failed to delete champion:", err);
      res.status(500).json({ error: "Failed to delete champion" });
    }
  });

  // 5. Delete entire year's result + ALL associated media (champions + slideshow)
  app.delete("/api/admin/sports-results/:year", requireAuth, adminRateLimiter, async (req, res) => {
    const year = parseInt(req.params.year, 10);
    if (isNaN(year)) return res.status(400).json({ error: "Invalid year" });

    try {
      const result = await storage.getSportsResultByYear(year);
      if (!result) return res.status(404).json({ error: "Result not found" });

      // Collect mediaIds from champions
      const championMediaIds = result.champions
        .map(c => c.mediaId)
        .filter(Boolean) as string[];

      // Collect mediaIds from slideshowImages
      const slideshowMediaIds = (result.slideshowImages || [])
        .map((img: any) => img.mediaId)
        .filter(Boolean) as string[];

      const allMediaIds = [...new Set([...championMediaIds, ...slideshowMediaIds])];

      // Delete all associated media
      if (allMediaIds.length > 0) {
        await Promise.all(
          allMediaIds.map(async (id) => {
            try {
              const media = await MediaModel.findById(id);
              if (media) {
                await s3Client.send(
                  new DeleteObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: media.filename,
                  })
                );
                await MediaModel.findByIdAndDelete(id);
              }
            } catch (err) {
              console.warn(`Failed to delete media ${id}:`, err);
            }
          })
        );
      }

      // Delete the sports result document
      await storage.deleteSportsResult(year);

      res.json({
        success: true,
        message: `Sports result ${year} and ${allMediaIds.length} photos deleted successfully`,
        deletedPhotos: allMediaIds.length,
      });
    } catch (err) {
      console.error("Failed to delete sports result:", err);
      res.status(500).json({ error: "Failed to delete result" });
    }
  });

  // ---------------- ARTS & SCIENCE RESULTS ENDPOINTS ----------------

  // GET: Fetch all available years (Public)
  app.get("/api/arts-science-results/years", async (req, res) => {
    try {
      const years = await storage.getAllArtsScienceYears();
      res.json(years);
    } catch (err) {
      console.error("Failed to fetch all arts and science years:", err);
      res.status(500).json({ error: "Failed to fetch years" });
    }
  });

  // GET: Fetch results for a specific year (Public)
  app.get("/api/arts-science-results/:year", async (req, res) => {
    const year = parseInt(req.params.year);
    if (isNaN(year)) {
      return res.status(400).json({ error: "Invalid year parameter" });
    }

    try {
      const result = await storage.getArtsScienceResultByYear(year);
      if (!result) {
        return res.status(404).json({ error: "Results not found for this year" });
      }
      res.json(result);
    } catch (err) {
      console.error(`Failed to fetch arts and science result for year ${year}:`, err);
      res.status(500).json({ error: "Failed to fetch result" });
    }
  });

  // POST: Create or Update an Arts & Science result (Admin Protected)
  app.post("/api/arts-science-results", requireAuth, adminRateLimiter, async (req, res) => {
    try {
      const validatedData = insertOrUpdateArtsScienceResultSchema.parse(req.body);
      const result = await storage.createOrUpdateArtsScienceResult(validatedData);

      res.json({
        success: true,
        message: `Arts & Science result for ${result.year} saved successfully`,
        result,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: err.errors });
      }
      console.error("Failed to save arts and science result:", err);
      res.status(500).json({ error: "Failed to save result" });
    }
  });


  // DELETE: Delete a result and associated media (Admin Protected)
  app.delete("/api/arts-science-results/:year", requireAuth, adminRateLimiter, async (req, res) => {
    const year = parseInt(req.params.year);
    if (isNaN(year)) {
      return res.status(400).json({ error: "Invalid year parameter" });
    }

    try {
      // 1. Fetch document to get all associated media IDs
      const docToDelete = await storage.getArtsScienceResultByYear(year);
      if (!docToDelete) {
        return res.status(404).json({ error: `Arts & Science result for ${year} not found` });
      }

      // Gather all mediaIds from Kalolsavam and Sasthrosavam achievements
      const kalolsavamMediaIds = docToDelete.kalolsavam.achievements
        .map(a => a.mediaId)
        .filter((id): id is string => !!id);
      const sasthrosavamMediaIds = docToDelete.sasthrosavam.achievements
        .map(a => a.mediaId)
        .filter((id): id is string => !!id);

      // Also gather mediaIds referenced by slideshowImages for both events (if present)
      const kalolsavamSlideIds = (docToDelete.kalolsavam.slideshowImages || [])
        .map((s: any) => s.mediaId)
        .filter((id: any): id is string => !!id);
      const sasthrosavamSlideIds = (docToDelete.sasthrosavam.slideshowImages || [])
        .map((s: any) => s.mediaId)
        .filter((id: any): id is string => !!id);

      const mediaIds = [
        ...kalolsavamMediaIds,
        ...sasthrosavamMediaIds,
        ...kalolsavamSlideIds,
        ...sasthrosavamSlideIds,
      ];

      // 2. Delete associated media from R2 and MongoDB
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
              // We ignore individual media deletion failures to ensure the main document is still deleted
            }
          })
        );
      }

      // 3. Delete the arts and science result document
      await storage.deleteArtsScienceResult(year);

      res.json({
        success: true,
        message: `Arts & Science result ${year} and ${mediaIds.length} associated photos deleted successfully`,
        deletedPhotos: mediaIds.length,
      });
    } catch (err) {
      console.error("Failed to delete arts and science result:", err);
      res.status(500).json({ error: "Failed to delete result" });
    }
  });

  //----------------STORAGE ANALYTICS-------------------------
  app.get("/api/admin/storage-stats", requireAuth, adminRateLimiter, async (req, res) => {
    try {
      // Get file counts from database
      const galleryImages = await storage.getGalleryImages();
      const galleryVideos = await storage.getGalleryVideos();
      const studentMedia = await storage.getStudentMedia();
      
      // Get media collection stats
      const mediaCollection = mongoose.connection.collection('medias');
      const mediaDocuments = await mediaCollection.countDocuments();
      
      // Get MongoDB database stats - count ALL documents from all collections
      let totalDocumentsInDb = 0;
      try {
        const collections = await mongoose.connection.db?.listCollections().toArray();
        if (collections) {
          for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            const collection = mongoose.connection.collection(collectionName);
            const count = await collection.countDocuments();
            totalDocumentsInDb += count;
          }
        }
      } catch (err) {
        console.warn("Failed to count all documents:", err);
        // Fallback: estimate based on collections we know about
        totalDocumentsInDb = galleryImages.length + galleryVideos.length + studentMedia.length + mediaDocuments;
      }
      
      // Get actual bucket usage from R2 using S3 API
      let bucketUsageMB = 0;
      let bucketObjectCount = 0;
      
      try {
        const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
        const listCommand = new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
        });
        
        let isTruncated = true;
        let continuationToken: string | undefined = undefined;
        
        while (isTruncated) {
          const listParams: any = {
            Bucket: R2_BUCKET_NAME,
          };
          if (continuationToken) {
            listParams.ContinuationToken = continuationToken;
          }
          
          const listCmd = new ListObjectsV2Command(listParams);
          const response = await s3Client.send(listCmd);
          
          if (response.Contents) {
            bucketObjectCount += response.Contents.length;
            response.Contents.forEach((obj) => {
              if (obj.Size) {
                bucketUsageMB += obj.Size / (1024 * 1024);
              }
            });
          }
          
          isTruncated = response.IsTruncated || false;
          continuationToken = response.NextContinuationToken;
        }
      } catch (err) {
        console.error("Failed to get R2 bucket stats:", err);
        // Fallback to estimation if S3 API fails
        const estimatedImageSize = galleryImages.length * 3;
        const estimatedVideoSize = galleryVideos.length * 50 + studentMedia.filter(m => m.type === 'video').length * 50;
        const estimatedStudentImageSize = studentMedia.filter(m => m.type === 'image').length * 3;
        bucketUsageMB = estimatedImageSize + estimatedVideoSize + estimatedStudentImageSize;
        bucketObjectCount = galleryImages.length + galleryVideos.length + studentMedia.length;
      }
      
      // Get MongoDB database stats - sum actual collection sizes
      let dbSizeMB = 0;
      let dbName = 'unknown';
      
      try {
        const db = mongoose.connection.db;
        if (db) {
          dbName = mongoose.connection.name || 'unknown';
          
          // Get stats for each collection and sum them up
          const collections = await db.listCollections().toArray();
          if (collections) {
            for (const collectionInfo of collections) {
              try {
                // Use collStats command to get collection stats
                const stats = await db.command({ collStats: collectionInfo.name });
                // Add the actual size from each collection
                if (stats.size) {
                  dbSizeMB += stats.size / (1024 * 1024);
                }
              } catch (err) {
                console.warn(`Failed to get stats for collection ${collectionInfo.name}:`, err);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to get MongoDB collection stats:", err);
        // Fallback: use 100 bytes per document (more conservative estimate)
        dbSizeMB = (totalDocumentsInDb * 0.1) / 1024;
        dbName = mongoose.connection.name || 'unknown';
      }
      
      // Storage limits (configurable)
      const BUCKET_LIMIT_GB = 10; // R2 bucket limit in GB
      const DB_LIMIT_GB = 0.5; // Database limit in GB
      
      const BUCKET_LIMIT_MB = BUCKET_LIMIT_GB * 1024;
      const DB_LIMIT_MB = DB_LIMIT_GB * 1024;
      
      const bucketUsagePercent = Math.min(100, (bucketUsageMB / BUCKET_LIMIT_MB) * 100);
      const dbUsagePercent = Math.min(100, (dbSizeMB / DB_LIMIT_MB) * 100);
      
      res.json({
        success: true,
        bucket: {
          used: Math.round(bucketUsageMB * 100) / 100,
          total: BUCKET_LIMIT_MB,
          usagePercent: Math.round(bucketUsagePercent * 100) / 100,
          objectCount: bucketObjectCount,
          itemCount: {
            images: galleryImages.length,
            videos: galleryVideos.length,
          },
          breakdown: {
            galleryImages: galleryImages.length,
            galleryVideos: galleryVideos.length,
            studentMedia: studentMedia.length,
          },
        },
        database: {
          used: Math.round(dbSizeMB * 100) / 100,
          total: DB_LIMIT_MB,
          usagePercent: Math.round(dbUsagePercent * 100) / 100,
          name: dbName,
          itemCount: {
            galleryImages: galleryImages.length,
            galleryVideos: galleryVideos.length,
            studentMedia: studentMedia.length,
            totalDocuments: totalDocumentsInDb,
          },
        },
        warning: bucketUsagePercent > 80 || dbUsagePercent > 80 ? "Storage usage is high" : null,
        critical: bucketUsagePercent > 95 || dbUsagePercent > 95 ? "Storage is almost full" : null,
      });
    } catch (err) {
      console.error("Failed to get storage stats:", err);
      res.status(500).json({ error: "Failed to retrieve storage statistics" });
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


