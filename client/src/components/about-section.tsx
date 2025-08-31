import { useQuery } from "@tanstack/react-query";
import { Eye, Zap, Heart } from "lucide-react";
import type { Section } from "@shared/schema";

type ClientSection = {
  name: string;
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  images?: string[];
  stats?: { label: string; value: string; description?: string }[];
  profiles?: { name: string; role: string; description: string; image?: string }[];
};

export default function AboutSection({ section: propSection }: { section?: ClientSection }) {
  const { data: fetchedSection, isLoading } = useQuery<Section>({
    queryKey: ["/api/sections/about"],
    queryFn: async () => {
      const res = await fetch("/api/sections?name=about");
      if (!res.ok) throw new Error("Failed to fetch about section");
      const sections = await res.json();
      return sections[0]; // Assuming unique name
    },
    enabled: !propSection, // Only fetch if no prop is provided
  });

  const section: ClientSection = propSection || {
    name: fetchedSection?.name || "about",
    title: fetchedSection?.title || "",
    subtitle: fetchedSection?.subtitle || "",
    paragraphs: fetchedSection?.paragraphs || [],
    images: fetchedSection?.images || [],
    stats: fetchedSection?.stats || [],
    profiles: fetchedSection?.profiles || [],
  };

  if (isLoading && !propSection) return <div>Loading...</div>;

  const fallbackImages = [
    "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
  ];

  const images = section.images && section.images.length > 0 
    ? section.images.map(img => img.includes("http") ? img : `${process.env.IMAGE_URL_PREFIX}/${img}`) // Check if URL or GridFS
    : fallbackImages;

  const paragraphs = section.paragraphs && section.paragraphs.length > 0 ? section.paragraphs : [
    "Established in 1946, Navamukunda Higher Secondary School Thirunavaya has been a beacon of educational excellence in the rural landscape of Malappuram district, Kerala. For over seven decades, we have been committed to nurturing young minds and shaping the leaders of tomorrow.",
    "As a privately aided co-educational institution, we serve students from grades 5 to 12, providing quality education in Malayalam medium. Our school is strategically located in the TIRUR block, easily accessible by all-weather roads.",
  ];

  const stats = section.stats && section.stats.length > 0 ? section.stats : [
    { label: "Classrooms", value: "30", description: "Well-equipped learning spaces" },
    { label: "Library Books", value: "2.5K", description: "Extensive collection of resources" },
    { label: "Computers", value: "25", description: "Modern computer laboratory" },
    { label: "Restrooms", value: "40", description: "Separate facilities for all" },
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            data-aos="fade-up"
            data-testid="about-title"
          >
            {section.title || "About Our School"}
          </h2>
          <p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="200"
            data-testid="about-subtitle"
          >
            {section.subtitle || "Building futures through quality education and holistic development since 1946"}
          </p>
        </div>

        {/* Hero Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6" data-aos="fade-right">
            <h3 className="text-3xl font-bold text-foreground" data-testid="heritage-title">
              Our Heritage
            </h3>
            {paragraphs.map((para, index) => (
              <p
                key={index}
                className="text-lg text-muted-foreground leading-relaxed"
                data-testid={`heritage-description-${index + 1}`}
              >
                {para}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4" data-aos="fade-left">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`School image ${index + 1}`}
                className={`rounded-xl shadow-lg hover-lift ${index === 1 ? "mt-8" : ""}`}
                data-testid={index === 0 ? "school-building-image" : "students-corridor-image"}
              />
            ))}
          </div>
        </div>

        {/* Vision, Mission, Values */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div
            className="bg-card p-8 rounded-xl shadow-lg border border-border hover-lift enhanced-card"
            data-aos="fade-up"
            data-aos-delay="100"
            data-testid="vision-card"
          >
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-6">
              <Eye className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Our Vision</h3>
            <p className="text-muted-foreground">
              To be a center of educational excellence that empowers students with knowledge, values, and skills to become responsible global citizens and leaders of tomorrow.
            </p>
          </div>
          <div
            className="bg-card p-8 rounded-xl shadow-lg border border-border hover-lift enhanced-card"
            data-aos="fade-up"
            data-aos-delay="200"
            data-testid="mission-card"
          >
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Our Mission</h3>
            <p className="text-muted-foreground">
              To provide quality education that nurtures intellectual curiosity, promotes cultural values, and develops character while ensuring holistic development of every student.
            </p>
          </div>
          <div
            className="bg-card p-8 rounded-xl shadow-lg border border-border hover-lift enhanced-card"
            data-aos="fade-up"
            data-aos-delay="300"
            data-testid="values-card"
          >
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-6">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Our Values</h3>
            <p className="text-muted-foreground">
              Integrity, excellence, inclusivity, and innovation guide our educational approach, fostering an environment where every student can thrive and reach their full potential.
            </p>
          </div>
        </div>

        {/* Facilities Overview */}
        <div className="bg-muted p-8 md:p-12 rounded-2xl" data-aos="zoom-in" data-testid="facilities-section">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center">School Facilities</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center" data-testid={`facility-${stat.label.toLowerCase()}`}>
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    index % 2 === 0 ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <span className="text-2xl font-bold text-primary-foreground">{stat.value}</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2">{stat.label}</h4>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}