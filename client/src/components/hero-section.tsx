import { useQuery } from "@tanstack/react-query";
import { ArrowDown } from "lucide-react";
import type { Section } from "@shared/schema";

export default function HeroSection() {
  const { data: section, isLoading } = useQuery<Section>({
    queryKey: ["/api/sections/hero"],
    queryFn: async () => {
      const res = await fetch("/api/sections?name=hero");
      if (!res.ok) throw new Error("Failed to fetch hero section");
      const sections = await res.json();
      return sections[0];
    },
  });

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, sectionId: string) => {
    e.preventDefault();
    const target = document.querySelector(sectionId);
    if (target) {
      const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  const fallbackImage = "https://images.unsplash.com/photo-1497864149931-3e41b53db656?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080";

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center bg-background">
      <div
        className="absolute inset-0 hero-parallax bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${section?.images?.[0] || fallbackImage})`,
        }}
      />
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto glass-effect p-8 rounded-lg">
        <h1
          className="responsive-heading font-bold text-foreground mb-6 drop-shadow-lg fade-in"
          data-aos="fade-up"
          data-aos-delay="200"
          data-testid="hero-title"
        >
          {section?.title || "Navamukunda HSS, Thirunavaya"}
        </h1>
        <p
          className="responsive-subheading text-muted-foreground mb-4 slide-in-left"
          data-aos="fade-up"
          data-aos-delay="400"
          data-testid="hero-subtitle"
        >
          {section?.subtitle || "Thirunavaya"}
        </p>
        <p
          className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto slide-in-right"
          data-aos="fade-up"
          data-aos-delay="600"
          data-testid="hero-description"
        >
          {section?.paragraphs?.[0] ||
            "Excellence in Education Since 1946 • Grades 5-12 • Malayalam Medium • Co-Educational"}
        </p>
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          data-aos="fade-up"
          data-aos-delay="800"
        >
          <a
            href="#about"
            onClick={(e) => handleScroll(e, "#about")}
            className="gradient-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-all button-scale"
            data-testid="hero-cta-primary"
          >
            Discover Our Legacy
          </a>
          <a
            href="#contact"
            onClick={(e) => handleScroll(e, "#contact")}
            className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background px-8 py-3 rounded-lg font-semibold transition-all button-scale"
            data-testid="hero-cta-secondary"
          >
            Get in Touch
          </a>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <button
          onClick={(e) => handleScroll(e, "#about")}
          className="text-foreground hover:text-primary transition-colors button-scale"
          data-testid="scroll-indicator"
        >
          <div className="w-8 h-12 border-2 border-foreground rounded-full flex justify-center glass-effect">
            <ArrowDown className="w-5 h-5 mt-2 animate-bounce text-foreground" />
          </div>
        </button>
      </div>
    </section>
  );
}