import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, X, Calendar, Loader2 } from "lucide-react";
import Navigation from "../components/navigation";
import Footer from "../components/footer";


const fallbackVideos = [
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
];

const fallbackImages = [
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&h=600",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&h=600",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&h=600",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&h=600",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&h=600",
];

const fallbackTimeline = [
  { value: "1946", label: "School Founded", description: "Established in Thirunavaya as a beacon of education." },
  { value: "1970", label: "First Expansion", description: "Added higher secondary classes." },
  { value: "2000", label: "Modern Facilities", description: "Introduced computer laboratory and library expansion." },
  { value: "2010", label: "Academic Excellence Award", description: "Received state-level recognition for outstanding performance." },
  { value: "2020", label: "Digital Transformation", description: "Implemented online learning during the pandemic." },
];

export default function GalleryPage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mediaType, setMediaType] = useState<"images" | "videos">("images");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/gallery"],
    queryFn: async () => {
      const res = await fetch("/api/gallery");
      if (!res.ok) throw new Error("Failed to fetch gallery data");
      return res.json();
    },
  });

  function LazyVideo({ src, className }: { src: string; className?: string }) {
    const ref = useRef<HTMLVideoElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (!src) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setIsVisible(true);

            // ✅ Add preload hint for high priority
            const link = document.createElement("link");
            link.rel = "preload"
            link.href = src;
            link.crossOrigin = "anonymous";
            link.type = "video/mp4";
            link.fetchPriority = "high";
            link.as = "video";

            document.head.appendChild(link);

            // ✅ Force browser to start loading immediately
            if (ref.current) {
              ref.current.load();
            }

            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (ref.current) observer.observe(ref.current);

      return () => {
        if (ref.current) observer.unobserve(ref.current);
      };
    }, [src]);

    return (
      <video
        ref={ref}
        src={isVisible ? src : undefined}
        className={className}
        muted
        loop
        playsInline
        preload="auto" // ✅ Hint to preload video
      />
    );
  }

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

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">Please Wait...</span>
    </div>
  );

  // Group images and videos by date (DD-MM-YYYY) if database has data
  const groupByDate = (items: { url: string; uploadedAt: Date }[]) => {
    const grouped: { [key: string]: { url: string; uploadedAt: Date }[] } = {};
    items.forEach((item) => {
      const date = new Date(item.uploadedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).split("/").join("-");
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    });
    return Object.entries(grouped).sort(([dateA], [dateB]) => {
      const [dayA, monthA, yearA] = dateA.split("-").map(Number);
      const [dayB, monthB, yearB] = dateB.split("-").map(Number);
      return new Date(yearB, monthB - 1, dayB).getTime() - new Date(yearA, monthA - 1, dayA).getTime();
    });
  };

  // Prepare flat arrays for lightbox navigation
  const images = data?.images?.length > 0 ? data.images : fallbackImages.map((url) => ({ url, uploadedAt: new Date() }));
  const videos = data?.videos?.length > 0 ? data.videos : fallbackVideos.map((url) => ({ url, uploadedAt: new Date() }));
  const timelineItems = data?.stats?.length > 0 ? data.stats : fallbackTimeline;

  const groupedImages = data?.images?.length > 0 ? groupByDate(data.images) : [];
  const groupedVideos = data?.videos?.length > 0 ? groupByDate(data.videos) : [];

  const showMedia = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);
  const showNext = () => {
    if (selectedIndex !== null && selectedIndex < (mediaType === "images" ? images : videos).length - 1) {
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
      <section id="gallery" className="py-20 bg-gray-50 dark:bg-gray-900 mt-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Section Header with Theme Toggle */}
          <div className="mb-16">
            <div className="flex items-center justify-between gap-4">
              <div className="text-center flex-1">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
                  {data?.title || "Photo Gallery & Timeline"}
                </h2>
                <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {data?.subtitle || "Explore our school's history through timeline and captured moments"}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline Section (glassy) */}
          <div className="mb-20">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">School Timeline</h3>
            <div className="relative max-w-4xl mx-auto rounded-2xl p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-xl">
              <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-gradient-to-b from-transparent via-blue-500/60 to-transparent" />
              {timelineItems.map((item: { value: string; label: string; description: string }, index: number) => (
                <div
                  key={index}
                  className={`relative flex ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"} mb-8 items-center justify-between`}
                >
                  <div className={`w-5/12 ${index % 2 === 0 ? "text-right pr-8" : "text-left pl-8"}`}>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{item.label}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                  <div className="w-2/12 flex justify-center">
                    <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full p-2 z-10 shadow">
                      <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className={`w-5/12 ${index % 2 === 0 ? "pl-8" : "pr-8 text-right"}`}>
                    <span className="font-bold text-blue-700 dark:text-blue-400">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media Type Toggle (glassy pills) */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 p-1 shadow">
              <button
                onClick={() => setMediaType("images")}
                className={`px-6 py-2 rounded-full font-medium transition ${mediaType === "images"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-800 dark:text-gray-100 hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
              >
                Images
              </button>
              <button
                onClick={() => setMediaType("videos")}
                className={`px-6 py-2 rounded-full font-medium transition ${mediaType === "videos"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-800 dark:text-gray-100 hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
              >
                Videos
              </button>
            </div>
          </div>

          {/* Media Display (glassy container + cards) */}
          <div className="relative rounded-3xl p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden">
            {/* Ambient blobs */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute w-24 h-24 bg-blue-500/20 rounded-full top-10 left-10 blur-3xl" />
              <div className="absolute w-32 h-32 bg-indigo-500/10 rounded-full bottom-10 right-10 blur-3xl" />
            </div>

            <div className="relative z-10 space-y-8">
              {mediaType === "images" ? (
                groupedImages.length > 0 ? (
                  groupedImages.map(([date, items], index) => (
                    <div key={index} className="relative bg-white/50 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-xl p-4">
                      <div className="absolute -top-3 left-4 text-xs uppercase tracking-wider px-2 py-1 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/10 text-gray-800 dark:text-gray-200">
                        {date}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className="relative overflow-hidden rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/10 shadow hover:shadow-xl transition-transform duration-300 hover:scale-[1.02] group cursor-pointer"
                            onClick={() => showMedia(images.findIndex((img: any) => (typeof img === "string" ? img : img.url) === item.url))}
                          >
                            <img
                              src={item.url}
                              alt={`Media ${idx + 1}`}
                              className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                              loading={idx > 1 ? "lazy" : "eager"} // ✅ only first 2 images eager
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                              <p className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">View</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="relative overflow-hidden rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/10 shadow hover:shadow-xl transition-transform duration-300 hover:scale-[1.02] group cursor-pointer"
                        onClick={() => showMedia(index)}
                      >
                        <img
                          src={typeof item === "string" ? item : item.url}
                          alt={`Media ${index + 1}`}
                          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <p className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">View</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : groupedVideos.length > 0 ? (
                groupedVideos.map(([date, items], index) => (
                  <div key={index} className="relative bg-white/50 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-xl p-4">
                    <div className="absolute -top-3 left-4 text-xs uppercase tracking-wider px-2 py-1 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/10 text-gray-800 dark:text-gray-200">
                      {date}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="relative overflow-hidden rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/10 shadow hover:shadow-xl transition-transform duration-300 hover:scale-[1.02] group cursor-pointer"
                          onClick={() => showMedia(videos.findIndex((vid: any) => (typeof vid === "string" ? vid : vid.url) === item.url))}
                        >
                          <LazyVideo
                            src={item.url}
                            className="w-full h-64 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <p className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">View</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="relative overflow-hidden rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/10 shadow hover:shadow-xl transition-transform duration-300 hover:scale-[1.02] group cursor-pointer"
                      onClick={() => showMedia(index)}
                    >
                      <LazyVideo
                        src={typeof item === "string" ? item : item.url}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <p className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">View</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeLightbox}>
          <div className="relative max-w-4xl max-h-[90vh] w-full p-4" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-10 right-4 text-white hover:text-gray-300" onClick={closeLightbox} aria-label="Close">
              <X className="w-8 h-8" />
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50"
              onClick={showPrev}
              disabled={selectedIndex === 0}
              aria-label="Previous"
            >
              <ArrowLeft className="w-12 h-12" />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50"
              onClick={showNext}
              disabled={selectedIndex === (mediaType === "images" ? images : videos).length - 1}
              aria-label="Next"
            >
              <ArrowRight className="w-12 h-12" />
            </button>
            {mediaType === "images" ? (
              <img
                src={typeof images[selectedIndex] === "string" ? (images[selectedIndex] as string) : (images[selectedIndex] as any).url}
                alt={`Enlarged image ${selectedIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"

              />
            ) : (
              <video
                src={typeof videos[selectedIndex] === "string" ? (videos[selectedIndex] as string) : (videos[selectedIndex] as any).url}
                controls
                autoPlay
                className="w-full h-auto max-h-[80vh] object-contain"
                preload="auto" // ✅ preload video for lightbox
              />
            )}
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}