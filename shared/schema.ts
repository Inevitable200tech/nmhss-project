import { z } from "zod";
import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  id: string;
  username: string;
  password: string;
}

export interface ContactMessage extends Document {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: Date;
}

export interface Event extends Document {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  category: string;
  createdAt: Date;
}

export interface News extends Document {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: Date;
  expiresAt?: Date | null; // ✅ optional expiry
}

export interface Section extends Document {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  images?: string[];
  stats?: { label: string; value: string; description?: string }[];
  profiles?: { name: string; role: string; description: string; image?: string }[];
}

// Frontend-specific types (plain objects without Mongoose Document properties)
export interface ClientEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  category: string;
  createdAt: Date;
}

export interface ClientNews {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: Date;
  expiresAt?: Date | null; // ✅ frontend expiry
}

export const userSchema = new Schema<User>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: false });

export const contactMessageSchema = new Schema<ContactMessage>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

export const eventSchema = new Schema<Event>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

export const newsSchema = new Schema<News>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: false }, // ✅ optional expiry
}, { timestamps: false });

export const SectionSchema = new Schema({
  name: { type: String, required: true, unique: true },
  title: String,
  subtitle: String,
  paragraphs: [String],
  // instead of plain strings, store objects with id + url
  images: [
    {
      id: { type: String, required: true },   // Media _id
      url: { type: String, required: true },  // "/api/media/:id" or external URL
    },
  ],
  stats: [
    {
      label: String,
      value: String,
      description: String,
    },
  ],
});

export const SectionModel = mongoose.model("Section", SectionSchema);


export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const insertContactMessageSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string(),
  message: z.string(),
});

export const insertEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.preprocess((val) => new Date(val as string), z.date()), // 👈 auto converts string → Date
  time: z.string(),
  category: z.string(),
});

export const insertNewsSchema = z.object({
  title: z.string(),
  content: z.string(),
  type: z.enum(["announcement", "news", "update"]), // restrict allowed values
  expiresAt: z.preprocess(
    (val) => {
      if (!val || val === "") return null; // empty → null
      return new Date(val as string);
    },
    z.date().nullable()
  ).optional(),
});

export const insertSectionSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  paragraphs: z.array(z.string()).optional(),
  images: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
      })
    )
    .optional(),
  stats: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        description: z.string(),
      })
    )
    .optional(),
});

// Replace the Media interface and schema in schema.ts
export interface Media extends Document {
  id: string;
  filename: string;
  contentType: string;
  type: "image" | "video";
  uploadedAt: Date;
}

const mediaSchema = new Schema<Media>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  type: { type: String, enum: ["image", "video"], required: true },
  uploadedAt: { type: Date, default: Date.now },
});

// Add to schema.ts
export interface GalleryImage extends Document {
  id: string;
  mediaId: string;
  url: string;
  uploadedAt: Date;
}

export interface GalleryVideo extends Document {
  id: string;
  mediaId: string;
  url: string;
  uploadedAt: Date;
}

export const galleryImageSchema = new Schema<GalleryImage>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  mediaId: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, required: true },
});

export const galleryVideoSchema = new Schema<GalleryVideo>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  mediaId: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, required: true },
});

export const GalleryImageModel = mongoose.model<GalleryImage>("GalleryImage", galleryImageSchema);
export const GalleryVideoModel = mongoose.model<GalleryVideo>("GalleryVideo", galleryVideoSchema);


// ---------------- HERO VIDEO ----------------
export interface HeroVideo extends Document {
  id: string;
  mediaId: string;   // ✅ link to Media collection
  url: string;       // e.g. "/api/media/:id"
  uploadedAt: Date;
}

export const heroVideoSchema = new Schema<HeroVideo>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  mediaId: { type: String, required: true },    // ✅ must store media id
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export const HeroVideoModel = mongoose.model<HeroVideo>("HeroVideo", heroVideoSchema);

export const MediaModel = mongoose.model<Media>("Media", mediaSchema);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type InsertSection = z.infer<typeof insertSectionSchema>;
