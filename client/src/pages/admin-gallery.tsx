import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Calendar } from "lucide-react";

type MediaItem = { id: string; url: string; uploadedAt: Date };

export default function AdminGalleryPage() {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newVideo, setNewVideo] = useState<File | null>(null);
  const [imageDate, setImageDate] = useState<string>("");
  const [videoDate, setVideoDate] = useState<string>("");
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);
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
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
      xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("token")}`);

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
      const res = await fetch(`/api/gallery/images/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
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
      const res = await fetch(`/api/gallery/videos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
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
    <div className="min-h-screen bg-gray-900 dark:bg-gray-900 p-6 space-y-6 text-gray-100 dark:text-gray-100">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-100 dark:text-gray-100">Admin: Gallery Management</h1>
        <Button
          variant="outline"
          className="border-blue-400 text-blue-400 hover:bg-blue-400/20 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400/20"
          onClick={() => (window.location.href = "/admin")}
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Image Upload */}
      <Card className="bg-gray-800/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border border-gray-700/50 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-gray-100 dark:text-gray-100">Upload Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setNewImage(e.target.files?.[0] || null)}
            className="border-gray-600 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400 text-gray-100 dark:text-gray-100 bg-gray-700 dark:bg-gray-700"
          />
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-blue-300 dark:text-blue-300" />
            <Input
              type="date"
              value={imageDate}
              onChange={(e) => setImageDate(e.target.value)}
              className="pl-10 border-gray-600 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400 text-gray-100 dark:text-gray-100 bg-gray-700 dark:bg-gray-700"
            />
          </div>
          <Button
            onClick={handleImageUpload}
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white dark:text-white"
          >
            Upload Image
          </Button>
        </CardContent>
      </Card>

      {/* Image List */}
      <Card className="bg-gray-800/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border border-gray-700/50 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-gray-100 dark:text-gray-100">Images</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-400 col-span-full">No images uploaded</p>
          ) : (
            images.map((img) => (
              <div
                key={img.id}
                className="relative bg-gray-900/30 dark:bg-gray-900/30 backdrop-blur-md border border-gray-700/50 dark:border-gray-700/50 rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={img.url}
                  alt="Gallery image"
                  className="w-full h-40 object-cover rounded-md"
                />
                <p className="text-sm text-gray-400 dark:text-gray-400 mt-2">
                  {new Date(img.uploadedAt).toLocaleDateString()}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 dark:bg-red-500/80 dark:hover:bg-red-600"
                  onClick={() => handleDeleteImage(img.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Video Upload */}
      <Card className="bg-gray-800/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border border-gray-700/50 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-gray-100 dark:text-gray-100">Upload Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept="video/*"
            onChange={(e) => setNewVideo(e.target.files?.[0] || null)}
            disabled={isVideoUploading}
            className="border-gray-600 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400 text-gray-100 dark:text-gray-100 bg-gray-700 dark:bg-gray-700"
          />
          <div className="relative">
            <Calendar
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-blue-300 dark:text-blue-300"
              aria-hidden="true"
            />
            <Input
              type="date"
              value={videoDate}
              onChange={(e) => setVideoDate(e.target.value)}
              disabled={isVideoUploading}
              className="pl-10 border-gray-600 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-400 text-gray-100 dark:text-gray-100 bg-gray-700 dark:bg-gray-700"
            />
          </div>
          {isVideoUploading && (
            <div className="space-y-2">
              <Progress value={videoUploadProgress} className="w-full bg-gray-600 dark:bg-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-400">Uploading: {videoUploadProgress}%</p>
            </div>
          )}
          <Button
            onClick={handleVideoUpload}
            disabled={isVideoUploading}
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white dark:text-white"
          >
            {isVideoUploading ? "Uploading..." : "Upload Video"}
          </Button>
        </CardContent>
      </Card>

      {/* Video List */}
      <Card className="bg-gray-800/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border border-gray-700/50 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-gray-100 dark:text-gray-100">Videos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-400 col-span-full">No videos uploaded</p>
          ) : (
            videos.map((vid) => (
              <div
                key={vid.id}
                className="relative bg-gray-900/30 dark:bg-gray-900/30 backdrop-blur-md border border-gray-700/50 dark:border-gray-700/50 rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow"
              >
                <video
                  src={vid.url}
                  className="w-full h-40 object-cover rounded-md"
                  muted
                />
                <p className="text-sm text-gray-400 dark:text-gray-400 mt-2">
                  {new Date(vid.uploadedAt).toLocaleDateString()}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 dark:bg-red-500/80 dark:hover:bg-red-600"
                  onClick={() => handleDeleteVideo(vid.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}