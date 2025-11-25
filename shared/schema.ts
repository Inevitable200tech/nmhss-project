import { z } from "zod";
import mongoose, { Schema, Document } from "mongoose";

//-----------CONTACT-US-MODEL----------------------
export const insertContactMessageSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string(),
  message: z.string(),
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

// ---------------- EVENT MANAGEMENT ----------------

// Frontend-specific types
export interface ClientEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  category: string;
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

export const eventSchema = new Schema<Event>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

export const insertEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.preprocess((val) => new Date(val as string), z.date()),
  time: z.string(),
  category: z.string(),
});


// ---------------- NEWS MANAGEMENT ----------------

export interface ClientNews {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: Date;
  expiresAt?: Date | null;
}

export interface News extends Document {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: Date;
  expiresAt?: Date | null;
}

export const newsSchema = new Schema<News>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: false },
}, { timestamps: false });

export const insertNewsSchema = z.object({
  title: z.string(),
  content: z.string(),
  type: z.enum(["announcement", "news", "update"]),
  expiresAt: z.preprocess(
    (val) => {
      if (!val || val === "") return null;
      return new Date(val as string);
    },
    z.date().nullable()
  ).optional(),
});


// ---------------- SECTIONS MANAGEMENT ----------------

export interface Section extends Document {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  images?: {
    mediaId?: string;
    url: string;
    mode: "upload" | "url";
  }[];
  audios?: {
    mediaId?: string;
    url: string;
    mode: "upload" | "url";
  }[];
  stats?: { label: string; value: string; description: string }[];
}

// Added <Section> generic for type safety
export const SectionSchema = new Schema<Section>({
  name: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  paragraphs: [String],
  images: [
    {
      mediaId: { type: String },
      url: { type: String, required: true },
      mode: { type: String, enum: ["upload", "url"], required: true },
    },
  ],
  audios: [
    {
      mediaId: { type: String },
      url: { type: String, required: true },
      mode: { type: String, enum: ["upload", "url"], required: true },
    },
  ],
  stats: [
    {
      label: { type: String, required: true },
      value: { type: String, required: true },
      description: { type: String, required: true },
    },
  ],
});

