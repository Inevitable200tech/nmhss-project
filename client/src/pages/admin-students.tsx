import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type StudentMedia = {
    id: string;
    mediaId: string;
    url: string;
    type: "image" | "video";
    batch: "+1" | "+2";
    year: number;
    description?: string;
};

export default function AdminStudentsPage() {
    const [items, setItems] = useState<StudentMedia[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Upload states
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBatch, setImageBatch] = useState("");
    const [imageYear, setImageYear] = useState("");
    const [imageDescription, setImageDescription] = useState("");

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [videoBatch, setVideoBatch] = useState("");
    const [videoYear, setVideoYear] = useState("");
    const [videoDescription, setVideoDescription] = useState("");

    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    // Filters
    const [filterBatch, setFilterBatch] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterYear, setFilterYear] = useState("");

    // Fetch with filters
    const loadMedia = async () => {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (filterBatch) params.set("batch", filterBatch); // ✅ auto-encodes +1/+2
        if (filterType) params.set("type", filterType);
        if (filterYear) params.set("year", filterYear);


        const res = await fetch(`/api/students?${params.toString()}`);
        if (res.ok) {
            const data = await res.json();
            setItems(data);
        }
        setIsLoading(false);
    };

    // Initial load (all media)
    useEffect(() => {
        loadMedia();
    }, []);

    // Cleanup previews on unmount
    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            if (videoPreview) URL.revokeObjectURL(videoPreview);
        };
    }, [imagePreview, videoPreview]);

    // Preview Handlers
    const handleImageSelect = (file: File | null) => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(file);
        setImagePreview(file ? URL.createObjectURL(file) : null);
    };

    const handleVideoSelect = (file: File | null) => {
        if (videoPreview) URL.revokeObjectURL(videoPreview);
        setVideoFile(file);
        setVideoPreview(file ? URL.createObjectURL(file) : null);
    };

    const isImageFormValid =
        imageFile &&
        imageBatch &&
        imageYear.length === 4 &&
        parseInt(imageYear) >= 1900 &&
        imageFile.size <= 1 * 1024 * 1024 &&
        imageDescription.length <= 160;

    const isVideoFormValid =
        videoFile &&
        videoBatch &&
        videoYear.length === 4 &&
        parseInt(videoYear) >= 1900 &&
        videoFile.size <= 25 * 1024 * 1024 &&
        videoDescription.length <= 160;

    const uploadMedia = async (
        file: File,
        batch: string,
        year: string,
        description: string,
        type: "image" | "video"
    ) => {
        const confirmed = window.confirm(
            "Upload Now?"
        );
        if (!confirmed) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const mediaRes = await fetch("/api/media", {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
            body: formData,
        });

        if (!mediaRes.ok) {
            setIsUploading(false);
            toast({ title: "Upload failed", description: "Failed to upload media file." });
            return false;
        }

        const media = await mediaRes.json();
        const payload = {
            mediaId: media.id,
            url: media.url,
            type,
            batch,
            year: parseInt(year),
            description,
        };

        const res = await fetch("/api/admin-students", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
            body: JSON.stringify(payload),
        });

        setIsUploading(false);

        if (res.ok) {
            const result = await res.json();
            setItems((prev) => [result.studentMedia, ...prev]);
            toast({ title: "Success", description: `${type} uploaded successfully.` });

            // ✅ Reset form + cleanup previews
            if (type === "image") {
                if (imagePreview) URL.revokeObjectURL(imagePreview);
                setImageFile(null);
                setImagePreview(null);
                setImageBatch("");
                setImageYear("");
                setImageDescription("");
            } else {
                if (videoPreview) URL.revokeObjectURL(videoPreview);
                setVideoFile(null);
                setVideoPreview(null);
                setVideoBatch("");
                setVideoYear("");
                setVideoDescription("");
            }

            return true;
        } else {
            toast({ title: "Error", description: "Failed to save media metadata." });
            return false;
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm(
            "⚠️ Are you sure you want to delete the media?\nThis will remove it from the database completely!!!."
        );
        if (!confirmed) return;
        const res = await fetch(`/api/admin-students/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        });

        if (res.ok) {
            setItems((prev) => prev.filter((m) => m.id !== id));
            toast({ title: "Deleted", description: "Media deleted successfully." });
        } else {
            toast({ title: "Error", description: "Failed to delete media." });
        }
    };

    return (
        <div className="min-h-screen p-6 bg-gray-900 text-gray-100 space-y-6">
            <h1 className="text-3xl font-bold">Admin – Students Media</h1>
            <a
                href="/admin"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
            >
                Go Back To Dashboard
            </a>

            <Tabs defaultValue="upload" className="w-full">
                <TabsList className="bg-gray-800">
                    <TabsTrigger value="upload">Upload Media</TabsTrigger>
                    <TabsTrigger value="manage">Manage Media</TabsTrigger>
                </TabsList>

                {/* Upload Section */}
                <TabsContent value="upload" className="space-y-6">
                    {/* Image Upload */}
                    <Card className="bg-gray-800/70 border-gray-700">
                        <CardHeader><CardTitle>Upload Image</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Input type="file" accept="image/*" onChange={(e) => handleImageSelect(e.target.files?.[0] || null)} />
                            {/* Image Preview Container */}
                            <div className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-4 flex items-center justify-center">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="max-h-60 rounded-lg object-contain" />
                                ) : (
                                    <p className="text-gray-500 italic">No preview available</p>
                                )}
                            </div>
                            {imageFile && imageFile.size > 1 * 1024 * 1024 && (
                                <p className="text-red-400 text-sm">Image must be ≤ 1MB</p>
                            )}

                            <select value={imageBatch} onChange={(e) => setImageBatch(e.target.value)}
                                className="w-full rounded p-2 bg-gray-700 border border-gray-600">
                                <option value="">Select Batch</option>
                                <option value="+1">+1</option>
                                <option value="+2">+2</option>
                            </select>

                            <Input type="number" placeholder="Year (yyyy)" value={imageYear}
                                onChange={(e) => setImageYear(e.target.value.slice(0, 4))}
                                className="pl-3" />
                            {imageYear && (imageYear.length !== 4 || parseInt(imageYear) < 1900) && (
                                <p className="text-red-400 text-sm">Year must be ≥ 1900 and 4 digits</p>
                            )}

                            <Textarea
                                placeholder="Optional description"
                                value={imageDescription}
                                onChange={(e) => setImageDescription(e.target.value)}
                            />
                            <div className="flex justify-between text-sm">
                                <span className={imageDescription.length > 160 ? "text-red-400" : "text-gray-400"}>
                                    {imageDescription.length}/160
                                </span>
                            </div>
                            {imageDescription.length > 160 && (
                                <p className="text-red-400 text-sm">Description must be ≤ 160 characters</p>
                            )}

                            <Button disabled={!isImageFormValid || isUploading}
                                onClick={() => uploadMedia(imageFile!, imageBatch, imageYear, imageDescription, "image")}>
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Upload Image
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Video Upload */}
                    <Card className="bg-gray-800/70 border-gray-700">
                        <CardHeader><CardTitle>Upload Video</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Input type="file" accept="video/*" onChange={(e) => handleVideoSelect(e.target.files?.[0] || null)} />
                            {/* Video Preview Container */}
                            <div className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-4 flex items-center justify-center">
                                {videoPreview ? (
                                    <video src={videoPreview} controls muted className="max-h-60 rounded-lg object-contain" />
                                ) : (
                                    <p className="text-gray-500 italic">No preview available</p>
                                )}
                            </div>
                            {videoFile && videoFile.size > 25 * 1024 * 1024 && (
                                <p className="text-red-400 text-sm">Video must be ≤ 25MB</p>
                            )}

                            <select value={videoBatch} onChange={(e) => setVideoBatch(e.target.value)}
                                className="w-full rounded p-2 bg-gray-700 border border-gray-600">
                                <option value="">Select Batch</option>
                                <option value="+1">+1</option>
                                <option value="+2">+2</option>
                            </select>

                            <Input type="number" placeholder="Year (yyyy)" value={videoYear}
                                onChange={(e) => setVideoYear(e.target.value.slice(0, 4))}
                                className="pl-3" />
                            {videoYear && (videoYear.length !== 4 || parseInt(videoYear) < 1900) && (
                                <p className="text-red-400 text-sm">Year must be ≥ 1900 and 4 digits</p>
                            )}

                            <Textarea
                                placeholder="Optional description"
                                value={videoDescription}
                                onChange={(e) => setVideoDescription(e.target.value)}
                            />
                            <div className="flex justify-between text-sm">
                                <span className={videoDescription.length > 160 ? "text-red-400" : "text-gray-400"}>
                                    {videoDescription.length}/160
                                </span>
                            </div>
                            {videoDescription.length > 160 && (
                                <p className="text-red-400 text-sm">Description must be ≤ 160 characters</p>
                            )}

                            <Button disabled={!isVideoFormValid || isUploading}
                                onClick={() => uploadMedia(videoFile!, videoBatch, videoYear, videoDescription, "video")}>
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Upload Video
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Manage Section */}
                <TabsContent value="manage">
                    <Card className="bg-gray-800/70 border-gray-700">
                        <CardHeader><CardTitle>Existing Media</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {/* Filters */}
                            <div className="flex flex-wrap gap-2 items-end">
                                <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}
                                    className="rounded p-2 bg-gray-700 border border-gray-600">
                                    <option value="">All Batches</option>
                                    <option value="+1">+1</option>
                                    <option value="+2">+2</option>
                                </select>
                                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                                    className="rounded p-2 bg-gray-700 border border-gray-600">
                                    <option value="">All Types</option>
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                                <Input type="number" placeholder="Year (yyyy)" value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value.slice(0, 4))}
                                    className="w-32" />

                                <Button onClick={loadMedia} className="ml-2">Find Now</Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setFilterBatch("");
                                        setFilterType("");
                                        setFilterYear("");
                                        loadMedia();
                                    }}
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
                                                    onClick={() => handleDelete(m.id)}>
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
            </Tabs>
        </div>
    );
}
