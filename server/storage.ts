import { type User, type InsertUser, type ContactMessage, type InsertContactMessage, type Event, type InsertEvent, type News, type InsertNews } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  getNews(): Promise<News[]>;
  createNews(news: InsertNews): Promise<News>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private contactMessages: Map<string, ContactMessage>;
  private events: Map<string, Event>;
  private news: Map<string, News>;

  constructor() {
    this.users = new Map();
    this.contactMessages = new Map();
    this.events = new Map();
    this.news = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = randomUUID();
    const message: ContactMessage = { ...insertMessage, id, createdAt: new Date(), phone: insertMessage.phone || null };
    this.contactMessages.set(id, message);
    return message;
  }

  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = { ...insertEvent, id, createdAt: new Date() };
    this.events.set(id, event);
    return event;
  }

  async getNews(): Promise<News[]> {
    return Array.from(this.news.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNews(insertNews: InsertNews): Promise<News> {
    const id = randomUUID();
    const news: News = { ...insertNews, id, createdAt: new Date() };
    this.news.set(id, news);
    return news;
  }
}

export const storage = new MemStorage();
