import mongoose from "mongoose";
import { type User, type InsertUser, type ContactMessage, type InsertContactMessage, type Event, type InsertEvent, type News, type InsertNews } from "@shared/schema";

// Connect to MongoDB (add your connection string)

// User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const UserModel = mongoose.model("User", userSchema);

// ContactMessage schema
const contactMessageSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});
const ContactMessageModel = mongoose.model("ContactMessage", contactMessageSchema);

// Event schema
const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  time: String,
  category: String,
  createdAt: { type: Date, default: Date.now },
});
const EventModel = mongoose.model("Event", eventSchema);

// News schema
const newsSchema = new mongoose.Schema({
  title: String,
  content: String,
  type: String,
  createdAt: { type: Date, default: Date.now },
});
const NewsModel = mongoose.model("News", newsSchema);

// Section schema (for editable content)
const sectionSchema = new mongoose.Schema({
  name: String, // e.g. "about", "academics"
  title: String,
  paragraph: String,
  images: [String],
});
const SectionModel = mongoose.model("Section", sectionSchema);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  getNews(): Promise<News[]>;
  createNews(news: InsertNews): Promise<News>;
  getSections(): Promise<any[]>;
  updateSection(id: string, data: any): Promise<any>;
}

export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const doc = await UserModel.findById(id).lean();
    if (!doc) return undefined;
    return {
      id: doc._id.toString(),
      username: doc.username ?? "",
      password: doc.password ?? "",
    };
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ username }).lean();
    if (!doc) return undefined;
    return {
      id: doc._id.toString(),
      username: doc.username ?? "",
      password: doc.password ?? "",
    };
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const doc = await UserModel.create(insertUser);
    return {
      id: doc._id.toString(),
      username: doc.username ?? "",
      password: doc.password ?? "",
    };
  }
  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const doc = await ContactMessageModel.create(insertMessage);
    return {
      id: doc._id.toString(),
      message: doc.message ?? "",
      firstName: doc.firstName ?? "",
      lastName: doc.lastName ?? "",
      email: doc.email ?? "",
      phone: doc.phone ?? null,
      subject: doc.subject ?? "",
      createdAt: doc.createdAt,
    };
  }
  async getEvents(): Promise<Event[]> {
    const docs = await EventModel.find().sort({ date: 1 }).lean();
    return docs.map(doc => ({
      id: doc._id.toString(),
      title: doc.title ?? "",
      description: doc.description ?? "",
      date: doc.date ?? new Date(0),
      time: doc.time ?? "",
      category: doc.category ?? "",
      createdAt: doc.createdAt ?? new Date(0),
    }));
  }
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
      const doc = await EventModel.create(insertEvent);
      return {
          id: doc._id.toString(),
          title: doc.title ?? "",
          description: doc.description ?? "",
          date: doc.date ?? new Date(0),
          time: doc.time ?? "",
          category: doc.category ?? "",
          createdAt: doc.createdAt ?? new Date(0),
      };
  }
  async getNews(): Promise<News[]> {
    const docs = await NewsModel.find().sort({ createdAt: -1 }).lean();
    return docs.map(doc => ({
      id: doc._id.toString(),
      title: doc.title ?? "",
      content: doc.content ?? "",
      type: doc.type ?? "",
      createdAt: doc.createdAt ?? new Date(0),
    }));
  }
  async createNews(insertNews: InsertNews): Promise<News> {
    const doc = await NewsModel.create(insertNews);
    return {
      id: doc._id.toString(),
      title: doc.title ?? "",
      content: doc.content ?? "",
      type: doc.type ?? "",
      createdAt: doc.createdAt ?? new Date(0),
    };
  }
  async getSections(): Promise<any[]> {
    return await SectionModel.find().lean();
  }
  async updateSection(id: string, data: any): Promise<any> {
    return await SectionModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }
}

export const storage = new MongoStorage();