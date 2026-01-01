import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import { Trash2 } from "lucide-react";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

type HeroVideo = { id: string; mediaId: string; url: string; uploadedAt: Date };

export default function AdminIntroPage() {
  const [video, setVideo] = useState<HeroVideo | null>(null);
  const [newVideo, setNewVideo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { playHoverSound, playErrorSound, playSuccessSound } = useSound();

  // Load current hero video
  useEffect(() => {
    const loadHeroVideo = async () => {
      try {
        const res = await fetch("/api/hero-video");
        if (res.ok) {
          const data = await res.json();
          setVideo(data.video || null);
        }
      } catch {
        toast({ title: "Error", description: "Failed to load hero video" });
        playErrorSound();
      }
    };
    loadHeroVideo();
  }, []);

  const handleUpload = async () => {
    if (!newVideo) {
      toast({
        title: "No file selected",
        description: "Please select a video file before uploading.",
        variant: "destructive",
      });
      playErrorSound();
      return;
    }

    if (newVideo.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: `Hero video must be less than ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
        variant: "destructive",
      });
      playErrorSound();
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload to /api/media
      const formData = new FormData();
      formData.append("file", newVideo);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/media", true);
      xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("adminToken")}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const media = JSON.parse(xhr.responseText); // { id, url }

          // Step 2: Save hero video entry
          const res = await fetch("/api/hero-video", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
            body: JSON.stringify({
              mediaId: media.id,
              url: media.url,
            }),
          });

          if (!res.ok){ toast({title: "Error", description: "Failed to save hero video"}); playErrorSound(); throw new Error("Failed to save hero video");}
          const data = await res.json();

          setVideo(data);
          setNewVideo(null);
          toast({ title: "Success", description: "Hero video uploaded successfully" });
          playSuccessSound();
        } else {
          toast({ title: "Error", description: "Upload to /api/media failed" });
          playErrorSound();
        }
        setIsUploading(false);
        setUploadProgress(0);
      };

      xhr.onerror = () => {
        setIsUploading(false);
        toast({ title: "Error", description: "Upload failed" });
        playErrorSound();
      };

      xhr.send(formData);
    } catch {
      setIsUploading(false);
      toast({ title: "Error", description: "Upload failed" });
      playErrorSound();
    }
  };

  const handleDelete = async () => {
    if (!video) return;
    try {
      const res = await fetch(`/api/hero-video/${video.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      if (res.ok) {
        setVideo(null);
        toast({ title: "Success", description: "Hero video deleted successfully" });
        playSuccessSound();
      } else {
        toast({ title: "Error", description: "Failed to delete video" });
        playErrorSound();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete video" });
      playErrorSound();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-6 text-gray-100">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold" onMouseEnter={playHoverSound}>Admin: Hero Video</h1>
        <Button variant="outline" onClick={() => (window.location.href = "/admin")} onMouseEnter={playHoverSound}>
          Back to Dashboard
        </Button>
      </div>

      {!video && (
        <Card className="bg-gray-800/80 backdrop-blur-md shadow-lg">
          <CardHeader>
            <CardTitle onMouseEnter={playHoverSound}>Upload Hero Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file && file.size > MAX_FILE_SIZE) {
                  toast({
                    title: "File too large",
                    description: `Hero video must be less than ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
                    variant: "destructive",
                  });
                  playErrorSound();
                  e.target.value = ""; // reset input
                  setNewVideo(null);
                } else {
                  setNewVideo(file);
                }
              }}
              disabled={isUploading}
              onMouseEnter={playHoverSound}
            />
            <p className="text-sm text-gray-400" onMouseEnter={playHoverSound}>Max file size: {MAX_FILE_SIZE / (1024 * 1024)} MB</p>
            {newVideo && (
              <p className="text-sm text-gray-300" onMouseEnter={playHoverSound}>Selected file: {newVideo.name} ({(newVideo.size / (1024 * 1024)).toFixed(2)} MB)</p>
            )}
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-gray-400" onMouseEnter={playHoverSound}>Uploading: {uploadProgress}%</p>
              </div>
            )}
            <Button onClick={handleUpload} onMouseEnter={playHoverSound} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </CardContent>
        </Card>
      )}

      {video && (
        <Card className="bg-gray-800/80 backdrop-blur-md shadow-lg">
          <CardHeader>
            <CardTitle onMouseEnter={playHoverSound}>Current Hero Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <video src={video.url} className="w-full h-64 rounded-lg" controls onMouseEnter={playHoverSound} />
            <p className="text-sm text-gray-400" onMouseEnter={playHoverSound}>
              Uploaded at: {new Date(video.uploadedAt).toLocaleString()}
            </p>
            <Button variant="destructive" onClick={handleDelete} onMouseEnter={playHoverSound}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Video
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}