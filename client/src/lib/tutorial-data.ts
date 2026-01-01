// Tutorial data structure for admin dashboard
export interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  videoPath: string; // Path to video in attached_assets
}

export interface TutorialSection {
  id: string;
  name: string;
  icon: string;
  description: string;
  videos: TutorialVideo[];
}

export const TUTORIAL_SECTIONS: TutorialSection[] = [
  {
    id: "hero-video",
    name: "Hero Section Video",
    icon: "Film",
    description: "Learn how to manage the hero/banner video on the homepage",
    videos: [
      {
        id: "hero-upload",
        title: "How to Upload a Video",
        description: "Step-by-step guide to uploading a new hero video",
        videoPath: "/attached_assets/tutorials/hero-upload.mp4",
      },
      {
        id: "hero-delete",
        title: "How to Delete a Video",
        description: "Learn how to delete the current hero video",
        videoPath: "/attached_assets/tutorials/hero-delete.mp4",
      },
      {
        id: "hero-replace",
        title: "How to Replace a Video",
        description: "Replace your current hero video with a new one",
        videoPath: "/attached_assets/tutorials/hero-replace.mp4",
      },
    ],
  },
  {
    id: "news-management",
    name: "News Management",
    icon: "Newspaper",
    description: "Manage news and articles on your school website",
    videos: [
      {
        id: "news-create",
        title: "How to Create a News Article",
        description: "Create and publish a new news article",
        videoPath: "/attached_assets/tutorials/news-create.mp4",
      },
      {
        id: "news-edit",
        title: "How to Edit a News Article",
        description: "Edit existing news articles and update content",
        videoPath: "/attached_assets/tutorials/news-edit.mp4",
      },
      {
        id: "news-delete",
        title: "How to Delete a News Article",
        description: "Remove news articles from your website",
        videoPath: "/attached_assets/tutorials/news-delete.mp4",
      },
      {
        id: "news-publish",
        title: "Publishing and Scheduling",
        description: "Learn about publishing options and scheduling posts",
        videoPath: "/attached_assets/tutorials/news-publish.mp4",
      },
    ],
  },
  {
    id: "faculty-management",
    name: "Faculty Management",
    icon: "Users",
    description: "Manage faculty members and staff information",
    videos: [
      {
        id: "faculty-add",
        title: "How to Add a Faculty Member",
        description: "Add new faculty members to your school database",
        videoPath: "/attached_assets/tutorials/faculty-add.mp4",
      },
      {
        id: "faculty-edit",
        title: "How to Edit Faculty Information",
        description: "Update faculty details and qualifications",
        videoPath: "/attached_assets/tutorials/faculty-edit.mp4",
      },
      {
        id: "faculty-upload-photo",
        title: "How to Upload Faculty Photos",
        description: "Add and manage faculty profile photos",
        videoPath: "/attached_assets/tutorials/faculty-upload-photo.mp4",
      },
      {
        id: "faculty-delete",
        title: "How to Remove Faculty",
        description: "Remove faculty members from the system",
        videoPath: "/attached_assets/tutorials/faculty-delete.mp4",
      },
    ],
  },
  {
    id: "events-management",
    name: "Events Management",
    icon: "Calendar",
    description: "Create and manage school events",
    videos: [
      {
        id: "events-create",
        title: "How to Create an Event",
        description: "Create a new school event with dates and details",
        videoPath: "/attached_assets/tutorials/events-create.mp4",
      },
      {
        id: "events-edit",
        title: "How to Edit Events",
        description: "Modify event details and information",
        videoPath: "/attached_assets/tutorials/events-edit.mp4",
      },
      {
        id: "events-upload-media",
        title: "How to Upload Event Media",
        description: "Add photos and videos to event listings",
        videoPath: "/attached_assets/tutorials/events-upload-media.mp4",
      },
      {
        id: "events-delete",
        title: "How to Delete Events",
        description: "Remove past or cancelled events",
        videoPath: "/attached_assets/tutorials/events-delete.mp4",
      },
    ],
  },
  {
    id: "gallery-management",
    name: "Gallery Management",
    icon: "ImageIcon",
    description: "Manage photo galleries and albums",
    videos: [
      {
        id: "gallery-create",
        title: "How to Create a Photo Gallery",
        description: "Create new photo albums and galleries",
        videoPath: "/attached_assets/tutorials/gallery-create.mp4",
      },
      {
        id: "gallery-upload",
        title: "How to Upload Photos",
        description: "Upload and organize photos in galleries",
        videoPath: "/attached_assets/tutorials/gallery-upload.mp4",
      },
      {
        id: "gallery-organize",
        title: "How to Organize Photos",
        description: "Sort, arrange, and manage your photo collections",
        videoPath: "/attached_assets/tutorials/gallery-organize.mp4",
      },
      {
        id: "gallery-delete",
        title: "How to Delete Photos",
        description: "Remove photos and galleries",
        videoPath: "/attached_assets/tutorials/gallery-delete.mp4",
      },
    ],
  },
  {
    id: "academics",
    name: "Academics Management",
    icon: "BookOpen",
    description: "Manage academic information and curriculum",
    videos: [
      {
        id: "academics-add-subject",
        title: "How to Add Subjects",
        description: "Add new subjects to your curriculum",
        videoPath: "/attached_assets/tutorials/academics-add-subject.mp4",
      },
      {
        id: "academics-edit",
        title: "How to Edit Academic Information",
        description: "Update curriculum and academic details",
        videoPath: "/attached_assets/tutorials/academics-edit.mp4",
      },
      {
        id: "academics-manage-classes",
        title: "How to Manage Classes",
        description: "Add, edit, or remove classes from the system",
        videoPath: "/attached_assets/tutorials/academics-manage-classes.mp4",
      },
    ],
  },
  {
    id: "student-management",
    name: "Student Management",
    icon: "GraduationCap",
    description: "Manage student information and records",
    videos: [
      {
        id: "students-add",
        title: "How to Add Students",
        description: "Register new students in the system",
        videoPath: "/attached_assets/tutorials/students-add.mp4",
      },
      {
        id: "students-edit",
        title: "How to Edit Student Information",
        description: "Update student details and records",
        videoPath: "/attached_assets/tutorials/students-edit.mp4",
      },
      {
        id: "students-bulk-upload",
        title: "How to Bulk Upload Students",
        description: "Import multiple students using CSV files",
        videoPath: "/attached_assets/tutorials/students-bulk-upload.mp4",
      },
    ],
  },
  {
    id: "sports-achievements",
    name: "Sports & Achievements",
    icon: "Trophy",
    description: "Manage sports achievements and records",
    videos: [
      {
        id: "sports-add-achievement",
        title: "How to Add Sports Achievement",
        description: "Record new sports achievements and awards",
        videoPath: "/attached_assets/tutorials/sports-add-achievement.mp4",
      },
      {
        id: "sports-edit",
        title: "How to Edit Achievements",
        description: "Update sports achievement information",
        videoPath: "/attached_assets/tutorials/sports-edit.mp4",
      },
      {
        id: "sports-upload-media",
        title: "How to Upload Achievement Media",
        description: "Add photos and certificates to achievements",
        videoPath: "/attached_assets/tutorials/sports-upload-media.mp4",
      },
    ],
  },
  {
    id: "dashboard-overview",
    name: "Dashboard Overview",
    icon: "LayoutGrid",
    description: "Understand the admin dashboard interface",
    videos: [
      {
        id: "dashboard-intro",
        title: "Dashboard Introduction",
        description: "Overview of the admin dashboard layout and features",
        videoPath: "/attached_assets/tutorials/dashboard-intro.mp4",
      },
      {
        id: "dashboard-navigation",
        title: "How to Navigate",
        description: "Learn how to navigate through different sections",
        videoPath: "/attached_assets/tutorials/dashboard-navigation.mp4",
      },
      {
        id: "dashboard-settings",
        title: "Dashboard Settings",
        description: "Customize your dashboard preferences",
        videoPath: "/attached_assets/tutorials/dashboard-settings.mp4",
      },
    ],
  },
];
