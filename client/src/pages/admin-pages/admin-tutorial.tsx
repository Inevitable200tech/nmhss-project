import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import { TutorialVideoPlayer } from "@/components/tutorial-video-player";
import { TUTORIAL_SECTIONS } from "@/lib/tutorial-data";
import { Search, BookOpen, X, ArrowLeft } from "lucide-react";

// Add Malayalam font styles
const malayalamFontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Meera+Inimai&display=swap');
`;

export default function AdminTutorialPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { playHoverSound } = useSound();

  // Filter sections based on search
  const filteredSections = TUTORIAL_SECTIONS.filter(
    (section) =>
      section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.videos.some(
        (video) =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <>
      <style>{malayalamFontStyle}</style>
      <div className="min-h-screen bg-gray-900" style={{ fontFamily: "'Meera Inimai', 'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="rounded-lg bg-cyan-900/50 p-2 sm:p-3 flex-shrink-0">
                <BookOpen className="h-6 sm:h-8 w-6 sm:w-8 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                  Admin Dashboard Help
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  Quick reference videos
                </p>
              </div>
            </div>
            <a href="/admin" className="flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-cyan-500 transition-all gap-2"
                onMouseEnter={playHoverSound}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </a>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
            <Input
              placeholder="Search tutorials..."
              className="pl-10 py-2 sm:py-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500 text-sm sm:text-base"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                playHoverSound();
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-gray-300"
              >
                <X className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {filteredSections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              No tutorials found for "{searchQuery}"
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="mt-4 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:gap-8">
            {filteredSections.map((section) => (
              <TutorialVideoPlayer
                key={section.id}
                title={section.name}
                description={section.description}
                videos={section.videos}
                icon={section.icon}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
