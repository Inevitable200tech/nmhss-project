import mongoose, { Schema, model, Document, Model } from "mongoose";
import { type User, type InsertUser, type ContactMessage, type InsertContactMessage, type Event, type InsertEvent, type News, type InsertNews, type Section, type InsertSection, userSchema, contactMessageSchema, eventSchema, newsSchema, sectionSchema } from "@shared/schema";

// Define models
const UserModel: Model<User> = mongoose.models.User || model<User>("User", userSchema);
const ContactMessageModel: Model<ContactMessage> = mongoose.models.ContactMessage || model<ContactMessage>("ContactMessage", contactMessageSchema);
const EventModel: Model<Event> = mongoose.models.Event || model<Event>("Event", eventSchema);
const NewsModel: Model<News> = mongoose.models.News || model<News>("News", newsSchema);
const SectionModel: Model<Section> = mongoose.models.Section || model<Section>("Section", sectionSchema);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  getNews(): Promise<News[]>;
  createNews(news: InsertNews): Promise<News>;
  getSections(): Promise<Section[]>;
  updateSection(id: string, data: InsertSection): Promise<Section | null>;
}

export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const doc = await UserModel.findById(id).lean().exec();
    if (!doc) return undefined;
    return { ...doc, id: doc._id.toString() } as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ username }).lean().exec();
    if (!doc) return undefined;
    return { ...doc, id: doc._id.toString() } as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const doc = await UserModel.create(insertUser);
    return doc.toObject() as User;
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const doc = await ContactMessageModel.create({
      ...insertMessage,
      phone: insertMessage.phone ?? undefined,
    });
    return doc.toObject() as ContactMessage;
  }

  async getEvents(): Promise<Event[]> {
    const docs = await EventModel.find().sort({ date: 1 }).lean().exec();
    return docs.map(doc => ({ ...doc, id: doc._id.toString() })) as Event[];
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const doc = await EventModel.create(insertEvent);
    return doc.toObject() as Event;
  }

  async getNews(): Promise<News[]> {
    const docs = await NewsModel.find().sort({ createdAt: -1 }).lean().exec();
    return docs.map(doc => ({ ...doc, id: doc._id.toString() })) as News[];
  }

  async createNews(insertNews: InsertNews): Promise<News> {
    const doc = await NewsModel.create(insertNews);
    return doc.toObject() as News;
  }

  async getSections(): Promise<Section[]> {
    const docs = await SectionModel.find().lean().exec();
    return docs.map(doc => ({ ...doc, id: doc._id.toString() })) as Section[];
  }

  async updateSection(id: string, data: InsertSection): Promise<Section | null> {
    const doc = await SectionModel.findByIdAndUpdate(id, data, { new: true }).lean().exec();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() } as Section;
  }
}

export const storage = new MongoStorage();