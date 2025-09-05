import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, User, Upload, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Fallback Data
const fallbackImages = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
    "https://images.unsplash.com/photo-1594824804584-dd32c48a0e5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
];

const fallbackStats = [
    { label: "Qualified Teachers", value: "25+", description: "Experienced and certified educators" },
    { label: "Years Average Experience", value: "15+", description: "Seasoned professionals in education" },
    { label: "Departments", value: "10+", description: "Specialized subject expertise" },
];

const fallbackProfiles = [
    {
        name: "Mrs. Leadership Principal",
        role: "Principal",
        description:
            "M.A., B.Ed., 25 years experience. 'Leading with vision to create an environment where every student can discover their potential and achieve excellence.'",
        imageUrl: fallbackImages[0],
    },
    {
        name: "Mr. Leadership Vice",
        role: "Vice Principal",
        description:
            "M.Sc., B.Ed., 20 years experience. 'Dedicated to fostering academic excellence and character development through innovative teaching methodologies.'",
        imageUrl: fallbackImages[1],
    },
    {
        name: "Mrs. Leadership Academic",
        role: "Head of Academics",
        description:
            "M.A., M.Ed., 18 years experience. 'Committed to curriculum excellence and ensuring every student receives quality education that prepares them for the future.'",
        imageUrl: fallbackImages[2],
    },
];

interface FacultyStat {
    label: string;
    value: string;
    description: string;
}

interface FacultyProfile {
    name: string;
    role: string;
    description: string;
    mediaId?: string;
    imageUrl?: string;
}

interface FacultySection {
    title: string;
    subtitle: string;
    stats: FacultyStat[];
    profiles: FacultyProfile[];
}

