import React, { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/static-pages/footer";
import Navigation from "@/components/static-pages/navigation";

export default function StudentsUploadPage(): JSX.Element {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [type, setType] = useState<"image" | "video">("image");
    const [batch, setBatch] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [uploading, setUploading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [cooldown, setCooldown] = useState<number>(0);
    const [remaining, setRemaining] = useState<number | null>(null);

    const mounted = useRef(true);
    useEffect(() => {
        return () => {
            mounted.current = false;
        };
    }, []);

    const isFormValid =
        !!file &&
        batch.trim() !== "" &&
        year.trim().length === 4 &&
        Number(year) > 1900 &&
        (type === "image" || type === "video");

    useEffect(() => {
        setFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    }, [type]);

    useEffect(() => {
        if (!file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => {
            setCooldown((c) => (c > 1 ? c - 1 : 0));
        }, 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const loadQuota = async () => {
        try {
            const res = await fetch("/api/students-upload/quota");
            if (!res.ok) return;
            const data = await res.json();
            if (!mounted.current) return;
            if (typeof data.remaining === "number") setRemaining(data.remaining);
            if (typeof data.cooldownRemaining === "number")
                setCooldown(data.cooldownRemaining);
        } catch {}
    };

    useEffect(() => {
        loadQuota();
        const interval = setInterval(loadQuota, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] ?? null;
        if (!selected) return setFile(null);

        if (type === "image" && !selected.type.startsWith("image/")) {
            toast({ title: "Please select an image file." });
            return;
        }
        if (type === "video" && !selected.type.startsWith("video/")) {
            toast({ title: "Please select a video file." });
            return;
        }

        const MAX_IMAGE = 5*1024 * 1024;
        const MAX_VIDEO = 30 * 1024 * 1024;
        if (type === "image" && selected.size > MAX_IMAGE) {
            toast({ title: "Image is too large (max 1 MB)." });
            return;
        }
        if (type === "video" && selected.size > MAX_VIDEO) {
            toast({ title: "Video is too large (max 25 MB)." });
            return;
        }

        setFile(selected);
    };

    const handleUpload = async () => {
        if (!isFormValid || !file) {
            toast({ title: "Fill all fields correctly before uploading." });
            return;
        }

        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", type);
        fd.append("batch", batch);
        fd.append("year", year);
        fd.append("description", description);

        setUploading(true);
        setProgress(0);

        try {
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/api/students-upload");

                xhr.upload.onprogress = (ev) => {
                    if (!ev.lengthComputable) return;
                    setProgress(Math.round((ev.loaded / ev.total) * 100));
                };

                xhr.onload = async () => {
                    if (xhr.status === 200) {
                        toast({ title: "✅ Upload successful! Pending approval." });
                        setFile(null);
                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                        setBatch("");
                        setYear("");
                        setDescription("");
                        await loadQuota();
                        resolve();
                    } else {
                        let parsed;
                        try {
                            parsed = JSON.parse(xhr.responseText);
                        } catch {}
                        toast({ title: parsed?.error || "Upload failed." });
                        await loadQuota();
                        reject();
                    }
                };

                xhr.onerror = async () => {
                    await loadQuota();
                    toast({ title: "Network error during upload." });
                    reject();
                };

                xhr.send(fd);
            });
        } finally {
            if (mounted.current) {
                setUploading(false);
                setProgress(0);
            }
        }
    };

    return (
        <>
            <Helmet>
                <title>Student Media Upload - NMHSS Thirunavaya</title>
                <meta name="description" content="Upload your student memories and achievements to the NMHSS Thirunavaya platform. Share photos and videos from your school life." />
                <meta name="keywords" content="student upload, media, photos, videos, NMHSS, Thirunavaya, students" />
                <meta property="og:title" content="Student Media Upload - NMHSS Thirunavaya" />
                <meta property="og:description" content="Upload your student memories and achievements to the NMHSS Thirunavaya platform." />
                <meta property="og:type" content="website" />
            </Helmet>
            <Navigation />
            <div className="p-6 max-w-2xl mx-auto mt-16 mb-16">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">📤 Upload Student Media</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Type */}
                        <div>
                            <label className="block text-sm mb-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as "image" | "video")}
                                disabled={uploading || cooldown > 0}
                                className="w-full p-2 rounded border bg-gray-800 border-gray-700 text-white"
                            >
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                            </select>
                        </div>

                        {/* File */}
                        <div>
                            <label className="block text-sm mb-1">File</label>
                            <Input
                                type="file"
                                accept={type === "image" ? "image/*" : "video/*"}
                                onChange={handleFileChange}
                                disabled={uploading || cooldown > 0}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {type === "image" ? "Images up to 5 MB." : "Videos up to 30 MB."}
                            </div>
                        </div>

                        {/* Preview */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm">Preview</span>
                                {file && (
                                    <span className="text-xs text-gray-400">
                                        {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                )}
                            </div>
                            <div className="border border-gray-700 rounded-lg bg-gray-900 p-3 min-h-[120px] flex items-center justify-center">
                                {previewUrl ? (
                                    type === "image" ? (
                                        <img loading="lazy" src={previewUrl} alt="preview" className="max-h-64 w-auto rounded object-contain" />
                                    ) : (
                                        <video src={previewUrl} controls className="max-h-64 w-full rounded" />
                                    )
                                ) : (
                                    <div className="text-sm text-gray-500">No preview — select a file.</div>
                                )}
                            </div>
                        </div>

                        {/* Batch */}
                        <div>
                            <label className="block text-sm mb-1">Batch</label>
                            <select
                                value={batch}
                                onChange={(e) => setBatch(e.target.value)}
                                disabled={uploading || cooldown > 0}
                                className="w-full p-2 rounded border bg-gray-800 border-gray-700 text-white"
                            >
                                <option value="">Select Batch</option>
                                <option value="+1">+1</option>
                                <option value="+2">+2</option>
                            </select>
                        </div>

                        {/* Year */}
                        <div>
                            <label className="block text-sm mb-1">Year</label>
                            <Input
                                type="number"
                                placeholder="e.g. 2025"
                                value={year}
                                onChange={(e) => setYear(e.target.value.slice(0, 4))}
                                disabled={uploading || cooldown > 0}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm mb-1">Description</label>
                            <Textarea
                                placeholder="Short description (max 160 chars)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value.slice(0, 160))}
                                disabled={uploading || cooldown > 0}
                            />
                            <div className="text-xs text-gray-500 mt-1">{description.length}/160</div>
                        </div>

                        {/* Upload button */}
                        <div className="space-y-2">
                            <Button
                                onClick={handleUpload}
                                disabled={!isFormValid || uploading || cooldown > 0 || (remaining !== null && remaining <= 0)}
                                className="w-full flex items-center justify-center"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading… {progress}%
                                    </>
                                ) : cooldown > 0 ? (
                                    <>Please wait {cooldown}s</>
                                ) : remaining !== null && remaining <= 0 ? (
                                    <>Monthly limit reached</>
                                ) : (
                                    <>Upload</>
                                )}
                            </Button>

                            {uploading && (
                                <div className="w-full bg-gray-800 h-3 rounded overflow-hidden">
                                    <div
                                        className="h-3 rounded bg-green-500 transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="text-center text-sm text-gray-400">
                            {remaining !== null && <>Remaining uploads this month: {remaining}</>}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </>
    );
}
