import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress"; // Ensure this is installed via shadcn
import { Trash2, Loader2, Check, X, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StudentMedia = {
    id: string;
    mediaId: string;
    url: string;
    type: "image" | "video";
    batch: "+1" | "+2";
    year: number;
    description?: string;
};

type PendingMedia = {
    tempId: string;
    filename: string;
    type: "image" | "video";
    batch: "+1" | "+2";
    year: number;
    description?: string;
};

export default function AdminStudentsPage() {
    // --- State: Data Lists ---
    const [items, setItems] = useState<StudentMedia[]>([]);
    const [pendingUploads, setPendingUploads] = useState<PendingMedia[]>([]);

    // --- State: Loaders & Progress ---
    const [isLoading, setIsLoading] = useState(false);
    const [isPendingLoading, setIsPendingLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    // --- Ref for Cancellation ---
    const abortControllerRef = useRef<AbortController | null>(null);

    // --- State: Upload Forms ---
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageBatch, setImageBatch] = useState<string>("");
    const [imageYear, setImageYear] = useState<string>("");
    const [imageDescription, setImageDescription] = useState("");

    const [videoFiles, setVideoFiles] = useState<File[]>([]);
    const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
    const [videoBatch, setVideoBatch] = useState<string>("");
    const [videoYear, setVideoYear] = useState<string>("");
    const [videoDescription, setVideoDescription] = useState("");

    // --- State: Filters ---
    const [filterBatch, setFilterBatch] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterYear, setFilterYear] = useState("");

    const { toast } = useToast();
    const { playHoverSound, playErrorSound, playSuccessSound } = useSound();
    const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

    // --- Helpers ---
    const removeImage = (index: number) => {
        if (isUploading) return;
        URL.revokeObjectURL(imagePreviews[index]);
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeVideo = (index: number) => {
        if (isUploading) return;
        URL.revokeObjectURL(videoPreviews[index]);
        setVideoFiles(prev => prev.filter((_, i) => i !== index));
        setVideoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const cancelUpload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsUploading(false);
            setUploadProgress(0);
            toast({ title: "Cancelled", description: "Upload process stopped." });
            playSuccessSound();
        }
    };

    // --- Data Fetching ---
    const loadMedia = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterBatch) params.set("batch", filterBatch);
            if (filterType) params.set("type", filterType);
            if (filterYear) params.set("year", filterYear);

            const res = await fetch(`/api/students?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const loadPending = async () => {
        setIsPendingLoading(true);
        try {
            const res = await fetch("/api/admin/pending-uploads", {
                headers: { Authorization: `Bearer ${adminToken}`, "X-Requested-With": "SchoolConnect-App" },
            });
            if (res.ok) {
                const data = await res.json();
                setPendingUploads(data);
            }
        } finally {
            setIsPendingLoading(false);
        }
    };

    // --- Actions ---
    const approveUpload = async (tempId: string) => {
        const confirmed = window.confirm("Approve this pending upload?");
        if (!confirmed) return;
        setApprovingId(tempId);
        try {
            const res = await fetch(`/api/admin/approve-upload/${tempId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${adminToken}`, "X-Requested-With": "SchoolConnect-App" },
            });
            if (res.ok) {
                setPendingUploads((prev) => prev.filter(u => u.tempId !== tempId));
                toast({ title: "Approved", description: "Upload approved successfully." });
                playSuccessSound();
                loadMedia();
            } else {
                toast({ variant: "destructive", title: "Error", description: "Failed to approve." });
                playErrorSound();
            }
        } finally {
            setApprovingId(null);
        }
    };

    const disapproveUpload = async (tempId: string) => {
        if (!window.confirm("Reject and delete this pending upload?")) return;
        const res = await fetch(`/api/admin/disapprove-upload/${tempId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${adminToken}`, "X-Requested-With": "SchoolConnect-App" },
        });
        if (res.ok) {
            setPendingUploads(prev => prev.filter(u => u.tempId !== tempId));
            toast({ title: "Removed", description: "Upload disapproved." });
            playSuccessSound();
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("⚠️ This will delete the media from storage and database. Continue?")) return;
        const res = await fetch(`/api/admin-students/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${adminToken}`, "X-Requested-With": "SchoolConnect-App" },
        });
        if (res.ok) {
            setItems((prev) => prev.filter((m) => m.id !== id));
            toast({ title: "Deleted", description: "Media permanently removed." });
            playSuccessSound();
        } else {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete media." });
            playErrorSound();
        }
    };

    // --- Lifecycle ---
    useEffect(() => {
        loadMedia();
        loadPending();
    }, [filterBatch, filterType, filterYear]);

    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
            videoPreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isUploading) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isUploading]);

    // --- Handlers ---
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newFiles = Array.from(files);
        setImageFiles((prev) => [...prev, ...newFiles]);
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setImagePreviews((prev) => [...prev, ...newPreviews]);
        e.target.value = "";
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newFiles = Array.from(files);
        setVideoFiles((prev) => [...prev, ...newFiles]);
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setVideoPreviews((prev) => [...prev, ...newPreviews]);
        e.target.value = "";
    };

    const isImageFormValid = imageFiles.length > 0 && imageBatch && imageYear.length === 4;
    const isVideoFormValid = videoFiles.length > 0 && videoBatch && videoYear.length === 4;

    const uploadMedia = async (files: File[], batch: string, year: string, description: string, type: "image" | "video") => {
        if (!window.confirm(`Upload ${files.length} item(s) now?`)) return;

        setIsUploading(true);
        setUploadProgress(0);
        abortControllerRef.current = new AbortController();

        let successCount = 0;
        const totalFiles = files.length;
        const uploadedMediaIds: string[] = [];

        try {
            

            for (let i = 0; i < totalFiles; i++) {
                if (abortControllerRef.current?.signal.aborted) throw new Error("AbortError");

                const file = files[i];
                const formData = new FormData();
                formData.append("file", file);

                // STEP 1: UPLOAD TO R2
                const mediaRes = await fetch("/api/media", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${adminToken}`, "X-Requested-With": "SchoolConnect-App" },
                    body: formData,
                    signal: abortControllerRef.current.signal
                });

                if (!mediaRes.ok) continue;
                const media = await mediaRes.json();
                uploadedMediaIds.push(media.id); // Captured! Even if we cancel now, we know to delete this.

                // --- 2. THE 5-SECOND "STAGING" DELAY ---
                // File is in R2, but not yet in StudentMedia.
                

                // STEP 2: CREATE DATABASE ENTRY
                const res = await fetch("/api/admin-students", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}`, "X-Requested-With": "SchoolConnect-App" },
                    body: JSON.stringify({
                        mediaId: media.id,
                        url: media.url,
                        type,
                        batch,
                        year: parseInt(year),
                        description
                    }),
                    signal: abortControllerRef.current.signal
                });

                if (res.ok) {
                    const result = await res.json();
                    setItems((prev) => [result.studentMedia, ...prev]);
                    successCount++;
                }

                setUploadProgress(((i + 1) / totalFiles) * 100);
            }

            toast({ title: "Done", description: `Uploaded ${successCount}/${totalFiles} items.` });
            playSuccessSound();
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message === 'AbortError') {
                if (uploadedMediaIds.length > 0) {
                    toast({ title: "Cleaning up...", description: "Removing files from R2 storage." });
                    playSuccessSound();
                    // This will hit your /api/media/:id delete route
                    await Promise.all(uploadedMediaIds.map(id =>
                        fetch(`/api/media/${id}`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${adminToken}`, "X-Requested-With": "SchoolConnect-App" },
                        })
                    ));
                }
                toast({ title: "Cancelled", description: "Process stopped and storage scrubbed." });
                playErrorSound();
            } else {
                toast({ variant: "destructive", title: "Error", description: "Process failed." });
                playErrorSound();
            }
        } finally {
            setIsUploading(false);
            abortControllerRef.current = null;
        }
    };

    return (
        <div className="min-h-screen p-6 bg-gray-900 text-gray-100 space-y-6">
            <h1 className="text-3xl font-bold">Admin – Students Media</h1>
            <a
                href="/admin"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
                onMouseEnter={playHoverSound}
            >
                Go Back To Dashboard
            </a>

            <Tabs defaultValue="upload" className="w-full">
                <TabsList className="bg-gray-800">
                    <TabsTrigger value="upload" onMouseEnter={playHoverSound}>Upload Media</TabsTrigger>
                    <TabsTrigger value="manage" onClick={loadMedia} onMouseEnter={playHoverSound}>Manage Media</TabsTrigger>
                    <TabsTrigger value="pending" onClick={loadPending} onMouseEnter={playHoverSound}>Pending Uploads</TabsTrigger>
                </TabsList>

                {/* Upload Section */}
                <TabsContent value="upload">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Image Upload Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle>Upload Images</CardTitle>
                                {imageFiles.length > 0 && !isUploading && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive h-8 px-2"
                                        onClick={() => {
                                            imagePreviews.forEach(url => URL.revokeObjectURL(url));
                                            setImageFiles([]);
                                            setImagePreviews([]);
                                        }}
                                        onMouseEnter={playHoverSound}
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    disabled={isUploading}
                                    onChange={handleImageSelect}
                                />

                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-muted/30">
                                        {imagePreviews.map((url, index) => (
                                            <div key={index} className="relative group aspect-square">
                                                <img
                                                    src={url}
                                                    className="h-full w-full object-cover rounded-md shadow-sm"
                                                    alt={`Preview ${index}`}
                                                />
                                                {!isUploading && (
                                                    <button
                                                        onClick={() => removeImage(index)}
                                                        className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors"
                                                        onMouseEnter={playHoverSound}
                                                    >
                                                        <X className="h-6 w-6" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {/* UPDATED: Image Batch Select */}
                                    <Select 
                                        value={imageBatch} 
                                        onValueChange={setImageBatch}
                                        disabled={isUploading}
                                    >
                                        <SelectTrigger onMouseEnter={playHoverSound}>
                                            <SelectValue placeholder="Select Batch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="+1" onMouseEnter={playHoverSound}>+1</SelectItem>
                                            <SelectItem value="+2" onMouseEnter={playHoverSound}>+2</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        placeholder="Year (YYYY)"
                                        type="number"
                                        value={imageYear}
                                        disabled={isUploading}
                                        onChange={(e) => setImageYear(e.target.value)}
                                    />
                                </div>
                                <Textarea
                                    placeholder="Common description for this batch"
                                    value={imageDescription}
                                    disabled={isUploading}
                                    onChange={(e) => setImageDescription(e.target.value)}
                                />

                                <div className="space-y-2">
                                    {!isUploading ? (
                                        <Button
                                            className="w-full"
                                            disabled={!isImageFormValid}
                                            onClick={() => uploadMedia(imageFiles, imageBatch, imageYear, imageDescription, "image")}
                                            onMouseEnter={playHoverSound}
                                        >
                                            Upload {imageFiles.length} Image{imageFiles.length === 1 ? "" : "s"}
                                        </Button>
                                    ) : (
                                        imageFiles.length > 0 && (
                                            <Button
                                                variant="outline"
                                                className="w-full border-destructive text-destructive hover:bg-destructive/10"
                                                onClick={cancelUpload}
                                                onMouseEnter={playHoverSound}
                                            >
                                                <Ban className="mr-2 h-4 w-4" />
                                                Cancel Upload
                                            </Button>
                                        )
                                    )}

                                    {isUploading && imageFiles.length > 0 && (
                                        <div className="space-y-1 pt-2">
                                            <Progress value={uploadProgress} className="h-2" />
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center">
                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processing
                                                </p>
                                                <p className="text-xs font-medium text-primary">
                                                    {Math.round(uploadProgress)}%
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Video Upload Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle>Upload Videos</CardTitle>
                                {videoFiles.length > 0 && !isUploading && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive h-8 px-2"
                                        onClick={() => {
                                            videoPreviews.forEach(url => URL.revokeObjectURL(url));
                                            setVideoFiles([]);
                                            setVideoPreviews([]);
                                        }}
                                        onMouseEnter={playHoverSound}
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    type="file"
                                    accept="video/*"
                                    multiple
                                    disabled={isUploading}
                                    onChange={handleVideoSelect}
                                />

                                {videoPreviews.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-muted/30">
                                        {videoPreviews.map((url, index) => (
                                            <div key={index} className="relative group">
                                                <video
                                                    src={url}
                                                    className="h-24 w-full bg-black rounded-md"
                                                />
                                                {!isUploading && (
                                                    <button
                                                        onClick={() => removeVideo(index)}
                                                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                                        onMouseEnter={playHoverSound}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {/* UPDATED: Video Batch Select */}
                                    <Select 
                                        value={videoBatch} 
                                        onValueChange={setVideoBatch}
                                        disabled={isUploading}
                                    >
                                        <SelectTrigger onMouseEnter={playHoverSound}>
                                            <SelectValue placeholder="Select Batch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="+1" onMouseEnter={playHoverSound}>+1</SelectItem>
                                            <SelectItem value="+2" onMouseEnter={playHoverSound}>+2</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        placeholder="Year (YYYY)"
                                        type="number"
                                        value={videoYear}
                                        disabled={isUploading}
                                        onChange={(e) => setVideoYear(e.target.value)}
                                    />
                                </div>
                                <Textarea
                                    placeholder="Common description for these videos"
                                    value={videoDescription}
                                    disabled={isUploading}
                                    onChange={(e) => setVideoDescription(e.target.value)}
                                />

                                <div className="space-y-2">
                                    {!isUploading ? (
                                        <Button
                                            className="w-full"
                                            disabled={!isVideoFormValid}
                                            onClick={() => uploadMedia(videoFiles, videoBatch, videoYear, videoDescription, "video")}
                                            onMouseEnter={playHoverSound}
                                        >
                                            Upload {videoFiles.length} Video{videoFiles.length === 1 ? "" : "s"}
                                        </Button>
                                    ) : (
                                        videoFiles.length > 0 && (
                                            <Button
                                                variant="outline"
                                                className="w-full border-destructive text-destructive hover:bg-destructive/10"
                                                onClick={cancelUpload}
                                                onMouseEnter={playHoverSound}
                                            >
                                                <Ban className="mr-2 h-4 w-4" />
                                                Cancel Upload
                                            </Button>
                                        )
                                    )}

                                    {isUploading && videoFiles.length > 0 && (
                                        <div className="space-y-1 pt-2">
                                            <Progress value={uploadProgress} className="h-2" />
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center">
                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processing
                                                </p>
                                                <p className="text-xs font-medium text-primary">
                                                    {Math.round(uploadProgress)}%
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                {/* Manage Section */}
                <TabsContent value="manage" >
                    <Card className="bg-gray-800/70 border-gray-700" >
                        <CardHeader><CardTitle>Existing Media</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {/* Filters */}
                            <div className="flex flex-wrap gap-2 items-end">
                                <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}
                                    className="rounded p-2 bg-gray-700 border border-gray-600"
                                    onMouseEnter={playHoverSound}
                                >
                                    <option value="">All Batches</option>
                                    <option value="+1">+1</option>
                                    <option value="+2">+2</option>
                                </select>
                                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                                    className="rounded p-2 bg-gray-700 border border-gray-600"
                                    onMouseEnter={playHoverSound}
                                >
                                    <option value="">All Types</option>
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                                <Input type="number" placeholder="Year (yyyy)" value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value.slice(0, 4))}
                                    className="w-32" 
                                    onMouseEnter={playHoverSound}
                                />

                                <Button onClick={loadMedia} onMouseEnter={playHoverSound} className="ml-2">Find Now</Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setFilterBatch("");
                                        setFilterType("");
                                        setFilterYear("");
                                        loadMedia();
                                    }}
                                    onMouseEnter={playHoverSound}
                                >
                                    Clear Filters
                                </Button>
                            </div>

                            {/* Media Grid */}
                            {isLoading ? (
                                <div className="flex justify-center items-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {items.length === 0 ? (
                                        <p className="text-center text-gray-400 col-span-full">No media found</p>
                                    ) : (
                                        items.map((m) => (
                                            <div key={m.id} className="relative bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                                                {m.type === "image" ? (
                                                    <img src={m.url} alt={m.description} className="w-full h-40 object-cover" />
                                                ) : (
                                                    <video src={m.url} controls className="w-full h-40" />
                                                )}
                                                <div className="mt-2 text-sm space-y-1">
                                                    <p>Batch: {m.batch}</p>
                                                    <p>Year: {m.year}</p>
                                                    <p className="line-clamp-2">{m.description}</p>
                                                </div>
                                                <Button size="sm" variant="destructive"
                                                    className="absolute top-2 right-2"
                                                    onClick={() => handleDelete(m.id)}
                                                    onMouseEnter={playHoverSound}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending">
                    <Card className="bg-gray-800/70 border-gray-700">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 w-full">
                                <CardTitle>Pending Student Uploads</CardTitle>
                                <div className="flex flex-wrap gap-2 items-end">
                                    {/* Batch Filter */}
                                    <select
                                        value={filterBatch}
                                        onChange={(e) => setFilterBatch(e.target.value)}
                                        className="rounded p-2 bg-gray-700 border border-gray-600"
                                        onMouseEnter={playHoverSound}
                                    >
                                        <option value="">All Batches</option>
                                        <option value="+1">+1</option>
                                        <option value="+2">+2</option>
                                    </select>

                                    {/* Type Filter */}
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="rounded p-2 bg-gray-700 border border-gray-600"
                                        onMouseEnter={playHoverSound}
                                    >
                                        <option value="">All Types</option>
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                    </select>

                                    {/* Year Filter */}
                                    <Input
                                        type="number"
                                        placeholder="Year (yyyy)"
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(e.target.value.slice(0, 4))}
                                        className="w-32"
                                        onMouseEnter={playHoverSound}
                                    />

                                    {/* Refresh Button */}
                                    <Button onClick={loadPending} onMouseEnter={playHoverSound} className="ml-2">Find Now</Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setFilterBatch("");
                                            setFilterType("");
                                            setFilterYear("");
                                            loadPending();
                                        }}
                                        onMouseEnter={playHoverSound}
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {isPendingLoading ? (
                                <div className="flex justify-center items-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : pendingUploads.length === 0 ? (
                                <p className="text-gray-400">No pending uploads.</p>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {pendingUploads.filter((u) => {
                                        return (
                                            (!filterBatch || u.batch === filterBatch) &&
                                            (!filterType || u.type === filterType) &&
                                            (!filterYear || u.year.toString() === filterYear)
                                        );
                                    }).map((u) => (
                                        <div
                                            key={u.tempId}
                                            className="bg-gray-900/40 p-3 rounded-lg border border-gray-700 relative"
                                        >
                                            {/* ✅ Media Preview */}
                                            <div className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-2 flex items-center justify-center">
                                                {u.type === "image" ? (
                                                    <img
                                                        src={`/api/admin/pending-file/${u.tempId}`}
                                                        alt={u.filename}
                                                        className="w-full h-40 object-contain rounded"
                                                    />
                                                ) : (
                                                    <video
                                                        src={`/api/admin/pending-file/${u.tempId}`}
                                                        controls
                                                        muted
                                                        className="w-full h-40 rounded"
                                                    />
                                                )}
                                            </div>

                                            {/* ✅ Metadata */}
                                            <div className="mt-2 text-sm space-y-1">
                                                <p className="font-bold">{u.filename}</p>
                                                <p>Type: {u.type}</p>
                                                <p>Batch: {u.batch}</p>
                                                <p>Year: {u.year}</p>
                                                {u.description && (
                                                    <p className="line-clamp-2">{u.description}</p>
                                                )}
                                            </div>

                                            {/* ✅ Actions */}
                                            <div className="flex space-x-2 mt-3">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-500 flex items-center"
                                                    onClick={() => approveUpload(u.tempId)}
                                                    disabled={approvingId === u.tempId} // disable while loading
                                                    onMouseEnter={playHoverSound}
                                                >
                                                    {approvingId === u.tempId ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4 mr-1" />
                                                    )}
                                                    {approvingId === u.tempId ? "Approving..." : "Approve"}
                                                </Button>

                                                {approvingId !== u.tempId && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => disapproveUpload(u.tempId)}
                                                        onMouseEnter={playHoverSound}
                                                    >
                                                        <X className="w-4 h-4 mr-1" /> Disapprove
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
