import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2, X, CheckSquare, Square } from "lucide-react";

type MediaItem = { id: string; url: string; uploadedAt: Date };

export default function AdminGalleryPage() {
  const { toast } = useToast();

  // --- Data State ---
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);

  // --- Selection State (Management) ---
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);

  // --- Form State (Uploads) ---
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [imageDate, setImageDate] = useState<string>("");
  const [videoDate, setVideoDate] = useState<string>("");

  // --- Progress & Status ---
  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);

  // --- Refs for Cancellation ---
  const activeImageXHRs = useRef<XMLHttpRequest[]>([]);
  const activeVideoXHRs = useRef<XMLHttpRequest[]>([]);

  // --- Sorting Logic (Newest First) ---
  const sortedImages = [...images].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  const sortedVideos = [...videos].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  // --- Filter State ---
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  // Helper arrays for the dropdowns
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

// Calculates the difference between now and 1998 to fill the menu automatically
const startYear = 1998;
const currentYear = new Date().getFullYear();
const years = Array.from(
  { length: currentYear - startYear + 1 }, 
  (_, i) => (currentYear - i).toString()
);
  // --- Updated Sorting & Filtering Logic ---
  const filteredImages = sortedImages.filter((img) => {
    const date = new Date(img.uploadedAt);
    const matchMonth = filterMonth === "all" || date.getMonth().toString() === filterMonth;
    const matchYear = filterYear === "all" || date.getFullYear().toString() === filterYear;
    return matchMonth && matchYear;
  });

  const filteredVideos = sortedVideos.filter((vid) => {
    const date = new Date(vid.uploadedAt);
    const matchMonth = filterMonth === "all" || date.getMonth().toString() === filterMonth;
    const matchYear = filterYear === "all" || date.getFullYear().toString() === filterYear;
    return matchMonth && matchYear;
  });
  // --- Load Initial Data ---
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

  // --- Prevent Page Reload/Close during Upload ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If either images or videos are currently uploading
      if (isImageUploading || isVideoUploading) {
        e.preventDefault();
        // Most modern browsers ignore the custom string and show a generic message
        e.returnValue = "Upload in progress. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isImageUploading, isVideoUploading]);

  // --- Cleanup Previews ---
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      videoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews, videoPreviews]);
  // --- Cancellation Handlers ---
  const cancelImageUpload = () => {
    activeImageXHRs.current.forEach(xhr => xhr.abort());
    activeImageXHRs.current = [];
    setIsImageUploading(false);
    setImageUploadProgress(0);
    toast({ title: "Cancelled", description: "Image upload stopped." });
  };

  const cancelVideoUpload = () => {
    activeVideoXHRs.current.forEach(xhr => xhr.abort());
    activeVideoXHRs.current = [];
    setIsVideoUploading(false);
    setVideoUploadProgress(0);
    toast({ title: "Cancelled", description: "Video upload stopped." });
  };
  // --- Resets ---
  const resetImageForm = useCallback(() => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImagePreviews([]);
    setImageDate("");
    setImageUploadProgress(0);
    setIsImageUploading(false);
    activeImageXHRs.current = [];
  }, [imagePreviews]);

  const resetVideoForm = useCallback(() => {
    videoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedVideos([]);
    setVideoPreviews([]);
    setVideoDate("");
    setVideoUploadProgress(0);
    setIsVideoUploading(false);
    activeVideoXHRs.current = [];
  }, [videoPreviews]);

  // --- Selection Handlers ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024); // 5MB
    const newPreviews = validFiles.map(f => URL.createObjectURL(f));
    setSelectedImages(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const validFiles = files.filter(f => f.size <= 2000 * 1024 * 1024); // 2GB
    const newPreviews = validFiles.map(f => URL.createObjectURL(f));
    setSelectedVideos(prev => [...prev, ...validFiles]);
    setVideoPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeSelectedImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeSelectedVideo = (index: number) => {
    URL.revokeObjectURL(videoPreviews[index]);
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- Sequential Upload Logic ---
  const handleBatchUpload = async (type: 'image' | 'video') => {
    const files = type === 'image' ? selectedImages : selectedVideos;
    const date = type === 'image' ? imageDate : videoDate;
    const endpoint = type === 'image' ? "/api/gallery/images" : "/api/gallery/videos";
    const setProgress = type === 'image' ? setImageUploadProgress : setVideoUploadProgress;
    const setIsUploading = type === 'image' ? setIsImageUploading : setIsVideoUploading;
    const activeRefs = type === 'image' ? activeImageXHRs : activeVideoXHRs;

    if (files.length === 0 || !date) {
      toast({ title: "Error", description: "Select files and a date" });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    activeRefs.current = [];

    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    let uploadedBytesTotal = 0;

    try {
      for (const file of files) {
        await new Promise<void>((resolve, reject) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("uploadedAt", new Date(date).toISOString());

          const xhr = new XMLHttpRequest();
          activeRefs.current.push(xhr);
          xhr.open("POST", endpoint, true);
          xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("adminToken")}`);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round(((uploadedBytesTotal + e.loaded) / totalBytes) * 100);
              setProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              const data = JSON.parse(xhr.responseText);
              const newItem = { id: data.id, url: data.url, uploadedAt: new Date(data.uploadedAt) };
              type === 'image' ? setImages(p => [...p, newItem]) : setVideos(p => [...p, newItem]);
              uploadedBytesTotal += file.size;
              resolve();
            } else reject();
          };
          xhr.onerror = reject;
          xhr.onabort = () => reject("ABORTED");
          xhr.send(formData);
        });
      }
      toast({ title: "Success", description: `All ${type}s uploaded.` });
      type === 'image' ? resetImageForm() : resetVideoForm();
    } catch (e) {
      if (e !== "ABORTED") toast({ title: "Error", description: "Upload failed", variant: "destructive" });
      setIsUploading(false);
    }
  };

  // --- Deletion Logic ---
  const handleDelete = async (id: string, type: 'image' | 'video') => {
    if (!window.confirm("Permanently delete?")) return;
    const res = await fetch(`/api/gallery/${type}s/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    });
    if (res.ok) {
      type === 'image' ? setImages(p => p.filter(i => i.id !== id)) : setVideos(p => p.filter(v => v.id !== id));
      toast({ title: "Deleted" });
    }
  };

  const handleBulkDelete = async (type: 'image' | 'video') => {
    const ids = type === 'image' ? selectedImageIds : selectedVideoIds;
    if (!window.confirm(`Delete ${ids.length} items?`)) return;

    await Promise.all(ids.map(id => fetch(`/api/gallery/${type}s/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })));

    type === 'image' ? setImages(p => p.filter(i => !ids.includes(i.id))) : setVideos(p => p.filter(v => !ids.includes(v.id)));
    type === 'image' ? setSelectedImageIds([]) : setSelectedVideoIds([]);
    toast({ title: "Bulk delete successful" });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-6 text-gray-100">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Gallery Section</h1>
        <Button
          variant="outline"
          onClick={() => {
            if ((isImageUploading || isVideoUploading) &&
              !window.confirm("Upload in progress. Leave anyway?")) {
              return;
            }
            window.location.href = "/admin";
          }}
        >
          Back To Dashboard
        </Button>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="bg-gray-800 mb-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Upload Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader><CardTitle>Images</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input type="file" multiple accept="image/*" onChange={handleImageSelect} disabled={isImageUploading} />
              <div className="grid grid-cols-4 gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative"><img src={src} className="h-16 w-full object-cover rounded" /><X className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full cursor-pointer" onClick={() => removeSelectedImage(i)} /></div>
                ))}
              </div>
              <Input type="date" value={imageDate} onChange={e => setImageDate(e.target.value)} />
              {isImageUploading && <Progress value={imageUploadProgress} />}
              <div className="flex gap-2">
                <Button
                  className="w-full"
                  onClick={() => handleBatchUpload('image')}
                  disabled={isImageUploading || !selectedImages.length}
                >
                  {isImageUploading ? "Uploading..." : "Upload Images"}
                </Button>

                {isImageUploading && (
                  <Button variant="destructive" onClick={cancelImageUpload}>
                    Cancel
                  </Button>
                )}
              </div>            </CardContent>
          </Card>

          {/* Video Upload Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader><CardTitle>Videos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input type="file" multiple accept="video/*" onChange={handleVideoSelect} disabled={isVideoUploading} />
              <div className="grid grid-cols-3 gap-2">
                {videoPreviews.map((src, i) => (
                  <div key={i} className="relative"><video src={src} className="h-40 w-full object-cover rounded" controls /><X className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full cursor-pointer" onClick={() => removeSelectedVideo(i)} /></div>
                ))}
              </div>
              <Input type="date" value={videoDate} onChange={e => setVideoDate(e.target.value)} />
              {isVideoUploading && <Progress value={videoUploadProgress} />}
              <div className="flex gap-2">
                <Button
                  className="w-full"
                  onClick={() => handleBatchUpload('video')}
                  disabled={isVideoUploading || !selectedVideos.length}
                >
                  {isVideoUploading ? "Uploading..." : "Upload Videos"}
                </Button>

                {isVideoUploading && (
                  <Button variant="destructive" onClick={cancelVideoUpload}>
                    Cancel
                  </Button>
                )}
              </div>            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
  {/* DATE FILTERS */}
  <Card className="bg-gray-800 border-gray-700">
    <CardContent className="pt-6">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-400">Month</label>
          <select 
            className="bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="all">All Months</option>
            {months.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-400">Year</label>
          <select 
            className="bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {(filterMonth !== "all" || filterYear !== "all") && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setFilterMonth("all"); setFilterYear("all"); }}
            className="text-blue-400 hover:text-blue-300"
          >
            Reset Filters
          </Button>
        )}
      </div>
    </CardContent>
  </Card>

  {/* Images Management */}
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Manage Images ({filteredImages.length})</CardTitle>
      {selectedImageIds.length > 0 && (
        <Button variant="destructive" size="sm" onClick={() => handleBulkDelete('image')}>
          Delete Selected ({selectedImageIds.length})
        </Button>
      )}
    </CardHeader>
    <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {filteredImages.length === 0 ? (
        <p className="text-gray-500 col-span-full py-10 text-center">No images match this filter.</p>
      ) : (
        filteredImages.map(img => (
          <div key={img.id} className={`relative p-1 rounded-lg border-2 transition-all ${selectedImageIds.includes(img.id) ? 'border-blue-500 bg-blue-900/20' : 'border-transparent bg-gray-900'}`}>
            <div className="absolute top-1 left-1 z-10 cursor-pointer" onClick={() => setSelectedImageIds(prev => prev.includes(img.id) ? prev.filter(id => id !== img.id) : [...prev, img.id])}>
              {selectedImageIds.includes(img.id) ? <CheckSquare className="text-blue-500 w-5 h-5" /> : <Square className="text-gray-500 w-5 h-5" />}
            </div>
            <img src={img.url} className="h-24 w-full object-cover rounded" alt="Gallery" />
            <div className="flex justify-between items-center mt-1 px-1">
              <span className="text-[10px] text-gray-400">{new Date(img.uploadedAt).toLocaleDateString()}</span>
              <Trash2 className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-400" onClick={() => handleDelete(img.id, 'image')} />
            </div>
          </div>
        ))
      )}
    </CardContent>
  </Card>

  {/* Videos Management */}
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Manage Videos ({filteredVideos.length})</CardTitle>
      {selectedVideoIds.length > 0 && (
        <Button variant="destructive" size="sm" onClick={() => handleBulkDelete('video')}>
          Delete Selected ({selectedVideoIds.length})
        </Button>
      )}
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {filteredVideos.length === 0 ? (
        <p className="text-gray-500 col-span-full py-10 text-center">No videos match this filter.</p>
      ) : (
        filteredVideos.map(vid => (
          <div key={vid.id} className={`relative p-1 rounded-lg border-2 transition-all ${selectedVideoIds.includes(vid.id) ? 'border-blue-500 bg-blue-900/20' : 'border-transparent bg-gray-900'}`}>
            <div className="absolute top-2 left-2 z-10 cursor-pointer" onClick={() => setSelectedVideoIds(prev => prev.includes(vid.id) ? prev.filter(id => id !== vid.id) : [...prev, vid.id])}>
              {selectedVideoIds.includes(vid.id) ? <CheckSquare className="text-blue-500 w-6 h-6" /> : <Square className="text-gray-500 w-6 h-6" />}
            </div>
            <video src={vid.url} className="h-32 w-full object-cover rounded" muted controls />
            <div className="flex justify-between items-center mt-2 px-1">
              <span className="text-xs text-gray-400">{new Date(vid.uploadedAt).toLocaleDateString()}</span>
              <Trash2 className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-400" onClick={() => handleDelete(vid.id, 'video')} />
            </div>
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