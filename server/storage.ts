import mongoose, { model, Model } from "mongoose";
import {
  type Event,
  type InsertEvent,
  type News,
  type InsertNews,
  type Section,
  type InsertSection,
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
  FacultySectionInput,
  StudentMedia,
  StudentMediaModel,
  LeanStudentMedia,
  StudentMediaZodSchema,
  Teacher,
  InsertTeacher,
  TeacherModel,
  AcademicResultDocument,
  AcademicResultSchema,
  AcademicResultModel,
  InsertOrUpdateAcademicResult
} from "@shared/schema";


// Define models

const EventModel: Model<Event> =
  mongoose.models.Event || model<Event>("Event", eventSchema);
const NewsModel: Model<News> =
  mongoose.models.News || model<News>("News", newsSchema);
const SectionModel: Model<Section> =
  mongoose.models.Section || model<Section>("Section", SectionSchema);
const AcademicResultModelInstance: Model<AcademicResultDocument> =
  mongoose.models.AcademicResult || model<AcademicResultDocument>("AcademicResult", AcademicResultSchema);

export interface IStorage {
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
  getStudentMedia(filter?: Partial<Pick<StudentMedia, "batch" | "type" | "year">>): Promise<StudentMedia[]>;
  createStudentMedia(entry: Omit<StudentMedia, "id">): Promise<StudentMedia>;
  deleteStudentMedia(id: string): Promise<StudentMedia | null>;
  getTeachers(): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  deleteTeacher(id: string): Promise<Teacher | null>;
  getAcademicResultByYear(year: number): Promise<AcademicResultDocument | null>;
  getAllAcademicYears(): Promise<number[]>;
  createOrUpdateAcademicResult(data: InsertOrUpdateAcademicResult): Promise<AcademicResultDocument>;
  deleteAcademicResult(year: number): Promise<AcademicResultDocument | null>;
}

export class MongoStorage implements IStorage {
  
  async getEvents(): Promise<Event[]> {
    const docs = await EventModel.find().sort({ date: 1 }).lean().exec();
    return docs.map((doc) => ({ ...doc, id: doc._id.toString() })) as unknown as Event[];
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
    return { ...doc, id: doc._id.toString() } as unknown as Event;
  }

