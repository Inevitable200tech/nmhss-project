import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, X, LucideIcon } from "lucide-react";
import { TutorialVideo } from "@/lib/tutorial-data";
import * as Icons from "lucide-react";

interface TutorialVideoPlayerProps {
  title: string;
  description: string;
  videos: TutorialVideo[];
  icon: string;
}

export function TutorialVideoPlayer({
  title,
  description,
  videos,
  icon,
}: TutorialVideoPlayerProps) {
  const [selectedVideo, setSelectedVideo] = useState<TutorialVideo | null>(null);
  const { playHoverSound, playSuccessSound } = useSound();

  const IconComponent = (Icons[icon as keyof typeof Icons] || Icons.HelpCircle) as LucideIcon;

  const handleVideoClick = (video: TutorialVideo) => {
    setSelectedVideo(video);
    playSuccessSound();
  };

  return (
    <>
      <Card className="w-full bg-gray-800 border-gray-700 hover:border-cyan-600 hover:shadow-lg hover:shadow-cyan-600/20 transition-all">
        <CardHeader>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="rounded-lg bg-cyan-900/30 p-2 sm:p-3 flex-shrink-0">
              <IconComponent className="h-5 sm:h-6 w-5 sm:w-6 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl text-white">{title}</CardTitle>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">{description}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {videos.map((video) => (
              <Button
                key={video.id}
                onClick={() => handleVideoClick(video)}
                onMouseEnter={playHoverSound}
                variant="outline"
                className="w-full justify-start h-auto p-3 sm:p-4 bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-cyan-500 text-white transition-all"
              >
                <Play className="h-4 sm:h-5 w-4 sm:w-5 text-cyan-400 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm text-white truncate">{video.title}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {video.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-full sm:max-w-4xl bg-gray-800 border-gray-700 p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-white text-lg sm:text-2xl">{selectedVideo?.title}</DialogTitle>
          </DialogHeader>

          <div className="w-full bg-black rounded-lg overflow-hidden">
            <video
              key={selectedVideo?.id}
              className="w-full aspect-video bg-black"
              controls
              autoPlay
            >
              <source src={selectedVideo?.videoPath} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedVideo(null)}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
