import { useQuery } from "@tanstack/react-query";
import { BookOpen, Globe, Calculator, FlaskConical, Users, Monitor } from "lucide-react";
import type { Section } from "@shared/schema";

export default function FacultySection() {
  const { data: section, isLoading } = useQuery<Section>({
    queryKey: ["/api/sections/faculty"],
    queryFn: async () => {
      const res = await fetch("/api/sections?name=faculty");
      if (!res.ok) throw new Error("Failed to fetch faculty section");
      const sections = await res.json();
      return sections[0];
    },
  });

  if (isLoading) return <div>Loading...</div>;

  const fallbackImages = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    "https://images.unsplash.com/photo-1594824804584-dd32c48a0e5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
  ];

  const fallbackStats = [
    { label: "Qualified Teachers", value: "25+", description: "Experienced and certified educators" },
    { label: "Years Average Experience", value: "15+", description: "Seasoned professionals in education" },
    { label: "Departments", value: "10+", description: "Specialized subject expertise" },
  ];

  const fallbackProfiles = [
    {
      name: "Mrs. Leadership Principal",
      role: "Principal",
      description: "M.A., B.Ed., 25 years experience. 'Leading with vision to create an environment where every student can discover their potential and achieve excellence.'",
      image: fallbackImages[0],
    },
    {
      name: "Mr. Leadership Vice",
      role: "Vice Principal",
      description: "M.Sc., B.Ed., 20 years experience. 'Dedicated to fostering academic excellence and character development through innovative teaching methodologies.'",
      image: fallbackImages[1],
    },
    {
      name: "Mrs. Leadership Academic",
      role: "Head of Academics",
      description: "M.A., M.Ed., 18 years experience. 'Committed to curriculum excellence and ensuring every student receives quality education that prepares them for the future.'",
      image: fallbackImages[2],
    },
  ];

  const stats = section?.stats && section.stats.length > 0 ? section.stats : fallbackStats;
  const profiles = section?.profiles && section.profiles.length > 0 ? section.profiles : fallbackProfiles;

  return (
    <section id="faculty" className="py-20 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            data-aos="fade-up"
            data-testid="faculty-title"
          >
            {section?.title || "Our Dedicated Faculty"}
          </h2>
          <p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="200"
            data-testid="faculty-subtitle"
          >
            {section?.subtitle || "Experienced educators committed to nurturing young minds and fostering academic excellence"}
          </p>
        </div>

        {/* Faculty Statistics */}
        <div className="grid md:grid-cols-3 gap-8 mb-16" data-aos="fade-up">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-background p-8 rounded-xl shadow-lg border border-border text-center hover-lift"
              data-testid={stat.label.toLowerCase().replace(/\s/g, "-")}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  index === 0 ? "bg-primary" : index === 1 ? "bg-secondary" : "bg-accent"
                }`}
              >
                <span className="text-2xl font-bold text-primary-foreground">{stat.value}</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{stat.label}</h3>
              <p className="text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* Department Structure */}
        <div className="mb-16">
          <h3
            className="text-3xl font-bold text-foreground mb-8 text-center"
            data-testid="departments-title"
          >
            Academic Departments
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              className="bg-background p-6 rounded-xl shadow-lg border border-border hover-lift"
              data-aos="zoom-in"
              data-aos-delay="100"
              data-testid="malayalam-dept"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Malayalam Department</h4>
              <p className="text-sm text-muted-foreground">Literature, grammar, and cultural studies</p>
            </div>
            <div
              className="bg-background p-6 rounded-xl shadow-lg border border-border hover-lift"
              data-aos="zoom-in"
              data-aos-delay="200"
              data-testid="english-dept"
            >
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">English Department</h4>
              <p className="text-sm text-muted-foreground">Language skills and global communication</p>
            </div>
            <div
              className="bg-background p-6 rounded-xl shadow-lg border border-border hover-lift"
              data-aos="zoom-in"
              data-aos-delay="300"
              data-testid="math-dept"
            >
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Mathematics Department</h4>
              <p className="text-sm text-muted-foreground">Analytical thinking and problem solving</p>
            </div>
            <div
              className="bg-background p-6 rounded-xl shadow-lg border border-border hover-lift"
              data-testid="science-dept"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <FlaskConical className="w-6 h-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Science Department</h4>
              <p className="text-sm text-muted-foreground">Physics, Chemistry, Biology labs</p>
            </div>
            <div
              className="bg-background p-6 rounded-xl shadow-lg border border-border hover-lift"
              data-testid="social-dept"
            >
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Social Science</h4>
              <p className="text-sm text-muted-foreground">History, Geography, Political Science</p>
            </div>
            <div
              className="bg-background p-6 rounded-xl shadow-lg border border-border hover-lift"
              data-testid="computer-dept"
            >
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Computer Science</h4>
              <p className="text-sm text-muted-foreground">Programming, digital literacy, technology</p>
            </div>
          </div>
        </div>

        {/* Featured Faculty */}
        <div className="bg-muted p-8 md:p-12 rounded-2xl" data-testid="leadership-section">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center">Meet Our Leadership</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {profiles.map((profile, index) => (
              <div
                key={index}
                className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift"
                data-testid={
                  index === 0 ? "principal-profile" : index === 1 ? "vice-principal-profile" : "academic-head-profile"
                }
              >
                <img
                  src={profile.image || fallbackImages[index % fallbackImages.length]}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h4 className="text-xl font-semibold text-foreground mb-2">{profile.name}</h4>
                <p className="text-secondary font-medium mb-2">{profile.role}</p>
                <p className="text-sm text-muted-foreground">{profile.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}