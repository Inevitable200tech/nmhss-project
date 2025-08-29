import { z } from "zod";
import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  username: string;
  password: string;
}

export interface ContactMessage extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: Date;
}

export interface Event extends Document {
  title: string;
  description: string;
  date: Date;
  time: string;
  category: string;
  createdAt: Date;
}

export interface News extends Document {
  title: string;
  content: string;
  type: string;
  createdAt: Date;
}

export interface Section extends Document {
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
}

export const userSchema = new Schema<User>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: false });

export const contactMessageSchema = new Schema<ContactMessage>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

export const eventSchema = new Schema<Event>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

export const newsSchema = new Schema<News>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

export const sectionSchema = new Schema<Section>({
  name: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  paragraphs: [{ type: String }],
  images: [{ type: String }],
  stats: [{ label: String, value: String, description: { type: String, required: false } }],
  profiles: [{ name: String, role: String, description: String, image: { type: String, required: false } }],
}, { timestamps: false });

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
  date: z.date(),
  time: z.string(),
  category: z.string(),
});

export const insertNewsSchema = z.object({
  title: z.string(),
  content: z.string(),
  type: z.string(),
});

export const insertSectionSchema = z.object({
  name: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  paragraphs: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  stats: z.array(z.object({ label: z.string(), value: z.string(), description: z.string().optional() })).optional(),
  profiles: z.array(z.object({ name: z.string(), role: z.string(), description: z.string(), image: z.string().optional() })).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type InsertSection = z.infer<typeof insertSectionSchema>;