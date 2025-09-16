import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Calendar } from "lucide-react";

type MediaItem = { id: string; url: string; uploadedAt: Date };

export default function AdminGalleryPage() {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);

  const [newImage, setNewImage] = useState<File | null>(null);
  const [newVideo, setNewVideo] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [imageDate, setImageDate] = useState<string>("");
  const [videoDate, setVideoDate] = useState<string>("");

  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);

  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);

  const { toast } = useToast();

  // --- Cleanup previews when replaced/unmounted ---
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreview, videoPreview]);

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

  const resetImageForm = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setNewImage(null);
    setImagePreview(null);
    setImageDate("");
    setImageUploadProgress(0);
    setIsImageUploading(false);
  }, [imagePreview]);

  const resetVideoForm = useCallback(() => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setNewVideo(null);
    setVideoPreview(null);
    setVideoDate("");
    setVideoUploadProgress(0);
    setIsVideoUploading(false);
  }, [videoPreview]);

  const handleImageUpload = async () => {
    const confirmed = window.confirm(
      "Upload the image now?"
    );
    if (!confirmed) return;
    if (!newImage || !imageDate) {
      toast({ title: "Error", description: "Please select a file and date" });
      return;
    }
    const formData = new FormData();
    formData.append("file", newImage);
    formData.append("uploadedAt", new Date(imageDate).toISOString());

    setIsImageUploading(true);
    setImageUploadProgress(0);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/gallery/images", true);
      xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("adminToken")}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setImageUploadProgress(Math.round(percentComplete));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          setImages((prev) => [...prev, { id: data.id, url: data.url, uploadedAt: new Date(data.uploadedAt) }]);
          resetImageForm();
          toast({ title: "Success", description: "Image uploaded successfully" });
        } else {
          const data = JSON.parse(xhr.responseText);
          resetImageForm();
          toast({ title: "Error", description: data.error || "Failed to upload image" });
        }
      };

      xhr.onerror = () => {
        resetImageForm();
        toast({ title: "Error", description: "Upload failed" });
      };

      xhr.send(formData);
    } catch {
      resetImageForm();
      toast({ title: "Error", description: "Upload failed" });
    }
  };

  const handleVideoUpload = async () => {
    const confirmed = window.confirm(
      "Upload the video now?"
    );
    if (!confirmed) return;

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
      xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("adminToken")}`);

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
          resetVideoForm();
          toast({ title: "Success", description: "Video uploaded successfully" });
        } else {
          const data = JSON.parse(xhr.responseText);
          resetVideoForm();
          toast({ title: "Error", description: data.error || "Failed to upload video" });
        }
      };

      xhr.onerror = () => {
        resetVideoForm();
        toast({ title: "Error", description: "Upload failed" });
      };

      xhr.send(formData);
    } catch {
      resetVideoForm();
      toast({ title: "Error", description: "Upload failed" });
    }
  };

  const handleDeleteImage = async (id: string) => {
    const confirmed = window.confirm(
      "⚠️ Are you sure you want to delete the image ?\nThis action will remove it from the database completely!!!."
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/gallery/images/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
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
    const confirmed = window.confirm(
      "⚠️ Are you sure you want to delete the Video ?\nThis action will remove it from the database completely!!!."
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/gallery/videos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
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
    <div className="min-h-screen bg-gray-900 p-6 space-y-6 text-gray-100">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin: Gallery Management</h1>
        <Button
          variant="outline"
          className="border-blue-400 text-blue-400 hover:bg-blue-400/20"
          onClick={() => (window.location.href = "/admin")}
        >
          Back to Dashboard
        </Button>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="upload">Upload Media</TabsTrigger>
          <TabsTrigger value="manage">Manage Media</TabsTrigger>
        </TabsList>

        {/* Upload Section */}
        <TabsContent value="upload" className="space-y-6">
          {/* Image Upload */}
          <Card className="bg-gray-800/80 border border-gray-700/50">
            <CardHeader><CardTitle>Upload Image</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.size > 2 * 1024 * 1024) { // 2MB
                    toast({ title: "Error", description: "Image must be less than 2MB" });
                    e.target.value = ""; // reset input
                    return;
                  }
                  if (imagePreview) URL.revokeObjectURL(imagePreview);
                  setNewImage(file);
                  setImagePreview(file ? URL.createObjectURL(file) : null);
                }}
                disabled={isImageUploading}
              />

              {/* Image Preview Container */}
              <div className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-4 flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-60 rounded-lg object-contain" />
                ) : (
                  <p className="text-gray-500 italic">No preview available</p>
                )}
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-blue-300" />
                <Input
                  type="date"
                  value={imageDate}
                  onChange={(e) => setImageDate(e.target.value)}
                  disabled={isImageUploading}
                  className="pl-10"
                />
              </div>

              {isImageUploading && (
                <div className="space-y-2">
                  <Progress value={imageUploadProgress} />
                  <p className="text-sm text-gray-400">Uploading: {imageUploadProgress}%</p>
                </div>
              )}

              <Button onClick={handleImageUpload} disabled={isImageUploading}>
                {isImageUploading ? "Uploading..." : "Upload Image"}
              </Button>
            </CardContent>
          </Card>

          {/* Video Upload */}
          <Card className="bg-gray-800/80 border border-gray-700/50">
            <CardHeader><CardTitle>Upload Video</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.size > 30 * 1024 * 1024) { // 30MB
                    toast({ title: "Error", description: "Video must be less than 30MB" });
                    e.target.value = ""; // reset input
                    return;
                  }
                  if (videoPreview) URL.revokeObjectURL(videoPreview);
                  setNewVideo(file);
                  setVideoPreview(file ? URL.createObjectURL(file) : null);
                }}
                disabled={isVideoUploading}
              />

              {/* Video Preview Container */}
              <div className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-4 flex items-center justify-center">
                {videoPreview ? (
                  <video src={videoPreview} className="max-h-60 rounded-lg object-contain" controls muted />
                ) : (
                  <p className="text-gray-500 italic">No preview available</p>
                )}
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-blue-300" />
                <Input
                  type="date"
                  value={videoDate}
                  onChange={(e) => setVideoDate(e.target.value)}
                  disabled={isVideoUploading}
                  className="pl-10"
                />
              </div>

              {isVideoUploading && (
                <div className="space-y-2">
                  <Progress value={videoUploadProgress} />
                  <p className="text-sm text-gray-400">Uploading: {videoUploadProgress}%</p>
                </div>
              )}

              <Button onClick={handleVideoUpload} disabled={isVideoUploading}>
                {isVideoUploading ? "Uploading..." : "Upload Video"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Section */}
        <TabsContent value="manage" className="space-y-6">
          {/* Images */}
          <Card className="bg-gray-800/80 border border-gray-700/50">
            <CardHeader><CardTitle>Images</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.length === 0 ? (
                <p className="text-center text-gray-400 col-span-full">No images uploaded</p>
              ) : (
                images.map((img) => (
                  <div key={img.id} className="relative bg-gray-900/30 border border-gray-700/50 rounded-lg p-2">
                    <img src={img.url} alt="Gallery image" className="w-full h-40 object-cover rounded-md" />
                    <p className="text-sm text-gray-400 mt-2">
                      {new Date(img.uploadedAt).toLocaleDateString()}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleDeleteImage(img.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Videos */}
          <Card className="bg-gray-800/80 border border-gray-700/50">
            <CardHeader><CardTitle>Videos</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.length === 0 ? (
                <p className="text-center text-gray-400 col-span-full">No videos uploaded</p>
              ) : (
                videos.map((vid) => (
                  <div key={vid.id} className="relative bg-gray-900/30 border border-gray-700/50 rounded-lg p-2">
                    <video src={vid.url} className="w-full h-40 object-cover rounded-md" muted controls />
                    <p className="text-sm text-gray-400 mt-2">
                      {new Date(vid.uploadedAt).toLocaleDateString()}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleDeleteVideo(vid.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