export default function AdminFaculty() {
    const { toast } = useToast();
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [stats, setStats] = useState<FacultyStat[]>([
        { label: "", value: "", description: "" },
        { label: "", value: "", description: "" },
        { label: "", value: "", description: "" },
    ]);
    const [profiles, setProfiles] = useState<FacultyProfile[]>([
        { name: "", role: "", description: "" },
        { name: "", role: "", description: "" },
        { name: "", role: "", description: "" },
    ]);
    const [tempPreviews, setTempPreviews] = useState<(string | null)[]>([null, null, null]);
    const [tempFiles, setTempFiles] = useState<(File | null)[]>([null, null, null]);
    const token = localStorage.getItem("adminToken");
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/faculty");
                if (res.ok) {
                    const data: FacultySection = await res.json();
                    setTitle(data.title);
                    setSubtitle(data.subtitle);
                    setStats(data.stats);
                    setProfiles(data.profiles);
                }
            } catch (err) {
                console.error("Failed to load faculty section", err);
            }
        })();
    }, []);

    const handleStatChange = (i: number, field: keyof FacultyStat, value: string) => {
        const newStats = [...stats];
        newStats[i] = { ...newStats[i], [field]: value };
        setStats(newStats);
    };

    const handleProfileChange = (i: number, field: keyof FacultyProfile, value: string) => {
        const newProfiles = [...profiles];
        newProfiles[i] = { ...newProfiles[i], [field]: value };
        setProfiles(newProfiles);
    };

    const handleImageSelect = (i: number, file: File) => {
        const previewUrl = URL.createObjectURL(file);
        const newPreviews = [...tempPreviews];
        const newFiles = [...tempFiles];
        newPreviews[i] = previewUrl;
        newFiles[i] = file;
        setTempPreviews(newPreviews);
        setTempFiles(newFiles);
    };

    // ✅ Modified handleSave to accept overrides
    const handleSave = async (overrides?: Partial<FacultySection>) => {
        try {
            const payload: FacultySection = {
                title,
                subtitle,
                stats,
                profiles,
                ...overrides,
            };

            // Upload new images if any
            const uploadedProfiles = await Promise.all(
                payload.profiles.map(async (p, i) => {
                    if (tempFiles[i]) {
                        const formData = new FormData();
                        formData.append("file", tempFiles[i] as Blob);
                        const uploadRes = await fetch("/api/media", {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
                            }, body: formData
                        });
                        if (!uploadRes.ok) throw new Error("Upload failed");
                        const uploaded = await uploadRes.json();
                        return { ...p, mediaId: uploaded.id, imageUrl: `/api/media/${uploaded.id}` };
                    }
                    return p;
                })
            );

            const finalPayload: FacultySection = {
                ...payload,
                profiles: uploadedProfiles,
            };

            const res = await fetch("/api/faculty", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`
                },
                body: JSON.stringify(finalPayload),
            });

            if (!res.ok) throw new Error("Save failed");
            toast({ title: "✅ Faculty section saved" });
        } catch (err) {
            console.error(err);
            toast({ title: "❌ Failed to save faculty section", variant: "destructive" });
        }
    };

    // ✅ Modified handleImageRemove
    // ✅ Modified handleImageRemove
    const handleImageRemove = async (i: number) => {
        const confirmed = window.confirm(
            "⚠️ Are you sure you want to remove this image?\nThis will delete the image from the database."
        );
        if (!confirmed) return;

        try {
            // 🔥 Delete from DB if mediaId exists
            if (profiles[i].mediaId) {
                await fetch(`/api/media/${profiles[i].mediaId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
                });
            }

            // Clear local state
            const newPreviews = [...tempPreviews];
            const newFiles = [...tempFiles];
            newPreviews[i] = null;
            newFiles[i] = null;
            setTempPreviews(newPreviews);
            setTempFiles(newFiles);

            const newProfiles = [...profiles];
            newProfiles[i] = { ...newProfiles[i], mediaId: undefined, imageUrl: undefined };
            setProfiles(newProfiles);

            // 🔥 Save immediately with updated profiles
            await handleSave({ profiles: newProfiles });

            toast({ title: "🗑️ Image removed successfully" });
        } catch (err) {
            console.error(err);
            toast({ title: "❌ Failed to remove image", variant: "destructive" });
        }
    };

    // ✅ Modified handleRestoreDefaults
    const handleRestoreDefaults = async () => {
        const confirmed = window.confirm(
            "⚠️ Are you sure you want to reset?\nThis will delete the all image from the form."
        );
        if (!confirmed) return;
        try {
            // Delete uploaded media if exists
            for (const profile of profiles) {
                if (profile.mediaId) {
                    try {
                        await fetch(`/api/media/${profile.mediaId}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } });
                    } catch (err) {
                        console.error(`Failed to delete media ${profile.mediaId}`, err);
                    }
                }
            }

            // Reset fields
            const restoredTitle = "Our Faculty";
            const restoredSubtitle = "Meet our experienced and dedicated faculty team";
            const restoredStats = fallbackStats;

            const restoredProfiles = fallbackProfiles.map((p) => ({
                name: p.name,
                role: p.role,
                description: p.description,
                mediaId: undefined,
                imageUrl: undefined, // clear uploaded image
            }));

            setTitle(restoredTitle);
            setSubtitle(restoredSubtitle);
            setStats(restoredStats);
            setProfiles(restoredProfiles);
            setTempPreviews([null, null, null]);
            setTempFiles([null, null, null]);

            // 🔥 Save immediately with restored defaults
            await handleSave({
                title: restoredTitle,
                subtitle: restoredSubtitle,
                stats: restoredStats,
                profiles: restoredProfiles,
            });

            toast({ title: "↩️ Restored to defaults" });
        } catch (error) {
            console.error(error);
            toast({ title: "❌ Failed to restore defaults", variant: "destructive" });
        }
    };



    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 space-y-6">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                {/* Back button */}
                <Button
                    onClick={() => (window.location.href = "/admin")}
                    variant="secondary"
                    className="flex items-center gap-2 w-full sm:w-auto"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Admin
                </Button>

                {/* Right side buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                        onClick={handleRestoreDefaults}
                        variant="outline"
                        className="flex items-center gap-2 w-full sm:w-auto"
                    >
                        <Trash2 className="w-4 h-4" /> Restore Defaults
                    </Button>
                    <Button
                        onClick={() => handleSave()}
                        className="flex items-center gap-2 w-full sm:w-auto"
                    >
                        <Save className="w-4 h-4" /> Save
                    </Button>
                </div>
            </div>



            {/* Section Header */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">🎓 Faculty Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Section Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Textarea
                        className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Section Subtitle"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                    />
                </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-400" /> Faculty Stats
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                        {stats.map((s, i) => (
                            <motion.div
                                key={i}
                                className="space-y-2 bg-gray-700 p-4 rounded-lg"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.1 }}
                            >
                                <Input
                                    className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Label"
                                    value={s.label}
                                    onChange={(e) => handleStatChange(i, "label", e.target.value)}
                                />
                                <Input
                                    className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Value"
                                    value={s.value}
                                    onChange={(e) => handleStatChange(i, "value", e.target.value)}
                                />
                                <Textarea
                                    className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 
focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Description"
                                    value={s.description}
                                    onChange={(e) => handleStatChange(i, "description", e.target.value)}
                                />
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Profiles */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-400" /> Faculty Profiles
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        {profiles.map((p, i) => (
                            <motion.div
                                key={i}
                                className="rounded-xl p-4 bg-gray-700 border border-gray-600 shadow-md space-y-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                {/* Profile Image */}
                                <div className="flex flex-col items-center space-y-2">
                                    {tempPreviews[i] ? (
                                        <img
                                            src={tempPreviews[i]!}
                                            alt="preview"
                                            className="h-24 w-24 rounded-full object-cover"
                                        />
                                    ) : p.imageUrl ? (
                                        <img
                                            src={p.imageUrl}
                                            alt="profile"
                                            className="h-24 w-24 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-24 w-24 rounded-full bg-gray-600 flex items-center justify-center text-gray-400">
                                            <User className="w-8 h-8" />
                                        </div>
                                    )}

                                    <Button asChild variant="secondary" size="sm" className="flex items-center gap-2">
                                        <label className="cursor-pointer">
                                            <Upload className="w-4 h-4" /> Upload
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) =>
                                                    e.target.files && handleImageSelect(i, e.target.files[0])
                                                }
                                            />
                                        </label>
                                    </Button>

                                    {(p.imageUrl || tempPreviews[i]) && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={() => handleImageRemove(i)}
                                        >
                                            <Trash2 className="w-4 h-4" /> Remove
                                        </Button>
                                    )}
                                </div>

                                {/* Profile Inputs */}
                                <Input
                                    className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Name"
                                    value={p.name}
                                    onChange={(e) => handleProfileChange(i, "name", e.target.value)}
                                />
                                <Input
                                    className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Role"
                                    value={p.role}
                                    onChange={(e) => handleProfileChange(i, "role", e.target.value)}
                                />
                                <Textarea
                                    className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Description"
                                    value={p.description}
                                    onChange={(e) => handleProfileChange(i, "description", e.target.value)}
                                />
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
