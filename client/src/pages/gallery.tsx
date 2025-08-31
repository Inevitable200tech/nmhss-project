import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, X, Calendar } from "lucide-react";
import Navigation from "../components/navigation";
import Footer from "../components/footer";
import type { Section } from "@shared/schema";

export default function GalleryPage() {
  // Move hooks to the top level to ensure consistent rendering
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { data: section, isLoading } = useQuery<Section>({
    queryKey: ["/api/sections/gallery"],
    queryFn: async () => {
      const res = await fetch("/api/sections?name=gallery");
      if (!res.ok) throw new Error("Failed to fetch gallery section");
      const sections = await res.json();
      return sections[0];
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex]);

  // Early return after all hooks are defined
  if (isLoading) return <div>Loading...</div>;

  const fallbackImages = [
    "https://images.unsplash.com/photo-1497864149931-3e41b53db656?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1570545880377-36ab74c3fb03?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1577896851231-70ef188820f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1570545880377-36ab74c3fb03?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  ];

  const images = section?.images && section.images.length > 0 ? section.images : fallbackImages;

  const fallbackTimeline = [
    { value: "1946", label: "School Founded", description: "Established in Thirunavaya as a beacon of education." },
    { value: "1970", label: "First Expansion", description: "Added higher secondary classes." },
    { value: "2000", label: "Modern Facilities", description: "Introduced computer laboratory and library expansion." },
    { value: "2010", label: "Academic Excellence Award", description: "Received state-level recognition for outstanding performance." },
    { value: "2020", label: "Digital Transformation", description: "Implemented online learning during the pandemic." },
  ];

  const timelineItems = section?.stats && section.stats.length > 0 ? section.stats : fallbackTimeline;

  const showImage = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const showNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const showPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  return (
    <>
      <Navigation />
      <section id="gallery" className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold text-foreground mb-4"
              data-aos="fade-up"
              data-testid="gallery-title"
            >
              {section?.title || "Photo Gallery & Timeline"}
            </h2>
            <p
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              data-aos="fade-up"
              data-aos-delay="200"
              data-testid="gallery-subtitle"
            >
              {section?.subtitle || "Explore our school's history through timeline and captured moments"}
            </p>
          </div>

          {/* Timeline Section */}
          <div className="mb-20">
            <h3 className="text-3xl font-bold text-foreground mb-8 text-center">School Timeline</h3>
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-primary"></div>
              {timelineItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"} mb-8 items-center justify-between`}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className={`w-5/12 ${index % 2 === 0 ? "text-right pr-8" : "text-left pl-8"}`}>
                    <h4 className="text-xl font-semibold text-foreground">{item.label}</h4>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="w-2/12 flex justify-center">
                    <div className="bg-background border-2 border-primary rounded-full p-2 z-10">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className={`w-5/12 ${index % 2 === 0 ? "pl-8" : "pr-8 text-right"}`}>
                    <span className="font-bold text-primary">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-xl shadow-lg hover-lift group cursor-pointer"
                onClick={() => showImage(index)}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                data-testid={`gallery-image-${index}`}
              >
                <img
                  src={img}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-center justify-center">
                  <p className="text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    View
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full p-4" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={closeLightbox}
            >
              <X className="w-8 h-8" />
            </button>
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50"
              onClick={showPrev}
              disabled={selectedIndex === 0}
            >
              <ArrowLeft className="w-12 h-12" />
            </button>
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50"
              onClick={showNext}
              disabled={selectedIndex === images.length - 1}
            >
              <ArrowRight className="w-12 h-12" />
            </button>
            <img
              src={images[selectedIndex]}
              alt={`Enlarged image ${selectedIndex + 1}`}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}