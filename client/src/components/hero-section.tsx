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

  const handleScroll = (sectionId: string) => {
    const target = document.querySelector(sectionId);
    if (target) {
      const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  const fallbackImage = "https://images.unsplash.com/photo-1497864149931-3e41b53db656?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080";

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center">
      <div
        className="absolute inset-0 hero-parallax bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${section?.images?.[0] || fallbackImage})`,
        }}
      />
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1
          className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-lg"
          data-aos="fade-up"
          data-aos-delay="200"
          data-testid="hero-title"
        >
          {section?.title || "Navamukunda HSS"}
        </h1>
        <p
          className="text-xl md:text-2xl mb-4"
          data-aos="fade-up"
          data-aos-delay="400"
          data-testid="hero-subtitle"
        >
          {section?.subtitle || "Thirunavaya"}
        </p>
        <p
          className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
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
            onClick={(e) => {
              e.preventDefault();
              handleScroll("#about");
            }}
            className="gradient-primary text-white px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105 pulse-primary"
            data-testid="hero-cta-primary"
          >
            Discover Our Legacy
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              handleScroll("#contact");
            }}
            className="border-2 border-white text-white hover:bg-white hover:text-foreground px-8 py-3 rounded-lg font-semibold transition-all"
            data-testid="hero-cta-secondary"
          >
            Get in Touch
          </a>
        </div>
      </div>
      <button
        onClick={() => handleScroll("#about")}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white hover:text-primary transition-colors float"
        data-testid="scroll-indicator"
      >
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center glass-effect">
          <ArrowDown className="w-4 h-4 mt-2 animate-bounce" />
        </div>
      </button>
    </section>
  );
}