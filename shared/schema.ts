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

// ---------------- EVENT MANAGEMENT ----------------

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
  _id: { type: Schema.Types.ObjectId, auto: true },
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
  date: z.preprocess((val) => new Date(val as string), z.date()), // 👈 auto converts string → Date
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
  expiresAt?: Date | null; // ✅ frontend expiry
}

export interface News extends Document {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: Date;
  expiresAt?: Date | null; // ✅ optional expiry
}

export const newsSchema = new Schema<News>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: false }, // ✅ optional expiry
}, { timestamps: false });

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


// ---------------- SECTIONS  MANAGEMENT ----------------
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

export const SectionSchema = new Schema({
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

// Replace the Media interface and schema in schema.ts
export interface Media extends Document {
  id: string;
  filename: string;
  contentType: string;
  type: "image" | "video" | "audio"; // Add "audio" to enum
  uploadedAt: Date;
  dbName: string;
}

const mediaSchema = new Schema<Media>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  type: { type: String, enum: ["image", "video", "audio"], required: true }, // Add "audio" to enum
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
  _id: { type: Schema.Types.ObjectId, auto: true },
  uri: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const MediaDatabaseModel = mongoose.model<MediaDatabase>(
  "MediaDatabase", mediaDatabaseSchema
);


// ---------------- GALLERY IMAGES & VIDEOS ----------------
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
  _id: { type: Schema.Types.ObjectId, auto: true },
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


// ✅ keep your existing Zod schema for validation
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

// Zod validation schema for StudentMedia input
export const StudentMediaZodSchema = z.object({
  mediaId: z.string().min(1),                 // Non-empty string
  url: z.string().min(1),                   // Non-empty string
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

// Mongoose model export
export const StudentMediaModel =
  mongoose.models.StudentMedia ||
  mongoose.model<StudentMediaDoc>("StudentMedia", studentMediaSchema);

// ---------------- TEACHER MANAGEMENT ----------------

// Frontend-specific type (plain object without Mongoose Document properties)
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
  _id: { type: Schema.Types.ObjectId, auto: true },
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
// Add to export models & types section
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export const TeacherModel = mongoose.model<Teacher>("Teacher", teacherSchema);
// ---------------- EXPORT MODELS & TYPES ----------------

export type FacultySectionInput = z.infer<typeof FacultySectionSchema>;
export const FacultySectionModel = mongoose.model<FacultySection>("FacultySection", facultySectionSchema);
export const SectionModel = mongoose.model("Section", SectionSchema);
export const GalleryImageModel = mongoose.model<GalleryImage>("GalleryImage", galleryImageSchema);
export const GalleryVideoModel = mongoose.model<GalleryVideo>("GalleryVideo", galleryVideoSchema);
export const HeroVideoModel = mongoose.model<HeroVideo>("HeroVideo", heroVideoSchema);
export const MediaModel = mongoose.model<Media>("Media", mediaSchema);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type InsertSection = z.infer<typeof insertSectionSchema>;
