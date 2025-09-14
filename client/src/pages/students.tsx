import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X, ArrowLeft, ArrowRight } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import Plyr from "plyr";
import "plyr/dist/plyr.css"; // Plyr styles

type StudentMedia = {
    id: string;
    url: string;
    type: "image" | "video";
    batch: "+1" | "+2";
    year: number;
    description?: string;
};

export default function StudentsPage() {
    const [batch, setBatch] = useState<"+1" | "+2" | "">("");
    const [year, setYear] = useState("");
    const [type, setType] = useState<"image" | "video" | "">("");
    const [filtersApplied, setFiltersApplied] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [touchStartX, setTouchStartX] = useState<number>(0);
    const [isMobile, setIsMobile] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false);
    const [scale, setScale] = useState(1);
    const mediaContainerRef = useRef<HTMLDivElement>(null);
    const videoPlayerRef = useRef<Plyr | null>(null);
    const { data, isLoading } = useQuery<StudentMedia[]>({
        queryKey: ["students", batch, year, type],
        queryFn: async () => {
            console.log("Fetching data with params:", { batch, year, type });
            const params = new URLSearchParams();
            if (batch) params.set("batch", batch);
            if (year) params.set("year", year);
            if (type) params.set("type", type);

            const res = await fetch(`/api/students?${params.toString()}`);
            if (!res.ok) {
                console.error("Fetch error:", res.status, res.statusText);
                throw new Error("Failed to fetch student media");
            }
            const result = await res.json();
            console.log("Fetched data:", result);
            return result;
        },
        enabled: filtersApplied,
    });
    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Initialize Plyr when video is selected
    useEffect(() => {
        if (selectedIndex !== null && data && data[selectedIndex]?.type === "video" && mediaContainerRef.current) {
            const videoElement = mediaContainerRef.current.querySelector("video");
            if (videoElement && !videoPlayerRef.current) {
                videoPlayerRef.current = new Plyr(videoElement, {
                    controls: ["play", "progress", "current-time", "mute", "volume", "fullscreen"],
                    autoplay: true,
                    quality: { default: 720, options: [1080, 720, 480] },
                });
            }
        }
        return () => {
            if (videoPlayerRef.current) {
                videoPlayerRef.current.destroy();
                videoPlayerRef.current = null;
            }
        };
    }, [selectedIndex, data]);



    const showMedia = (index: number) => {
        console.log("Showing media at index:", index);
        setSelectedIndex(index);
        setScale(1);
        setIsInteracting(true);

        setTimeout(() => {
            setIsInteracting(false);
        }, 3000); // Persist description for 3s before fading
    };


    const closeLightbox = () => {
        console.log("Closing lightbox");
        if (videoPlayerRef.current) {
            videoPlayerRef.current.destroy();
            videoPlayerRef.current = null;
        }
        setSelectedIndex(null);
        setScale(1);
        setIsInteracting(false);
    };

    const showNext = () => {
        console.log("Next button clicked, current index:", selectedIndex, "data length:", data?.length);
        if (selectedIndex === null || !data || data.length === 0) {
            console.log("Cannot show next: invalid index or no data");
            return;
        }
        if (videoPlayerRef.current) {
            videoPlayerRef.current.destroy();
            videoPlayerRef.current = null;
        }
        const nextIndex = (selectedIndex + 1) % data.length;
        console.log("Moving to next index:", nextIndex);
        setSelectedIndex(nextIndex);
        setScale(1);
        setIsInteracting(true);

        setTimeout(() => {
            setIsInteracting(false);
        }, 3000);
    };

    const showPrev = () => {
        console.log("Prev button clicked, current index:", selectedIndex, "data length:", data?.length);
        if (selectedIndex === null || !data || data.length === 0) {
            console.log("Cannot show prev: invalid index or no data");
            return;
        }
        if (videoPlayerRef.current) {
            videoPlayerRef.current.destroy();
            videoPlayerRef.current = null;
        }
        const prevIndex = selectedIndex === 0 ? data.length - 1 : selectedIndex - 1;
        console.log("Moving to prev index:", prevIndex);
        setSelectedIndex(prevIndex);
        setScale(1);
        setIsInteracting(true);

        setTimeout(() => {
            setIsInteracting(false);
        }, 3000);
    };


    useEffect(() => {
        const container = mediaContainerRef.current;
        if (!container) return;

        const handleTouchMove = (e: TouchEvent) => {
            if (isMobile && e.touches.length === 2) {
                setIsInteracting(true);

                const touch1 = e.touches[0];
                const touch2 = e.touches[1];

                const distance = Math.hypot(
                    touch2.pageX - touch1.pageX,
                    touch2.pageY - touch1.pageY
                );

                const initialDistance = Math.hypot(
                    touchStartX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );

                const newScale = Math.min(Math.max(1, distance / initialDistance), 3);
                setScale(newScale);

                if (e.cancelable) e.preventDefault();
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (isMobile) {
                const touchEndX = e.changedTouches[0].clientX;
                const deltaX = touchEndX - touchStartX;
                console.log("Touch end, deltaX:", deltaX);

                if (deltaX > 50) showPrev();
                else if (deltaX < -50) showNext();

                setIsInteracting(false);
            }
        };

        container.addEventListener("touchmove", handleTouchMove, { passive: false });
        container.addEventListener("touchend", handleTouchEnd);

        return () => {
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
        };
    }, [isMobile, touchStartX, showPrev, showNext]);



    const handleMouseMove = () => {
        if (!isMobile) setIsInteracting(true);
    };

    const handleMouseLeave = () => {
        if (!isMobile) setIsInteracting(false);
    };

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Filter Section */}
                    <div className="bg-white/70 dark:bg-white/10 backdrop-blur-lg border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-xl mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Find Student Media</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <select
                                value={batch}
                                onChange={(e) => {
                                    console.log("Batch changed to:", e.target.value);
                                    setBatch(e.target.value as "+1" | "+2" | "");
                                }}
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
                                    onChange={(e) => {
                                        console.log("Year changed to:", e.target.value);
                                        setYear(e.target.value.slice(0, 4));
                                    }}
                                    className="p-3 rounded-xl border dark:bg-gray-800 dark:text-white w-full"
                                />
                                {year && year.length !== 4 && (
                                    <p className="text-red-400 text-sm mt-1">Year must be exactly 4 digits</p>
                                )}
                            </div>

                            <select
                                value={type}
                                onChange={(e) => {
                                    console.log("Type changed to:", e.target.value);
                                    setType(e.target.value as "image" | "video" | "");
                                }}
                                className="p-3 rounded-xl border dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">Select Type</option>
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                            </select>
                        </div>

                        <button
                            onClick={() => {
                                console.log("Find Now clicked, filters:", { batch, year, type });
                                setFiltersApplied(true);
                            }}
                            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
                            disabled={!batch || !type || year.length !== 4}
                        >
                            Find Now
                        </button>
                    </div>

                    {/* Media Grid */}
                    {isLoading && filtersApplied && (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                        </div>
                    )}

                    {!isLoading && data && data.length === 0 && filtersApplied && (
                        <p className="text-center text-gray-600 dark:text-gray-400">No media found.</p>
                    )}

                    {!isLoading && data && data.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-white/10 backdrop-blur-lg border border-black/5 dark:border-white/10 shadow hover:shadow-xl transition cursor-pointer group"
                                    onClick={() => showMedia(index)}
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
                    )}
                </div>

                {/* Lightbox */}
                {selectedIndex !== null && data && (
                    <div
                        className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={closeLightbox}
                    >
                        <div
                            ref={mediaContainerRef}
                            className="relative max-w-5xl max-h-[90vh] w-full p-4 flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => {
                                console.log("Touch start at:", e.touches[0].clientX);
                                setTouchStartX(e.touches[0].clientX);
                                setIsInteracting(true);
                            }}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >

                            <button
                                className="absolute -top-10 right-4 text-white hover:text-gray-300 z-10"
                                onClick={closeLightbox}
                            >
                                <X className="w-8 h-8" />
                            </button>

                            {!isMobile && (
                                <>
                                    <button
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/20 rounded-full p-2"
                                        onClick={(e) => {
                                            console.log("Left arrow clicked");
                                            e.stopPropagation();
                                            showPrev();
                                        }}
                                    >
                                        <ArrowLeft className="w-12 h-12" />
                                    </button>
                                    <button
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/20 rounded-full p-2"
                                        onClick={(e) => {
                                            console.log("Right arrow clicked");
                                            e.stopPropagation();
                                            showNext();
                                        }}
                                    >
                                        <ArrowRight className="w-12 h-12" />
                                    </button>
                                </>
                            )}
                            <div className="relative w-full flex justify-center z-0">
                                <div
                                    ref={mediaContainerRef}
                                    className="w-full h-auto max-h-[80vh] overflow-hidden"
                                    style={{
                                        transform: `scale(${scale})`,
                                        transformOrigin: "center",
                                        transition: isMobile ? "none" : "transform 0.2s",
                                    }}
                                >
                                    {data[selectedIndex].type === "image" ? (
                                        <img
                                            src={data[selectedIndex].url}
                                            className="w-full h-auto object-contain rounded-xl"
                                            style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
                                        />
                                    ) : (
                                        <video
                                            src={data[selectedIndex].url}
                                            className="w-full h-auto object-contain rounded-xl"
                                            style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
                                        />
                                    )}
                                    {data[selectedIndex].description && (
                                        data[selectedIndex].type === "image" ? (
                                            <div className={`absolute bottom-0 w-full ${isMobile ? "pb-4 pt-4" : "pb-4 pt-4 mt-5 mb-4"} px-6 text-center bg-black/70`}>
                                                <p className="text-white text-lg font-medium">
                                                    {data[selectedIndex].description}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className={`absolute bottom-12 w-full ${isMobile ? "mb-6 mt-6" : "mt-4 mb-4 p-4"} px-6 text-center bg-black/70 transition-opacity duration-1000 animate-fade-slow ${isInteracting ? "opacity-100" : "opacity-0"}`}>
                                                <p className="text-white text-lg font-medium">
                                                    {data[selectedIndex].description}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}