export const insertSectionSchema = z.object({
  name: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  paragraphs: z.array(z.string()).optional(),
  images: z
    .array(
      z.object({
        mediaId: z.string().optional(),
        url: z.string(),
        mode: z.enum(["upload", "url"]),
      })
    )
    .optional(),
  audios: z
    .array(
      z.object({
        mediaId: z.string().optional(),
        url: z.string(),
        mode: z.enum(["upload", "url"]),
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


// ---------------- MEDIA MANAGEMENT ----------------

export interface Media extends Document {
  id: string;
  filename: string;
  contentType: string;
  type: "image" | "video" | "audio";
  uploadedAt: Date;
  dbName: string;
}

const mediaSchema = new Schema<Media>({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  type: { type: String, enum: ["image", "video", "audio"], required: true },
  uploadedAt: { type: Date, default: Date.now },
  dbName: { type: String, required: true },
});

export interface MediaDatabase extends Document {
  _id: mongoose.Types.ObjectId;
  uri: string;
  name: string;
  createdAt: Date;
}

const mediaDatabaseSchema = new Schema<MediaDatabase>({
  uri: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});


// ---------------- GALLERY IMAGES & VIDEOS ----------------

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
  mediaId: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, required: true },
});

export const galleryVideoSchema = new Schema<GalleryVideo>({
  mediaId: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, required: true },
});

// ---------------- HERO VIDEO ----------------

export interface HeroVideo extends Document {
  id: string;
  mediaId: string;
  url: string;
  uploadedAt: Date;
}

export const heroVideoSchema = new Schema<HeroVideo>({
  mediaId: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

// ---------------- FACULTY SECTION ----------------

export interface FacultyStat {
  label: string;
  value: string;
  description: string;
}

export interface FacultyProfile {
  name: string;
  role: string;
  description: string;
  mediaId?: string;
  imageUrl?: string;
}

export interface FacultySection extends Document {
  id: string;
  title: string;
  subtitle: string;
  stats: FacultyStat[];
  profiles: FacultyProfile[];
}

export const facultySectionSchema = new Schema<FacultySection>({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  stats: [
    {
      label: { type: String, required: true },
      value: { type: String, required: true },
      description: { type: String, required: true },
    },
  ],
  profiles: [
    {
      name: { type: String, required: true },
      role: { type: String, required: true },
      description: { type: String, required: true },
      mediaId: { type: String },
      imageUrl: { type: String },
    },
  ],
}, { timestamps: false });


// Zod schema for validation
export const FacultyStatSchema = z.object({
  label: z.string(),
  value: z.string(),
  description: z.string(),
});

export const FacultyProfileSchema = z.object({
  name: z.string(),
  role: z.string(),
  description: z.string(),
  mediaId: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const FacultySectionSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  stats: z.array(FacultyStatSchema).length(3),
  profiles: z.array(FacultyProfileSchema).length(3),
});

// ---------------- STUDENT MEDIA ----------------

export interface StudentMedia {
  id: string;
  mediaId: string;
  url: string;
  type: "image" | "video";
  batch: "+1" | "+2";
  year: number;
  description?: string;
}

// Lean version of a document
export type LeanStudentMedia = Omit<StudentMedia, "id"> & {
  _id: mongoose.Types.ObjectId;
};

// Mongoose document type
export type StudentMediaDoc = Omit<StudentMedia, "id"> & Document;

// Zod validation schema
export const StudentMediaZodSchema = z.object({
  mediaId: z.string().min(1),
  url: z.string().min(1),
  type: z.enum(["image", "video"]),
  batch: z.enum(["+1", "+2"]),
  year: z.number().int().min(1900),
  description: z.string().max(160).optional(),
});

// Mongoose Schema definition
export const studentMediaSchema = new Schema<StudentMediaDoc>(
  {
    mediaId: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    batch: { type: String, enum: ["+1", "+2"], required: true },
    year: { type: Number, required: true },
    description: { type: String, maxlength: 200 },
  },
  { timestamps: false }
);

// Compound index for performance
studentMediaSchema.index({ type: 1, batch: 1, year: 1 });


// ---------------- TEACHER MANAGEMENT ----------------

// Frontend-specific type
export interface ClientTeacher {
  id: string;
  name: string;
  subject: string;
  bio: string;
  mediaId: string;
  imageUrl: string;
}

// Mongoose document type
export interface Teacher extends Document {
  id: string;
  name: string;
  subject: string;
  bio: string;
  mediaId: string;
  imageUrl: string;
}

export const teacherSchema = new Schema<Teacher>({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  bio: { type: String, required: true },
  mediaId: { type: String, required: true },
  imageUrl: { type: String, required: true },
}, { timestamps: false });

export const insertTeacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  bio: z.string().min(1, "Bio is required"),
  mediaId: z.string().min(1, "Media ID is required"),
  imageUrl: z.string().min(1, "Image URL is required"),
});

export const teacherInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  bio: z.string().min(1, "Bio is required"),
});

export type TeacherInput = z.infer<typeof teacherInputSchema>;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

// ---------------- ACADEMIC RESULTS ----------------

export interface AcademicResultDocument extends Document {
  year: number;
  hsTotalAplusStudents: number;
  hsTotalMarkAverage: number;
  hssTotalAveragePercentage: number;
  hssCommerceAverage: number;
  hssScienceBiologyAverage: number;
  hssComputerScienceAverage: number;
  topHSStudents: {
    name: string;
    aPlusCount: number;
    mediaId?: string;
    photoUrl?: string;
  }[];
  topHSSStudents: {
    name: string;
    aPlusCount: number;
    mediaId?: string;
    photoUrl?: string;
    stream: "Commerce" | "Science (Biology)" | "Computer Science";
  }[];
  lastUpdated: Date;
}

