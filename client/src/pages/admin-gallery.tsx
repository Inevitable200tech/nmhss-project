import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // Assuming your UI library has a Progress component
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

type MediaItem = { id: string; url: string; uploadedAt: Date };

export default function AdminGalleryPage() {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newVideo, setNewVideo] = useState<File | null>(null);
  const [imageDate, setImageDate] = useState<string>("");
  const [videoDate, setVideoDate] = useState<string>("");
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0); // Track video upload progress
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false); // Track upload state
  const { toast } = useToast();

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const res = await fetch("/api/gallery");
        if (!res.ok) throw new Error("Failed to fetch gallery data");
        const data = await res.json();
        setImages(data.images || []);
        setVideos(data.videos || []);
      } catch {
        toast({ title: "Error", description: "Failed to load gallery data" });
      }
    };
    loadGallery();
  }, []);

  const handleImageUpload = async () => {
    if (!newImage || !imageDate) {
      toast({ title: "Error", description: "Please select a file and date" });
      return;
    }
    const formData = new FormData();
    formData.append("file", newImage);
    formData.append("uploadedAt", new Date(imageDate).toISOString());
    try {
      const res = await fetch("/api/gallery/images", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImages((prev) => [...prev, { id: data.id, url: data.url, uploadedAt: new Date(data.uploadedAt) }]);
        setNewImage(null);
        setImageDate("");
        toast({ title: "Success", description: "Image uploaded successfully" });
      } else {
        toast({ title: "Error", description: data.error || "Failed to upload image" });
      }
    } catch {
      toast({ title: "Error", description: "Upload failed" });
    }
  };

  const handleVideoUpload = async () => {
    if (!newVideo || !videoDate) {
      toast({ title: "Error", description: "Please select a file and date" });
      return;
    }
    const formData = new FormData();
    formData.append("file", newVideo);
    formData.append("uploadedAt", new Date(videoDate).toISOString());

    setIsVideoUploading(true);
    setVideoUploadProgress(0);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/gallery/videos", true);

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setVideoUploadProgress(Math.round(percentComplete));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          setVideos((prev) => [...prev, { id: data.id, url: data.url, uploadedAt: new Date(data.uploadedAt) }]);
          setNewVideo(null);
          setVideoDate("");
          setVideoUploadProgress(0);
          setIsVideoUploading(false);
          toast({ title: "Success", description: "Video uploaded successfully" });
        } else {
          const data = JSON.parse(xhr.responseText);
          setIsVideoUploading(false);
          setVideoUploadProgress(0);
          toast({ title: "Error", description: data.error || "Failed to upload video" });
        }
      };

      xhr.onerror = () => {
        setIsVideoUploading(false);
        setVideoUploadProgress(0);
        toast({ title: "Error", description: "Upload failed" });
      };

      xhr.send(formData);
    } catch {
      setIsVideoUploading(false);
      setVideoUploadProgress(0);
      toast({ title: "Error", description: "Upload failed" });
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/images/${id}`, { method: "DELETE" });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
        toast({ title: "Success", description: "Image deleted successfully" });
      } else {
        toast({ title: "Error", description: "Failed to delete image" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete image" });
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/videos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setVideos((prev) => prev.filter((vid) => vid.id !== id));
        toast({ title: "Success", description: "Video deleted successfully" });
      } else {
        toast({ title: "Error", description: "Failed to delete video" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete video" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin: Gallery Management</h1>
        <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
          Back to Dashboard
        </Button>
      </div>

      {/* Image Upload */}
      <Card>
        <CardHeader><CardTitle>Upload Image</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setNewImage(e.target.files?.[0] || null)}
          />
          <Input
            type="date"
            value={imageDate}
            onChange={(e) => setImageDate(e.target.value)}
            placeholder="Upload Date"
          />
          <Button onClick={handleImageUpload}>Upload Image</Button>
        </CardContent>
      </Card>

      {/* Image List */}
      <Card>
        <CardHeader><CardTitle>Images</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative border rounded-lg p-2 shadow-sm">
              <img src={img.url} alt="Gallery image" className="w-full h-40 object-cover rounded-md" />
              <p className="text-sm text-muted-foreground">{new Date(img.uploadedAt).toLocaleDateString()}</p>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleDeleteImage(img.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Video Upload */}
      <Card>
        <CardHeader><CardTitle>Upload Video</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept="video/*"
            onChange={(e) => setNewVideo(e.target.files?.[0] || null)}
            disabled={isVideoUploading}
          />
          <Input
            type="date"
            value={videoDate}
            onChange={(e) => setVideoDate(e.target.value)}
            placeholder="Upload Date"
            disabled={isVideoUploading}
          />
          {isVideoUploading && (
            <div className="space-y-2">
              <Progress value={videoUploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Uploading: {videoUploadProgress}%
              </p>
            </div>
          )}
          <Button onClick={handleVideoUpload} disabled={isVideoUploading}>
            {isVideoUploading ? "Uploading..." : "Upload Video"}
          </Button>
        </CardContent>
      </Card>

      {/* Video List */}
      <Card>
        <CardHeader><CardTitle>Videos</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((vid) => (
            <div key={vid.id} className="relative border rounded-lg p-2 shadow-sm">
              <video src={vid.url} className="w-full h-40 object-cover rounded-md" muted />
              <p className="text-sm text-muted-foreground">{new Date(vid.uploadedAt).toLocaleDateString()}</p>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleDeleteVideo(vid.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}