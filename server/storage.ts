import mongoose, { model, Model } from "mongoose";
import multer from "multer";

import {
  type User,
  type InsertUser,
  type ContactMessage,
  type InsertContactMessage,
  type Event,
  type InsertEvent,
  type News,
  type InsertNews,
  type Section,
  type InsertSection,
  userSchema,
  contactMessageSchema,
  eventSchema,
  newsSchema,
  SectionSchema,
  GalleryImage,
  GalleryVideo,
  GalleryImageModel,
  GalleryVideoModel,
  HeroVideo,
  HeroVideoModel,
  FacultySection,
  FacultySectionModel,
  FacultySectionInput
} from "@shared/schema";


// Define models
const UserModel: Model<User> =
  mongoose.models.User || model<User>("User", userSchema);
const ContactMessageModel: Model<ContactMessage> =
  mongoose.models.ContactMessage ||
  model<ContactMessage>("ContactMessage", contactMessageSchema);
const EventModel: Model<Event> =
  mongoose.models.Event || model<Event>("Event", eventSchema);
const NewsModel: Model<News> =
  mongoose.models.News || model<News>("News", newsSchema);
const SectionModel: Model<Section> =
  mongoose.models.Section || model<Section>("Section", SectionSchema);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  deleteEvent(id: string): Promise<Event | null>;
  updateEvent(id: string, data: InsertEvent): Promise<Event | null>;
  getNews(): Promise<News[]>;
  createNews(news: InsertNews): Promise<News>;
  updateNews(id: string, data: InsertNews): Promise<News | null>;
  deleteNews(id: string): Promise<News | null>;
  getSections(name?: string): Promise<Section[]>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: string, data: InsertSection): Promise<Section | null>;
  getGalleryImages(): Promise<GalleryImage[]>;
  createGalleryImage(mediaId: string, url: string, uploadedAt: Date): Promise<GalleryImage>;
  deleteGalleryImage(id: string): Promise<GalleryImage | null>;
  getGalleryVideos(): Promise<GalleryVideo[]>;
  createGalleryVideo(mediaId: string, url: string, uploadedAt: Date): Promise<GalleryVideo>;
  deleteGalleryVideo(id: string): Promise<GalleryVideo | null>;
  getHeroVideo(): Promise<HeroVideo | null>;
  createHeroVideo(mediaId: string, url: string, uploadedAt: Date): Promise<HeroVideo>;
  deleteHeroVideo(id: string): Promise<HeroVideo | null>;
  getFacultySection(): Promise<FacultySection | null>;
  createOrUpdateFacultySection(data: FacultySection): Promise<FacultySection>;
  deleteFacultySection(): Promise<FacultySection | null>;
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
    const plainDoc = doc.toObject() as {
      _id: mongoose.Types.ObjectId;
      username: string;
      password: string;
    };
    return {
      id: plainDoc._id.toString(),
      username: plainDoc.username,
      password: plainDoc.password,
    } as User;
  }

  async createContactMessage(
    insertMessage: InsertContactMessage
  ): Promise<ContactMessage> {
    const doc = await ContactMessageModel.create({
      ...insertMessage,
      phone: insertMessage.phone ?? undefined,
    });
    const plainDoc = doc.toObject() as {
      _id: mongoose.Types.ObjectId;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      subject: string;
      message: string;
      createdAt: Date;
    };
    return {
      id: plainDoc._id.toString(),
      firstName: plainDoc.firstName,
      lastName: plainDoc.lastName,
      email: plainDoc.email,
      phone: plainDoc.phone,
      subject: plainDoc.subject,
      message: plainDoc.message,
      createdAt: plainDoc.createdAt,
    } as ContactMessage;
  }

  async getEvents(): Promise<Event[]> {
    const docs = await EventModel.find().sort({ date: 1 }).lean().exec();
    return docs.map((doc) => ({ ...doc, id: doc._id.toString() })) as Event[];
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const doc = await EventModel.create(insertEvent);
    const plainDoc = doc.toObject() as {
      _id: mongoose.Types.ObjectId;
      title: string;
      description: string;
      date: Date;
      time: string;
      category: string;
      createdAt: Date;
    };
    return {
      id: plainDoc._id.toString(),
      title: plainDoc.title,
      description: plainDoc.description,
      date: plainDoc.date,
      time: plainDoc.time,
      category: plainDoc.category,
      createdAt: plainDoc.createdAt,
    } as Event;
  }

  async deleteEvent(id: string): Promise<Event | null> {
    const doc = await EventModel.findByIdAndDelete(id).lean().exec();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() } as Event;
  }

  async updateEvent(id: string, data: InsertEvent): Promise<Event | null> {
    const doc = await EventModel.findByIdAndUpdate(id, data, {
      new: true,
    })
      .lean()
      .exec();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() } as Event;
  }

  async getNews(): Promise<News[]> {
    const now = new Date();
    const docs = await NewsModel.find({
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return docs.map(
      (doc) =>
        ({
          ...doc,
          id: doc._id.toString(),
        }) as News
    );
  }



  async createNews(insertNews: InsertNews): Promise<News> {
    const doc = await NewsModel.create(insertNews);
    const plainDoc = doc.toObject() as {
      _id: mongoose.Types.ObjectId;
      title: string;
      content: string;
      type: string;
      createdAt: Date;
      expiresAt?: Date | null;
    };
    return {
      id: plainDoc._id.toString(),
      title: plainDoc.title,
      content: plainDoc.content,
      type: plainDoc.type,
      createdAt: plainDoc.createdAt,
      expiresAt: plainDoc.expiresAt ?? null,
    } as News;
  }

  async updateNews(id: string, data: InsertNews): Promise<News | null> {
    const doc = await NewsModel.findByIdAndUpdate(id, data, {
      new: true,
    })
      .lean()
      .exec();
    if (!doc) return null;
    return {
      ...doc,
      id: doc._id.toString(),
    } as News;
  }

  async deleteNews(id: string): Promise<News | null> {
    const doc = await NewsModel.findByIdAndDelete(id).lean().exec();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() } as News;
  }

  async getSections(name?: string): Promise<Section[]> {
    const query = name ? { name } : {};
    const docs = await SectionModel.find(query).lean().exec();
    return docs.map((doc) => ({
      ...doc,
      id: doc._id.toString(),
      images: doc.images as
        | { mediaId?: string; url: string; mode: "upload" | "url" }[]
        | undefined,
    })) as Section[];
  }

  async createSection(insertSection: InsertSection): Promise<Section> {
    const doc = await SectionModel.create(insertSection);

    const plainDoc = doc.toObject() as {
      _id: mongoose.Types.ObjectId;
      name: string;
      title: string;
      subtitle?: string;
      paragraphs?: string[];
      images?: { mediaId?: string; url: string; mode: "upload" | "url" }[];
      stats?: { label: string; value: string; description: string }[];
    };

    return {
      id: plainDoc._id.toString(),
      name: plainDoc.name,
      title: plainDoc.title,
      subtitle: plainDoc.subtitle,
      paragraphs: plainDoc.paragraphs,
      images: plainDoc.images,
      stats: plainDoc.stats,
    } as Section;
  }

  async updateSection(name: string, data: InsertSection): Promise<Section | null> {
    // Directly update (frontend enforces delete-before-replace)
    const doc = await SectionModel.findOneAndUpdate({ name }, data, {
      new: true,
      upsert: true,
    })
      .lean()
      .exec();

    if (!doc) return null;

    return {
      ...doc,
      id: doc._id.toString(),
      images: doc.images as
        | { mediaId?: string; url: string; mode: "upload" | "url" }[]
        | undefined,
    } as Section;
  }


  async getGalleryImages(): Promise<GalleryImage[]> {
    const docs = await GalleryImageModel.find().sort({ uploadedAt: -1 }).lean().exec();
    return docs.map((doc) => ({ ...doc, id: doc._id.toString() })) as GalleryImage[];
  }

  async createGalleryImage(mediaId: string, url: string, uploadedAt: Date): Promise<GalleryImage> {
    const doc = await GalleryImageModel.create({ mediaId, url, uploadedAt });
    const plainDoc = doc.toObject() as {
      _id: mongoose.Types.ObjectId;
      mediaId: string;
      url: string;
      uploadedAt: Date;
    };
    return {
      id: plainDoc._id.toString(),
      mediaId: plainDoc.mediaId,
      url: plainDoc.url,
      uploadedAt: plainDoc.uploadedAt,
    } as GalleryImage;
  }

  async deleteGalleryImage(id: string): Promise<GalleryImage | null> {
    const doc = await GalleryImageModel.findByIdAndDelete(id).lean().exec();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() } as GalleryImage;
  }

  async getGalleryVideos(): Promise<GalleryVideo[]> {
    const docs = await GalleryVideoModel.find().sort({ uploadedAt: -1 }).lean().exec();
    return docs.map((doc) => ({ ...doc, id: doc._id.toString() })) as GalleryVideo[];
  }

  async createGalleryVideo(mediaId: string, url: string, uploadedAt: Date): Promise<GalleryVideo> {
    const doc = await GalleryVideoModel.create({ mediaId, url, uploadedAt });
    const plainDoc = doc.toObject() as {
      _id: mongoose.Types.ObjectId;
      mediaId: string;
      url: string;
      uploadedAt: Date;
    };
    return {
      id: plainDoc._id.toString(),
      mediaId: plainDoc.mediaId,
      url: plainDoc.url,
      uploadedAt: plainDoc.uploadedAt,
    } as GalleryVideo;
  }

  async deleteGalleryVideo(id: string): Promise<GalleryVideo | null> {
    const doc = await GalleryVideoModel.findByIdAndDelete(id).lean().exec();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() } as GalleryVideo;
  }

  async getHeroVideo(): Promise<HeroVideo | null> {
    const doc = await HeroVideoModel.findOne().sort({ uploadedAt: -1 }).lean().exec();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() } as HeroVideo;
  }

  async createHeroVideo(mediaId: string, url: string, uploadedAt: Date): Promise<HeroVideo> {
    // Only one hero video allowed at a time → remove existing
    await HeroVideoModel.deleteMany({});

    const doc = await HeroVideoModel.create({ mediaId, url, uploadedAt });
    const plainDoc = doc.toObject() as {
      _id: mongoose.Types.ObjectId;
      mediaId: string;
      url: string;
      uploadedAt: Date;
    };

    return {
      id: plainDoc._id.toString(),
      mediaId: plainDoc.mediaId,
      url: plainDoc.url,
      uploadedAt: plainDoc.uploadedAt,
    } as HeroVideo;
  }

  async deleteHeroVideo(id: string): Promise<HeroVideo | null> {
    const doc = await HeroVideoModel.findByIdAndDelete(id).lean().exec();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() } as HeroVideo;
  }

  async getFacultySection(): Promise<FacultySection | null> {
    const doc = await FacultySectionModel.findOne().lean().exec();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() } as FacultySection;
  }

  async createOrUpdateFacultySection(data: FacultySectionInput): Promise<FacultySection> {
    const doc = await FacultySectionModel.findOneAndUpdate(
      {},
      data,
      { new: true, upsert: true }
    ).lean().exec();

    return { ...doc, id: doc._id.toString() } as FacultySection;
  }


  async deleteFacultySection(): Promise<FacultySection | null> {
    const doc = await FacultySectionModel.findOneAndDelete().lean().exec();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() } as FacultySection;
  }


}

export const storage = new MongoStorage();
