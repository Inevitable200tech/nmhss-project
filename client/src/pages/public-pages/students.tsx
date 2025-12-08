import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X, ArrowLeft, ArrowRight } from "lucide-react";
import Navigation from "@/components/static-pages/navigation";
import Footer from "@/components/static-pages/footer";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

type StudentMedia = {
  id: string;
  url: string;
  type: "image" | "video";
  batch: "+1" | "+2";
  year: number;
  description?: string;
};

// Constant for items per page in the grid
const ITEMS_PER_PAGE = 4;

export default function StudentsPage() {
  const [batch, setBatch] = useState<"+1" | "+2" | "">("");
  const [year, setYear] = useState("");
  const [type, setType] = useState<"image" | "video" | "">("");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [scale, setScale] = useState(1);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Refs
  const lightboxWrapperRef = useRef<HTMLDivElement | null>(null); // single stable container ref
  // Use a broader HTMLElement type so the same ref can point to an <img> or a <video>
  const mediaElementRef = useRef<HTMLElement | null>(null); // points to <img> or <video>
  const videoPlayerRef = useRef<any | null>(null); // Plyr instance
  const pinchInitialDistanceRef = useRef<number | null>(null);
  const pinchInitialScaleRef = useRef<number>(1);
  const touchStartXRef = useRef<number | null>(null);

  const { data: allMedia, isLoading } = useQuery<StudentMedia[]>({
    queryKey: ["students", batch, year, type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (batch) params.set("batch", batch);
      if (year) params.set("year", year);
      if (type) params.set("type", type);

      const res = await fetch(`/api/students?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch student media");
      const result = await res.json();
      return result;
    },
    enabled: filtersApplied,
  });

  // Calculate total pages and slice data for the current page
  const totalPages = useMemo(() => {
    if (!allMedia || allMedia.length === 0) return 1;
    return Math.ceil(allMedia.length / ITEMS_PER_PAGE);
  }, [allMedia]);

  const paginatedMedia = useMemo(() => {
    if (!allMedia) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allMedia.slice(startIndex, endIndex);
  }, [allMedia, currentPage]);

  // Reset currentPage when filters change and data is fetched
  useEffect(() => {
    if (filtersApplied) {
      setCurrentPage(1);
    }
  }, [filtersApplied, batch, year, type]);

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Clean plyr when selection changes / unmount
  useEffect(() => {
    // Destroy any existing player when selectedIndex changes
    return () => {
      if (videoPlayerRef.current) {
        try {
          videoPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        videoPlayerRef.current = null;
      }
    };
  }, [selectedIndex]);

  // Initialize Plyr when the selected media is a video
  useEffect(() => {
    if (selectedIndex === null || !allMedia) return;

    // IMPORTANT: The selected index is relative to the *full* data set (allMedia),
    // because the navigation (showNext/showPrev) needs to wrap around the whole set.
    const selected = allMedia[selectedIndex];
    if (!selected || selected.type !== "video") return;

    // mount plyr on the actual <video> element
    const videoEl = mediaElementRef.current as HTMLVideoElement | null;
    if (videoEl && !videoPlayerRef.current) {
      videoPlayerRef.current = new Plyr(videoEl, {
        controls: ["play", "progress", "current-time", "mute", "volume", "fullscreen"],
        autoplay: true,
        clickToPlay: true,
        quality: { default: 720, options: [1080, 720, 480] },
      });

      // when entering fullscreen, ensure scale resets so layout remains consistent
      videoPlayerRef.current.on?.("enterfullscreen", () => setScale(1));
    }

    return () => {
      if (videoPlayerRef.current) {
        try {
          videoPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        videoPlayerRef.current = null;
      }
    };
  }, [selectedIndex, allMedia]);

  /**
   * Calculates the index of the item in the full `allMedia` array
   * based on the clicked item's index in the `paginatedMedia` array and the current page.
   */
  const getFullIndex = useCallback((indexInPage: number) => {
    return (currentPage - 1) * ITEMS_PER_PAGE + indexInPage;
  }, [currentPage]);

  // Show one media item (index is relative to the full data set)
  const showMedia = useCallback((fullIndex: number) => {
    setSelectedIndex(fullIndex);
    setScale(1);
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 3000);
  }, []);

  const closeLightbox = useCallback(() => {
    if (videoPlayerRef.current) {
      try {
        videoPlayerRef.current.destroy();
      } catch {
        // ignore
      }
      videoPlayerRef.current = null;
    }
    setSelectedIndex(null);
    setScale(1);
    setIsInteracting(false);
  }, []);

  const showNext = useCallback(() => {
    if (selectedIndex === null || !allMedia || allMedia.length === 0) return;
    if (videoPlayerRef.current) {
      try {
        videoPlayerRef.current.destroy();
      } catch {
        // ignore
      }
      videoPlayerRef.current = null;
    }
    const nextIndex = (selectedIndex + 1) % allMedia.length;
    setSelectedIndex(nextIndex);
    setScale(1);
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 3000);
  }, [selectedIndex, allMedia]);

  const showPrev = useCallback(() => {
    if (selectedIndex === null || !allMedia || allMedia.length === 0) return;
    if (videoPlayerRef.current) {
      try {
        videoPlayerRef.current.destroy();
      } catch {
        // ignore
      }
      videoPlayerRef.current = null;
    }
    const prevIndex = selectedIndex === 0 ? allMedia.length - 1 : selectedIndex - 1;
    setSelectedIndex(prevIndex);
    setScale(1);
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 3000);
  }, [selectedIndex, allMedia]);

  // Pagination handlers
  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);


  // Touch/pinch handlers attached to the lightbox wrapper (single ref)
  useEffect(() => {
    const wrapper = lightboxWrapperRef.current;
    if (!wrapper) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartXRef.current = e.touches[0].clientX;
      } else if (e.touches.length === 2) {
        // begin pinch
        const dx = e.touches[0].pageX - e.touches[1].pageX;
        const dy = e.touches[0].pageY - e.touches[1].pageY;
        pinchInitialDistanceRef.current = Math.hypot(dx, dy);
        pinchInitialScaleRef.current = scale;
        setIsInteracting(true);
        if (e.cancelable) e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchInitialDistanceRef.current) {
        const dx = e.touches[0].pageX - e.touches[1].pageX;
        const dy = e.touches[0].pageY - e.touches[1].pageY;
        const distance = Math.hypot(dx, dy);
        const newScale = Math.min(Math.max(0.8, (distance / pinchInitialDistanceRef.current) * pinchInitialScaleRef.current), 3);
        setScale(newScale);
        if (e.cancelable) e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      // swipe navigation (single finger)
      if (e.changedTouches && e.changedTouches.length === 1 && touchStartXRef.current != null) {
        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchEndX - touchStartXRef.current;
        if (deltaX > 60) showPrev();
        else if (deltaX < -60) showNext();
      }

      // reset pinch state
      if (e.touches.length < 2) {
        pinchInitialDistanceRef.current = null;
        pinchInitialScaleRef.current = scale;
      }

      touchStartXRef.current = null;
      setIsInteracting(false);
    };

    wrapper.addEventListener("touchstart", onTouchStart, { passive: false });
    wrapper.addEventListener("touchmove", onTouchMove, { passive: false });
    wrapper.addEventListener("touchend", onTouchEnd);

    return () => {
      wrapper.removeEventListener("touchstart", onTouchStart as any);
      wrapper.removeEventListener("touchmove", onTouchMove as any);
      wrapper.removeEventListener("touchend", onTouchEnd as any);
    };
  }, [scale, showNext, showPrev]);

  // Mouse move handlers for desktop to show UI
  const handleMouseMove = () => {
    if (!isMobile) setIsInteracting(true);
  };
  const handleMouseLeave = () => {
    if (!isMobile) setIsInteracting(false);
  };

  // Keyboard navigation (left/right/escape)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIndex, showNext, showPrev, closeLightbox]);

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Filters */}
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-lg border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-xl mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Find Student Media</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value as "+1" | "+2" | "")}
                className="p-3 rounded-xl border dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Batch</option>
                <option value="+1">+1</option>
                <option value="+2">+2</option>
              </select>

              <div>
                <input
                  type="number"
                  placeholder="Year (YYYY)"
                  value={year}
                  onChange={(e) => setYear(e.target.value.slice(0, 4))}
                  className="p-3 rounded-xl border dark:bg-gray-800 dark:text-white w-full"
                />
                {year && year.length !== 4 && (
                  <p className="text-red-400 text-sm mt-1">Year must be exactly 4 digits</p>
                )}
              </div>

              <select
                value={type}
                onChange={(e) => setType(e.target.value as "image" | "video" | "")}
                className="p-3 rounded-xl border dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Type</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            <button
              onClick={() => setFiltersApplied(true)}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
              disabled={!batch || !type || year.length !== 4}
            >
              Find Now
            </button>
          </div>

          {/* Grid */}
          {isLoading && filtersApplied && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          )}

          {!isLoading && allMedia && allMedia.length === 0 && filtersApplied && (
            <p className="text-center text-gray-600 dark:text-gray-400">No media found.</p>
          )}

          {!isLoading && paginatedMedia && paginatedMedia.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedMedia.map((item, indexInPage) => (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-white/10 backdrop-blur-lg border border-black/5 dark:border-white/10 shadow hover:shadow-xl transition cursor-pointer group"
                    onClick={() => showMedia(getFullIndex(indexInPage))}
                  >
                    {item.type === "image" ? (
                      <img src={item.url} alt={item.description || "student media"} className="w-full h-64 object-cover" />
                    ) : (
                      <video src={item.url} className="w-full h-64 object-cover" muted loop playsInline />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                      <p className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        View
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-10">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="p-3 rounded-full text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white/90 dark:hover:bg-gray-700/90 disabled:opacity-50 transition"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>

                  <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-full text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white/90 dark:hover:bg-gray-700/90 disabled:opacity-50 transition"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Lightbox */}
        {/* The lightbox uses 'allMedia' and 'selectedIndex' (full index) for correct data retrieval and navigation */}
        {selectedIndex !== null && allMedia && (
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={closeLightbox}
          >
            <div
              ref={lightboxWrapperRef}
              className="relative w-full max-w-5xl max-h-[90vh] p-4 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Close */}
              <button
                className="absolute -top-10 right-4 text-white hover:text-gray-300 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  closeLightbox();
                }}
              >
                <X className="w-8 h-8" />
              </button>

              {/* Prev/Next (desktop only) */}
              {!isMobile && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/20 rounded-full p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      showPrev();
                    }}
                  >
                    <ArrowLeft className="w-12 h-12" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/20 rounded-full p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      showNext();
                    }}
                  >
                    <ArrowRight className="w-12 h-12" />
                  </button>
                </>
              )}

              {/* Media wrapper: Option B - expand as much as possible while preserving aspect ratio */}
              <div
                className="relative w-full flex items-center justify-center"
                style={{
                  maxHeight: "86vh",
                  // width is 100% but constrained by max-w-5xl parent
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    // allow the media element to grow until one dimension hits the max constraints,
                    // while preserving natural aspect ratio with object-contain.
                    maxHeight: "86vh",
                    maxWidth: "100%",
                    transform: `scale(${scale})`,
                    transformOrigin: "center",
                    transition: isMobile ? "none" : "transform 0.15s ease-out",
                  }}
                >
                  {allMedia[selectedIndex].type === "image" ? (
                    <img
                      ref={(el) => (mediaElementRef.current = el)}
                      src={allMedia[selectedIndex].url}
                      alt={allMedia[selectedIndex].description || "student media"}
                      className="max-h-[86vh] max-w-full object-contain rounded-xl"
                      style={{ display: "block" }}
                    />
                  ) : (
                    <video
                      ref={(el) => (mediaElementRef.current = el)}
                      src={allMedia[selectedIndex].url}
                      controls
                      className="max-h-[86vh] max-w-full object-contain rounded-xl"
                      playsInline
                    />
                  )}
                </div>

                {/* Description overlay */}
                {allMedia[selectedIndex].description && (
                  <div
                    className={`absolute bottom-6 w-full px-6 text-center bg-black/70 transition-opacity duration-300 ${
                      isInteracting ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <p className="text-white text-lg font-medium">{allMedia[selectedIndex].description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}