export const AcademicResultSchema = new Schema<AcademicResultDocument>({
  year: { type: Number, required: true, unique: true },
  hsTotalAplusStudents: { type: Number, required: true, min: 0 },
  hsTotalMarkAverage: { type: Number, required: true, min: 0, max: 100 },
  hssTotalAveragePercentage: { type: Number, required: true, min: 0, max: 100 },
  hssCommerceAverage: { type: Number, required: true, min: 0, max: 100 },
  hssScienceBiologyAverage: { type: Number, required: true, min: 0, max: 100 },
  hssComputerScienceAverage: { type: Number, required: true, min: 0, max: 100 },
  topHSStudents: [
    {
      name: { type: String, required: true },
      aPlusCount: { type: Number, required: true, min: 1, max: 10 },
      mediaId: { type: String },
      photoUrl: { type: String },
    },
  ],
  topHSSStudents: [
    {
      name: { type: String, required: true },
      aPlusCount: { type: Number, required: true, min: 1, max: 6 },
      mediaId: { type: String },
      photoUrl: { type: String },
      stream: {
        type: String,
        enum: ["Commerce", "Science (Biology)", "Computer Science"],
        required: true,
      },
    },
  ],
  lastUpdated: { type: Date, default: Date.now },
});

// Zod schema — allows empty name during editing, strict on save
export const insertOrUpdateAcademicResultSchema = z.object({
  year: z.number().int().min(2000).max(2100),

  hsTotalAplusStudents: z.number().int().min(0),
  hsTotalMarkAverage: z.number().min(0).max(100),
  hssTotalAveragePercentage: z.number().min(0).max(100),
  hssCommerceAverage: z.number().min(0).max(100),
  hssScienceBiologyAverage: z.number().min(0).max(100),
  hssComputerScienceAverage: z.number().min(0).max(100),

  topHSStudents: z.array(
    z.object({
      name: z.string().min(1, "Name is required").or(z.literal("")), // allow empty while typing
      aPlusCount: z.number().int().min(1).max(10),
      mediaId: z.string().optional(),
      photoUrl: z.string().optional(),
    })
  ),

  topHSSStudents: z.array(
    z.object({
      name: z.string().min(1, "Name is required").or(z.literal("")),
      aPlusCount: z.number().int().min(1).max(6),
      mediaId: z.string().optional(),
      photoUrl: z.string().optional(),
      stream: z.enum(["Commerce", "Science (Biology)", "Computer Science"]),
    })
  ),
});

export type InsertOrUpdateAcademicResult = z.infer<typeof insertOrUpdateAcademicResultSchema>;
// ---------------- EXPORT MODELS & TYPES ----------------

// Types
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type FacultySectionInput = z.infer<typeof FacultySectionSchema>;


// Models (Using singleton pattern for Next.js/Serverless)
export const AcademicResultModel =
  mongoose.models.AcademicResult ||
  mongoose.model<AcademicResultDocument>("AcademicResult", AcademicResultSchema);
export const EventModel = mongoose.models.Event || mongoose.model<Event>("Event", eventSchema);
export const NewsModel = mongoose.models.News || mongoose.model<News>("News", newsSchema);
export const SectionModel = mongoose.models.Section || mongoose.model<Section>("Section", SectionSchema);
export const MediaModel = mongoose.models.Media || mongoose.model<Media>("Media", mediaSchema);
export const MediaDatabaseModel = mongoose.models.MediaDatabase || mongoose.model<MediaDatabase>("MediaDatabase", mediaDatabaseSchema);
export const GalleryImageModel = mongoose.models.GalleryImage || mongoose.model<GalleryImage>("GalleryImage", galleryImageSchema);
export const GalleryVideoModel = mongoose.models.GalleryVideo || mongoose.model<GalleryVideo>("GalleryVideo", galleryVideoSchema);
export const HeroVideoModel = mongoose.models.HeroVideo || mongoose.model<HeroVideo>("HeroVideo", heroVideoSchema);
export const FacultySectionModel = mongoose.models.FacultySection || mongoose.model<FacultySection>("FacultySection", facultySectionSchema);
export const StudentMediaModel = mongoose.models.StudentMedia || mongoose.model<StudentMediaDoc>("StudentMedia", studentMediaSchema);
export const TeacherModel = mongoose.models.Teacher || mongoose.model<Teacher>("Teacher", teacherSchema);