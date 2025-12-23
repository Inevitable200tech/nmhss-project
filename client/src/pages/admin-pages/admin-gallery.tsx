import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2, X, CheckSquare, Square, Film, Calendar } from "lucide-react";

type MediaItem = { id: string; url: string; uploadedAt: Date };

export default function AdminGalleryPage() {
  const { toast } = useToast();

  // --- Data State ---
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);

  // --- Selection State (Management) ---
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);

  // --- Upload State ---
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [imageDate, setImageDate] = useState<string>("");
  const [videoDate, setVideoDate] = useState<string>("");

  // --- Progress State ---
  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);

  // --- Refs for Cancellation & Rollback ---
  const activeImageXHRs = useRef<XMLHttpRequest[]>([]);
  const activeVideoXHRs = useRef<XMLHttpRequest[]>([]);
  const currentBatchImageIds = useRef<string[]>([]);
  const currentBatchVideoIds = useRef<string[]>([]);
  // 1. Add these lockout states at the top of your component
  const [isImageLocked, setIsImageLocked] = useState(false);
  const [isVideoLocked, setIsVideoLocked] = useState(false);

  // --- Filter State ---
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  const MAX_IMAGES = 10;
  const MAX_VIDEOS = 5;

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Array.from({ length: new Date().getFullYear() - 1998 + 1 }, (_, i) => (new Date().getFullYear() - i).toString());

  // --- Load Data ---
  useEffect(() => {
    const loadGallery = async () => {
      try {
        const res = await fetch("/api/gallery");
        const data = await res.json();
        setImages(data.images || []);
        setVideos(data.videos || []);
      } catch {
        toast({ title: "Error", description: "Failed to load gallery", variant: "destructive" });
      }
    };
    loadGallery();
  }, []);

  // --- Selection Handlers ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedImages.length + files.length > MAX_IMAGES) {
      toast({ title: "Limit Reached", description: `Max ${MAX_IMAGES} images allowed.`, variant: "destructive" });
      return;
    }
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setSelectedImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedVideos.length + files.length > MAX_VIDEOS) {
      toast({ title: "Limit Reached", description: `Max ${MAX_VIDEOS} videos allowed.`, variant: "destructive" });
      return;
    }
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setSelectedVideos(prev => [...prev, ...files]);
    setVideoPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  // --- Rollback & Cancel ---
  const rollbackUploadedItems = async (type: 'image' | 'video') => {
    const idsToRollback = type === 'image' ? currentBatchImageIds.current : currentBatchVideoIds.current;
    if (idsToRollback.length === 0) return;
    try {
      await Promise.all(idsToRollback.map(id =>
        fetch(`/api/gallery/${type}s/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        })
      ));
      if (type === 'image') setImages(p => p.filter(img => !idsToRollback.includes(img.id)));
      else setVideos(p => p.filter(vid => !idsToRollback.includes(vid.id)));
    } catch (err) { console.error("Rollback failed", err); }
  };



  const handleCancelUpload = async (type: 'image' | 'video') => {
    // FIRST: Immediate UI feedback
    if (type === 'image') {
      setIsImageUploading(false); // Instantly hide progress
      setIsImageLocked(true);     // Instantly disable buttons
    } else {
      setIsVideoUploading(false);
      setIsVideoLocked(true);
    }

    // SECOND: Stop network requests
    const refs = type === 'image' ? activeImageXHRs : activeVideoXHRs;
    refs.current.forEach(xhr => xhr.abort());
    refs.current = [];

    // THIRD: Background cleanup (The slow part)
    await rollbackUploadedItems(type);

    // FOURTH: Reset progress and start the 2s timer
    if (type === 'image') {
      setImageUploadProgress(0);
      currentBatchImageIds.current = [];
      setTimeout(() => setIsImageLocked(false), 2000);
    } else {
      setVideoUploadProgress(0);
      currentBatchVideoIds.current = [];
      setTimeout(() => setIsVideoLocked(false), 2000);
    }

    toast({ title: "Cancelled", description: "Cleanup complete. Upload disabled for 2s." });
  };

  // --- Upload Logic ---
  const handleBatchUpload = async (type: 'image' | 'video') => {
    const files = type === 'image' ? selectedImages : selectedVideos;
    const date = type === 'image' ? imageDate : videoDate;
    const setIsUploading = type === 'image' ? setIsImageUploading : setIsVideoUploading;
    const setProgress = type === 'image' ? setImageUploadProgress : setVideoUploadProgress;
    const activeRefs = type === 'image' ? activeImageXHRs : activeVideoXHRs;
    const batchTracker = type === 'image' ? currentBatchImageIds : currentBatchVideoIds;

    if (!files.length || !date) return toast({ title: "Error", description: "Select files and date." });

    setIsUploading(true);
    setProgress(0);
    batchTracker.current = [];

    let uploadedBytes = 0;
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

    try {
      for (const file of files) {
        await new Promise<void>((resolve, reject) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("uploadedAt", new Date(date).toISOString());

          const xhr = new XMLHttpRequest();
          activeRefs.current.push(xhr);
          xhr.open("POST", type === 'image' ? "/api/gallery/images" : "/api/gallery/videos", true);
          xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("adminToken")}`);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const totalPercent = Math.round(((uploadedBytes + e.loaded) / totalBytes) * 100);
              setProgress(totalPercent);
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              const data = JSON.parse(xhr.responseText);
              batchTracker.current.push(data.id);
              const newItem = { id: data.id, url: data.url, uploadedAt: new Date(data.uploadedAt) };
              type === 'image' ? setImages(p => [...p, newItem]) : setVideos(p => [...p, newItem]);
              uploadedBytes += file.size;
              resolve();
            } else reject();
          };
          xhr.onerror = reject;
          xhr.onabort = () => reject("ABORTED");
          xhr.send(formData);
        });
      }
      toast({ title: "Success", description: "Upload complete." });
      type === 'image' ? resetImageForm() : resetVideoForm();
    } catch (e) {
      if (e !== "ABORTED") toast({ title: "Error", description: "Upload failed.", variant: "destructive" });
      setIsUploading(false);
    }
  };

  const resetImageForm = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImagePreviews([]);
    setImageDate("");
    setImageUploadProgress(0);
    setIsImageUploading(false);
  };

  const resetVideoForm = () => {
    videoPreviews.forEach(url => URL.revokeObjectURL(url));
    setSelectedVideos([]);
    setVideoPreviews([]);
    setVideoDate("");
    setVideoUploadProgress(0);
    setIsVideoUploading(false);
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

  // --- Filtering ---
  const filteredImages = images.filter(img => {
    const d = new Date(img.uploadedAt);
    return (filterMonth === "all" || d.getMonth().toString() === filterMonth) && (filterYear === "all" || d.getFullYear().toString() === filterYear);
  }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  const filteredVideos = videos.filter(vid => {
    const d = new Date(vid.uploadedAt);
    return (filterMonth === "all" || d.getMonth().toString() === filterMonth) && (filterYear === "all" || d.getFullYear().toString() === filterYear);
  }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 space-y-6 text-gray-100">
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.7;
          cursor: pointer;
        }
      `}</style>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Gallery</h1>
        <Button variant="outline" onClick={() => window.location.href = "/admin"}>Dashboard</Button>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="bg-gray-800 mb-6">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="manage">Manage Library</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* IMAGE UPLOAD */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader><CardTitle>Images ({selectedImages.length}/{MAX_IMAGES})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input type="file" multiple accept="image/*" onChange={handleImageSelect} disabled={isImageUploading || isImageLocked} className="bg-gray-900" />
              <div className="grid grid-cols-5 gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={src} className="h-full w-full object-cover rounded border border-gray-600" />
                    <button onClick={() => {
                      setImagePreviews(p => p.filter((_, idx) => idx !== i));
                      setSelectedImages(p => p.filter((_, idx) => idx !== i));
                    }} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
              <Input type="date" value={imageDate} onChange={e => setImageDate(e.target.value)} className="bg-gray-900" />
              {isImageUploading && <Progress value={imageUploadProgress} className="h-2" />}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleBatchUpload('image')} disabled={isImageUploading || !selectedImages.length || isImageLocked}>Upload</Button>
                {isImageUploading && <Button variant="destructive" onClick={() => handleCancelUpload('image')}>Cancel</Button>}
              </div>
            </CardContent>
          </Card>

          {/* VIDEO UPLOAD */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader><CardTitle>Videos ({selectedVideos.length}/{MAX_VIDEOS})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input type="file" multiple accept="video/*" onChange={handleVideoSelect} disabled={isVideoUploading || isVideoLocked} className="bg-gray-900" />
              <div className={`grid gap-3 ${videoPreviews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {videoPreviews.map((src, i) => (
                  <div key={i} className="relative bg-black rounded-lg overflow-hidden border border-gray-700">
                    <video src={src} className="w-full aspect-video object-cover" controls playsInline muted />
                    <button onClick={() => {
                      setVideoPreviews(p => p.filter((_, idx) => idx !== i));
                      setSelectedVideos(p => p.filter((_, idx) => idx !== i));
                    }} className="absolute top-2 right-2 z-10 bg-red-500 p-1 rounded-full shadow-lg hover:bg-red-600">
                      <X className="w-6 h-6 text-white" />
                    </button>
                  </div>
                ))}
              </div>
              <Input type="date" value={videoDate} onChange={e => setVideoDate(e.target.value)} className="bg-gray-900" />
              {isVideoUploading && <Progress value={videoUploadProgress} className="h-2" />}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleBatchUpload('video')} disabled={isVideoUploading || !selectedVideos.length || isVideoLocked}>Upload</Button>
                {isVideoUploading && <Button variant="destructive" onClick={() => handleCancelUpload('video')}>Cancel</Button>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Filters */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="py-4 flex flex-wrap gap-4">
              <select className="bg-gray-900 border-gray-700 p-2 rounded text-sm" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                <option value="all">All Months</option>
                {months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
              </select>
              <select className="bg-gray-900 border-gray-700 p-2 rounded text-sm" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                <option value="all">All Years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </CardContent>
          </Card>

          {/* Manage Images */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Images ({filteredImages.length})</CardTitle>
              {selectedImageIds.length > 0 && <Button variant="destructive" size="sm" onClick={() => handleBulkDelete('image')}>Delete Selected ({selectedImageIds.length})</Button>}
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredImages.map(img => (
                <div key={img.id} className={`relative p-1 rounded-lg border-2 transition-all ${selectedImageIds.includes(img.id) ? 'border-blue-500 bg-blue-900/20' : 'border-transparent bg-gray-900'}`}>
                  <div className="absolute top-1 left-1 z-10 cursor-pointer" onClick={() => setSelectedImageIds(p => p.includes(img.id) ? p.filter(id => id !== img.id) : [...p, img.id])}>
                    {selectedImageIds.includes(img.id) ? <CheckSquare className="text-blue-500 w-5 h-5" /> : <Square className="text-gray-500 w-5 h-5" />}
                  </div>
                  <img src={img.url} className="h-24 w-full object-cover rounded" />
                  <div className="flex justify-between items-center mt-1 px-1">
                    <span className="text-[10px] text-gray-400">{new Date(img.uploadedAt).toLocaleDateString()}</span>
                    <Trash2 className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-400" onClick={() => handleDelete(img.id, 'image')} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Manage Videos */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Videos ({filteredVideos.length})</CardTitle>
              {selectedVideoIds.length > 0 && <Button variant="destructive" size="sm" onClick={() => handleBulkDelete('video')}>Delete Selected ({selectedVideoIds.length})</Button>}
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredVideos.map(vid => (
                <div key={vid.id} className={`relative p-1 rounded-lg border-2 transition-all ${selectedVideoIds.includes(vid.id) ? 'border-blue-500 bg-blue-900/20' : 'border-transparent bg-gray-900'}`}>
                  <div className="absolute top-2 left-2 z-10 cursor-pointer" onClick={() => setSelectedVideoIds(p => p.includes(vid.id) ? p.filter(id => id !== vid.id) : [...p, vid.id])}>
                    {selectedVideoIds.includes(vid.id) ? <CheckSquare className="text-blue-500 w-6 h-6 shadow-md" /> : <Square className="text-gray-500 w-6 h-6 shadow-md" />}
                  </div>
                  <video src={vid.url} className="h-32 w-full object-cover rounded" controls playsInline muted />
                  <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-xs text-gray-400">{new Date(vid.uploadedAt).toLocaleDateString()}</span>
                    <Trash2 className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-400" onClick={() => handleDelete(vid.id, 'video')} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}