  async updateEvent(id: string, data: InsertEvent): Promise<Event | null> {
    const doc = await EventModel.findByIdAndUpdate(id, data, {
      new: true,
    })
      .lean()
      .exec();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() } as unknown as Event;
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
        }) as unknown as News
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
    } as unknown as News;
  }

  async deleteNews(id: string): Promise<News | null> {
    const doc = await NewsModel.findByIdAndDelete(id).lean().exec();
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() } as unknown as News;
  }

  async getSections(name?: string): Promise<Section[]> {
    const query = name ? { name } : {};
    const docs = await SectionModel.find(query).lean().exec();
    return docs.map((doc) => ({
      ...doc,
      id: doc._id.toString(),
      images: doc.images as { mediaId?: string; url: string; mode: "upload" | "url"; }[] |
        undefined,
      audios: doc.audios as { mediaId?: string; url: string; mode: "upload" | "url"; }[] |
        undefined,
    })) as unknown as Section[];
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
      audios?: { mediaId?: string; url: string; mode: "upload" | "url" }[];
      stats?: { label: string; value: string; description: string }[];
    };

    return {
      id: plainDoc._id.toString(),
      name: plainDoc.name,
      title: plainDoc.title,
      subtitle: plainDoc.subtitle,
      paragraphs: plainDoc.paragraphs,
      images: plainDoc.images,
      audios: plainDoc.audios,
      stats: plainDoc.stats,
    } as Section;
  }

  async updateSection(name: string, data: InsertSection): Promise<Section | null> {
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
      images: doc.images as { mediaId?: string; url: string; mode: "upload" | "url"; }[] |
        undefined,
      audios: doc.audios as { mediaId?: string; url: string; mode: "upload" | "url"; }[] |
        undefined,
    } as unknown as Section;
  }


  async getGalleryImages(): Promise<GalleryImage[]> {
    const docs = await GalleryImageModel.find().sort({ uploadedAt: -1 }).lean().exec();
    const typed = docs as unknown as ({ _id: mongoose.Types.ObjectId } & Omit<GalleryImage, "id">)[];
    return typed.map((doc) => ({ ...doc, id: doc._id.toString() })) as unknown as GalleryImage[];
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
    const typedDoc = doc as unknown as { _id: mongoose.Types.ObjectId } & Omit<GalleryImage, "id">;
    return {
      ...typedDoc,
      id: typedDoc._id.toString(),
    } as GalleryImage;
  }

  async getGalleryVideos(): Promise<GalleryVideo[]> {
    const docs = await GalleryVideoModel.find().sort({ uploadedAt: -1 }).lean().exec();
    const typed = docs as unknown as ({ _id: mongoose.Types.ObjectId } & Omit<GalleryVideo, "id">)[];
    return typed.map((doc) => ({ ...doc, id: doc._id.toString() })) as unknown as GalleryVideo[];
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
    const typedDoc = doc as unknown as { _id: mongoose.Types.ObjectId } & Omit<GalleryVideo, "id">;
    return {
      ...typedDoc,
      id: typedDoc._id.toString(),
    } as GalleryVideo;
  }

  async getHeroVideo(): Promise<HeroVideo | null> {
    const doc = await HeroVideoModel.findOne().sort({ uploadedAt: -1 }).lean().exec();
    if (!doc) return null;
    const typedDoc: any = doc;
    return {
      ...typedDoc,
      id: typedDoc._id.toString(),
    } as HeroVideo;
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
    const typedDoc = doc as unknown as { _id: mongoose.Types.ObjectId } & Omit<HeroVideo, "id">;
    return {
      ...typedDoc,
      id: typedDoc._id.toString(),
    } as HeroVideo;
  }

  async getFacultySection(): Promise<FacultySection | null> {
    const doc = await FacultySectionModel.findOne().lean().exec();
    if (!doc) return null;
    const typedDoc = doc as any;
    return { ...typedDoc, id: typedDoc._id.toString() } as FacultySection;
  }

  async createOrUpdateFacultySection(data: FacultySectionInput): Promise<FacultySection> {
    const doc = await FacultySectionModel.findOneAndUpdate(
      {},
      data,
      { new: true, upsert: true }
    ).lean().exec();

    if (!doc) {
      throw new Error("Failed to create or update faculty section");
    }

    return { ...doc, id: (doc as any)._id.toString() } as unknown as FacultySection;
  }


  async deleteFacultySection(): Promise<FacultySection | null> {
    const doc = await FacultySectionModel.findOneAndDelete().lean().exec();
    if (!doc) return null;
    const typedDoc = doc as any;
    return { ...typedDoc, id: typedDoc._id.toString() } as unknown as FacultySection;
  }

  async getStudentMedia(filter: Partial<Pick<StudentMedia, "batch" | "type" | "year">> = {}): Promise<StudentMedia[]> {
    const raw = await StudentMediaModel.find(filter)
      .sort({ year: -1 })
      .lean()
      .exec();

    const docs = raw as unknown as LeanStudentMedia[];

    return docs.map((d) => ({
      id: d._id.toString(),
      mediaId: d.mediaId,
      url: d.url,
      type: d.type,
      batch: d.batch,
      year: d.year,
      description: d.description,
    }));
  }


  async createStudentMedia(entry: Omit<StudentMedia, "id">): Promise<StudentMedia> {
    // Validate using Zod schema from schema.ts
    const parsed = StudentMediaZodSchema.parse(entry);

    const doc = await StudentMediaModel.create(parsed);
    const obj = doc.toObject() as LeanStudentMedia;

    return {
      id: obj._id.toString(),
      mediaId: obj.mediaId,
      url: obj.url,
      type: obj.type,
      batch: obj.batch,
      year: obj.year,
      description: obj.description,
    };
  }

  async deleteStudentMedia(id: string): Promise<StudentMedia | null> {
    const doc = await StudentMediaModel.findByIdAndDelete(id)
      .lean()
      .exec();

    const typedDoc = doc as LeanStudentMedia | null;

    return typedDoc
      ? {
        id: typedDoc._id.toString(),
        mediaId: typedDoc.mediaId,
        url: typedDoc.url,
        type: typedDoc.type,
        batch: typedDoc.batch,
        year: typedDoc.year,
        description: typedDoc.description,
      }
      : null;
  }

  async getTeachers(): Promise<Teacher[]> {
    const docs = await TeacherModel.find().sort({ name: 1 }).lean().exec();
    const typed = docs as unknown as ({ _id: mongoose.Types.ObjectId } & Omit<Teacher, "id">)[];
    return typed.map((doc) => ({ ...doc, id: doc._id.toString() })) as unknown as Teacher[];
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const doc = await TeacherModel.create(insertTeacher);
    const plainDoc = doc.toObject() as {
      _id: mongoose.Types.ObjectId;
      name: string;
      subject: string;
      bio: string;
      mediaId: string;
      imageUrl: string;
    };
    return {
      id: plainDoc._id.toString(),
      name: plainDoc.name,
      subject: plainDoc.subject,
      bio: plainDoc.bio,
      mediaId: plainDoc.mediaId,
      imageUrl: plainDoc.imageUrl,
    } as Teacher;
  }

  async deleteTeacher(id: string): Promise<Teacher | null> {
    const doc = await TeacherModel.findByIdAndDelete(id).lean().exec();
    if (!doc) return null;
    const typedDoc = doc as unknown as { _id: mongoose.Types.ObjectId } & Omit<Teacher, "id">;
    return {
      ...typedDoc,
      id: typedDoc._id.toString(),
    } as Teacher;
  }
  async getAcademicResultByYear(year: number): Promise<AcademicResultDocument | null> {
    const doc = await AcademicResultModelInstance.findOne({ year }).lean().exec();
    if (!doc) return null;

    return {
      ...doc,
      id: doc._id.toString(),
      lastUpdated: new Date(doc.lastUpdated),
    } as unknown as AcademicResultDocument;
  }

  /** Get list of all years that have published results (for dropdown) */
  async getAllAcademicYears(): Promise<number[]> {
    const docs = await AcademicResultModelInstance.find({}, { year: 1 }).sort({ year: -1 }).lean().exec();
    return docs.map(d => d.year);
  }

  /** Create new year result OR update existing one (upsert) */
  async createOrUpdateAcademicResult(data: InsertOrUpdateAcademicResult): Promise<AcademicResultDocument> {
    const result = await AcademicResultModelInstance.findOneAndUpdate(
      { year: data.year },
      { ...data, lastUpdated: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean().exec();

    return {
      ...result,
      id: result._id.toString(),
      lastUpdated: new Date(result.lastUpdated),
    } as unknown as AcademicResultDocument;
  }

  /** Delete an entire year's result */
  async deleteAcademicResult(year: number): Promise<AcademicResultDocument | null> {
    const doc = await AcademicResultModelInstance.findOneAndDelete({ year }).lean().exec();
    if (!doc) return null;

    return {
      ...doc,
      id: doc._id.toString(),
    } as unknown as AcademicResultDocument;
  }

}


export const storage = new MongoStorage();
