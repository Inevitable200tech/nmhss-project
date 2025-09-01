import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, X, Calendar } from "lucide-react";
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

  if (isLoading) return <div className="text-gray-100 dark:text-gray-100 text-center py-20">Loading...</div>;

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
      <section id="gallery" className="py-20 bg-gray-900 dark:bg-gray-900 mt-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-100 dark:text-gray-100 mb-4">
              {data?.title || "Photo Gallery & Timeline"}
            </h2>
            <p className="text-xl text-gray-400 dark:text-gray-400 max-w-2xl mx-auto">
              {data?.subtitle || "Explore our school's history through timeline and captured moments"}
            </p>
          </div>

          {/* Timeline Section */}
          <div className="mb-20">
            <h3 className="text-3xl font-bold text-gray-100 dark:text-gray-100 mb-8 text-center">School Timeline</h3>
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-blue-400 dark:bg-blue-400"></div>
              {timelineItems.map((item: { value: string; label: string; description: string }, index: number) => (
                <div
                  key={index}
                  className={`flex ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"} mb-8 items-center justify-between`}
                >
                  <div className={`w-5/12 ${index % 2 === 0 ? "text-right pr-8" : "text-left pl-8"}`}>
                    <h4 className="text-xl font-semibold text-gray-100 dark:text-gray-100">{item.label}</h4>
                    <p className="text-gray-400 dark:text-gray-400">{item.description}</p>
                  </div>
                  <div className="w-2/12 flex justify-center">
                    <div className="bg-gray-900 dark:bg-gray-900 border-2 border-blue-400 dark:border-blue-400 rounded-full p-2 z-10">
                      <Calendar className="w-6 h-6 text-blue-400 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className={`w-5/12 ${index % 2 === 0 ? "pl-8" : "pr-8 text-right"}`}>
                    <span className="font-bold text-blue-400 dark:text-blue-400">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media Type Toggle */}
          <div className="flex justify-center mb-8 space-x-4">
            <button
              onClick={() => setMediaType("images")}
              className={`px-6 py-2 rounded-full font-medium transition ${
                mediaType === "images" ? "bg-blue-500 dark:bg-blue-500 text-white dark:text-white" : "bg-gray-800/20 dark:bg-gray-800/20 text-gray-100 dark:text-gray-100"
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setMediaType("videos")}
              className={`px-6 py-2 rounded-full font-medium transition ${
                mediaType === "videos" ? "bg-blue-500 dark:bg-blue-500 text-white dark:text-white" : "bg-gray-800/20 dark:bg-gray-800/20 text-gray-100 dark:text-gray-100"
              }`}
            >
              Videos
            </button>
          </div>

          {/* Media Display */}
          <div className="relative rounded-3xl p-6 bg-gray-800/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border border-gray-700/50 dark:border-gray-700/50 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute w-24 h-24 bg-white/20 rounded-full top-10 left-10 blur-2xl opacity-30"></div>
              <div className="absolute w-32 h-32 bg-white/10 rounded-full bottom-10 right-10 blur-3xl opacity-40"></div>
            </div>

            <div className="relative z-10 space-y-8">
              {mediaType === "images" ? (
                groupedImages.length > 0 ? (
                  groupedImages.map(([date, items], index) => (
                    <div key={index} className="bg-gray-900/30 dark:bg-gray-900/30 backdrop-blur-md border border-gray-700/50 dark:border-gray-700/50 rounded-xl p-4">
                      <div className="absolute top-4 left-4 text-gray-100 dark:text-gray-100 font-semibold">{date}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-8">
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-shadow group cursor-pointer"
                            onClick={() => showMedia(images.findIndex((img: { url: string }) => img.url === item.url))}
                          >
                            <img
                              src={item.url}
                              alt={`Media ${idx + 1}`}
                              className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                              <p className="text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                View
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((item: { url: string } | string, index: number) => (
                      <div
                        key={index}
                        className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-shadow group cursor-pointer"
                        onClick={() => showMedia(index)}
                      >
                        <img
                          src={typeof item === "string" ? item : item.url}
                          alt={`Media ${index + 1}`}
                          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <p className="text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            View
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                groupedVideos.length > 0 ? (
                  groupedVideos.map(([date, items], index) => (
                    <div key={index} className="bg-gray-900/30 dark:bg-gray-900/30 backdrop-blur-md border border-gray-700/50 dark:border-gray-700/50 rounded-xl p-4">
                      <div className="absolute top-4 left-4 text-gray-100 dark:text-gray-100 font-semibold">{date}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-8">
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-shadow group cursor-pointer"
                            onClick={() => showMedia(videos.findIndex((vid: { url: string }) => vid.url === item.url))}
                          >
                            <video
                              src={item.url}
                              className="w-full h-64 object-cover"
                              muted
                              loop
                              playsInline
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                              <p className="text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                View
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((item: { url: string } | string, index: number) => (
                      <div
                        key={index}
                        className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-shadow group cursor-pointer"
                        onClick={() => showMedia(index)}
                      >
                        <video
                          src={typeof item === "string" ? item : item.url}
                          className="w-full h-64 object-cover"
                          muted
                          loop
                          playsInline
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <p className="text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            View
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={closeLightbox}>
          <div className="relative max-w-4xl max-h-[90vh] w-full p-4" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-10 right-4 text-white hover:text-gray-300" onClick={closeLightbox}>
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
              disabled={selectedIndex === (mediaType === "images" ? images : videos).length - 1}
            >
              <ArrowRight className="w-12 h-12" />
            </button>
            {mediaType === "images" ? (
              <img
                src={typeof images[selectedIndex] === "string" ? images[selectedIndex] : images[selectedIndex].url}
                alt={`Enlarged image ${selectedIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            ) : (
              <video
                src={typeof videos[selectedIndex] === "string" ? videos[selectedIndex] : videos[selectedIndex].url}
                controls
                autoPlay
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}