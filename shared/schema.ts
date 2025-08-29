import { z } from "zod";
import mongoose, { Schema, model, Document, Model } from "mongoose";

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

// Prevent model overwrite
export const UserModel: Model<User> = mongoose.models.User || model<User>("User", userSchema);
export const ContactMessageModel: Model<ContactMessage> = mongoose.models.ContactMessage || model<ContactMessage>("ContactMessage", contactMessageSchema);
export const EventModel: Model<Event> = mongoose.models.Event || model<Event>("Event", eventSchema);
export const NewsModel: Model<News> = mongoose.models.News || model<News>("News", newsSchema);

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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertNews = z.infer<typeof insertNewsSchema>;