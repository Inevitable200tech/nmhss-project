'use client';

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Save, Upload, X, AlertTriangle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Removed: import Cropper from "react-easy-crop";
// Removed: import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Removed: import { getCroppedImg } from "@/lib/crop-image";

type PendingImage = {
  file: File;
  preview: string;
  // Removed: croppedBlob?: Blob;
};

type TopStudent = {
  name: string;
  aPlusCount: number;
  mediaId?: string;
  photoUrl?: string;
  pendingImage?: PendingImage;
  stream?: "Commerce" | "Science (Biology)" | "Computer Science";
};

type AcademicResult = {
  year: number;
  hsTotalAplusStudents: number;
  hsTotalMarkAverage: number;
  hssTotalAveragePercentage: number;
  hssCommerceAverage: number;
  hssScienceBiologyAverage: number;
  hssComputerScienceAverage: number;
  topHSStudents: TopStudent[];
  topHSSStudents: TopStudent[];
};

export default function AdminAcademicResults() {
  const { toast } = useToast();
  const { playHoverSound, playErrorSound, playSuccessSound } = useSound();
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [customYear, setCustomYear] = useState("");
  const [data, setData] = useState<AcademicResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Removed Cropper state variables:
  // const [cropOpen, setCropOpen] = useState(false);
  // const [cropImage, setCropImage] = useState("");
  // const [crop, setCrop] = useState({ x: 0, y: 0 });
  // const [zoom, setZoom] = useState(1);
  // const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  // const [cropTarget, setCropTarget] = useState<{ type: "HS" | "HSS"; index: number } | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";

  useEffect(() => {
    fetch("/api/academic-results/years")
      .then(r => r.json())
      .then(setYears)
      .catch(() => toast({ title: "Error", description: "Failed to load years", variant: "destructive" }));
  }, [toast]);

  const loadYear = async (year: number) => {
    setIsLoading(true);
    setSelectedYear(year);
    try {
      const res = await fetch(`/api/academic-results/${year}`);
      if (!res.ok) throw new Error();
      const result = await res.json();
      setData(result);
      setHasUnsavedChanges(false);
    } catch {
      toast({ title: "Not Found", description: `No data for ${year}`, variant: "destructive" });
      playHoverSound();
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewYear = (year: number) => {
    setSelectedYear(year);
    setData({
      year,
      hsTotalAplusStudents: 0,
      hsTotalMarkAverage: 0,
      hssTotalAveragePercentage: 0,
      hssCommerceAverage: 0,
      hssScienceBiologyAverage: 0,
      hssComputerScienceAverage: 0,
      topHSStudents: [],
      topHSSStudents: [],
    });
    setHasUnsavedChanges(true);
  };

  const updateField = (field: keyof AcademicResult, value: number) => {
    if (!data) return;
    setData({ ...data, [field]: value });
    setHasUnsavedChanges(true);
  };

  const addStudent = (type: "HS" | "HSS") => {
    if (!data) return;
    const newStudent: TopStudent = {
      name: "",
      aPlusCount: type === "HS" ? 10 : 6,
      stream: type === "HSS" ? "Commerce" : undefined,
    };
    setData({
      ...data,
      [type === "HS" ? "topHSStudents" : "topHSSStudents"]: [
        ...(data[type === "HS" ? "topHSStudents" : "topHSSStudents"] || []),
        newStudent
      ]
    });
    setHasUnsavedChanges(true);
  };

  const updateStudent = (type: "HS" | "HSS", index: number, updates: Partial<TopStudent>) => {
    if (!data) return;
    const list = [...(data[type === "HS" ? "topHSStudents" : "topHSSStudents"] || [])];
    list[index] = { ...list[index], ...updates };
    setData({ ...data, [type === "HS" ? "topHSStudents" : "topHSSStudents"]: list });
    setHasUnsavedChanges(true);
  };

  const removeStudent = async (type: "HS" | "HSS", index: number) => {
    if (!data) return;
    const student = data[type === "HS" ? "topHSStudents" : "topHSSStudents"][index];
    if (student.mediaId) {
      await fetch(`/api/media/${student.mediaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => { playErrorSound(); toast({ title: "Error", description: "Failed to delete old image", variant: "destructive" }); });
    }
    setData({
      ...data,
      [type === "HS" ? "topHSStudents" : "topHSSStudents"]:
        data[type === "HS" ? "topHSStudents" : "topHSSStudents"].filter((_, i) => i !== index)
    });
    setHasUnsavedChanges(true);
  };

  // NEW function to handle image upload without cropping
  const handleImageUpload = (file: File, type: "HS" | "HSS", index: number) => {
    updateStudent(type, index, {
      pendingImage: {
        file: file,
        preview: URL.createObjectURL(file),
      }
    });
    setHasUnsavedChanges(true);
    toast({ title: "Image Selected", description: "Image ready for upload. Click Save to upload permanently." });
    playSuccessSound();
  };

  // Removed: onCropComplete

  const saveAll = async () => {
    if (!data || !selectedYear) return;
    setIsSaving(true);

    try {
      let currentData = { ...data }; // Work on a copy

      // STEP 1: Upload all pending images
      if (hasPendingImages()) {
        toast({ title: "Uploading images...", description: "Please wait" });

        const allStudents = [
          ...currentData.topHSStudents.map((s, i) => ({ ...s, _type: "HS" as const, _index: i })),
          ...currentData.topHSSStudents.map((s, i) => ({ ...s, _type: "HSS" as const, _index: i }))
        ];

        // Filter by the new structure: pendingImage.file (instead of croppedBlob)
        const pendingStudents = allStudents.filter(s => s.pendingImage?.file);

        for (const student of pendingStudents) {
          // Delete old image
          if (student.mediaId) {
            await fetch(`/api/media/${student.mediaId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => { });
          }

          const formData = new FormData();
          // Use pendingImage.file for upload (instead of croppedBlob)
          formData.append("file", student.pendingImage!.file!, `${student.name}.jpg`);

          const res = await fetch("/api/media", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (!res.ok) {
            const err = await res.text();
            toast({ title: "Upload Failed", description: `Failed to upload image for ${student.name}`, variant: "destructive" }); 
            playErrorSound(); 
            throw new Error(`Upload failed for ${student.name}: ${err}`);
          }

          const { id, url } = await res.json();

          // Update the correct student in correct list
          if (student._type === "HS") {
            currentData.topHSStudents[student._index] = {
              ...currentData.topHSStudents[student._index],
              mediaId: id,
              photoUrl: url,
              pendingImage: undefined,
            };
          } else {
            currentData.topHSSStudents[student._index] = {
              ...currentData.topHSSStudents[student._index],
              mediaId: id,
              photoUrl: url,
              pendingImage: undefined,
            };
          }
        }

        // Update state once
        setData(currentData);
        toast({ title: "Images uploaded!", description: "Saving to database..." });
        playHoverSound();
      }

      // STEP 2: Save to DB — now 100% guaranteed to have photoUrl
      const payload = {
        ...currentData,
        // Remove pendingImage before saving
        topHSStudents: currentData.topHSStudents.map(({ pendingImage, ...s }) => s),
        topHSSStudents: currentData.topHSSStudents.map(({ pendingImage, ...s }) => s),
      };

      const res = await fetch("/api/admin/academic-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast({ title: "Save Failed", description: "Failed to save academic results", variant: "destructive" });  
        playErrorSound();
        throw new Error("Save failed");
      }

      toast({ title: "Success!", description: `Academic results for ${selectedYear} saved with photos!` });
      setHasUnsavedChanges(false);
      // Reload years if a new year was created
      if (!years.includes(selectedYear)) {
         fetch("/api/academic-results/years")
          .then(r => r.json())
          .then(setYears)
      }
    } catch (err: any) {

      toast({
        title: "Failed",
        description: err.message,
        variant: "destructive"
      });
      playErrorSound();
    } finally {
      setIsSaving(false);
    }
  };

  const hasPendingImages = () => {
    if (!data) return false;
    // Check for the existence of the pendingImage object
    return [...data.topHSStudents, ...data.topHSSStudents].some(s => s.pendingImage);
  };

  if (!selectedYear) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <Card className="max-w-md mx-auto mt-20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Academic Results Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base">Select Existing Year</Label>
              <Select onValueChange={(v) => loadYear(Number(v))}>
                <SelectTrigger onMouseEnter={playHoverSound}><SelectValue placeholder="Choose a year" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="e.g. 2026"
                value={customYear}
                onChange={e => setCustomYear(e.target.value.replace(/\D/g, ""))}
                onMouseEnter={playHoverSound}
              />
              <Button
                onClick={() => {
                  const y = Number(customYear);
                  if (y >= 2000 && y <= 2100) {
                    createNewYear(y);
                    setCustomYear("");
                  }
                }}
                onMouseEnter={playHoverSound}
                disabled={!customYear}
              >
                Create New Year
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

          {/* TOP BAR — Title perfectly centered on desktop */}
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              {/* Back Button — Left aligned */}
              <Button
                variant="outline"
                size="lg"
                onMouseEnter={playHoverSound}
                onClick={() => window.location.href = "/admin"}
                className="w-full sm:w-auto justify-center sm:justify-start gap-2 font-medium"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Dashboard
              </Button>

              {/* Title — Centered on desktop, full width on mobile */}
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-center order-first sm:order-none">
                Academic Results {selectedYear}
              </h1>

              {/* Save Button — Right aligned */}
              <Button
                onClick={saveAll}
                onMouseEnter={playHoverSound}
                disabled={isSaving || !hasUnsavedChanges}
                size="lg"
                className="w-full sm:w-auto gap-3 font-semibold shadow-lg order-last"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {isSaving ? "Saving..." : "Save All Changes"}
              </Button>
            </div>
          </div>

          {/* Pending Images Alert */}
          {hasPendingImages() && (
            <Alert className="mb-6 border-amber-400 bg-amber-50 dark:bg-amber-950/50">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200 font-medium">
                You have images ready for upload. Click "Save All Changes" to upload them permanently.
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Grid — Now perfect on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {data && [
              { key: "hsTotalAplusStudents", label: "HS A+ Students" },
              { key: "hsTotalMarkAverage", label: "HS Avg %" },
              { key: "hssTotalAveragePercentage", label: "HSS Overall %" },
              { key: "hssCommerceAverage", label: "Commerce %" },
              { key: "hssScienceBiologyAverage", label: "Biology %" },
              { key: "hssComputerScienceAverage", label: "Computer %" },
            ].map(({ key, label }) => (
              <Card key={key} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur">
                <CardHeader className="pb-2 px-4 pt-4">
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center sm:text-left">
                    {label}
                  </Label>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <Input
                    type="number"
                    value={data[key as keyof AcademicResult] as number}
                    onChange={e => updateField(key as keyof AcademicResult, Number(e.target.value) || 0)}
                    className="text-lg font-bold text-center sm:text-left h-12"
                    placeholder="0"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* HS Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xl">
                <span className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                  HS Top Achievers
                </span>
                <Button size="sm" onClick={() => addStudent("HS")} onMouseEnter={playHoverSound} variant="outline" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4" /> Add Student
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {data?.topHSStudents.length === 0 ? (
                <p className="text-center text-gray-500 py-12 text-lg">No HS students added yet</p>
              ) : (
                data && data.topHSStudents.map((s, i) => (
                  <StudentRow
                    key={i}
                    student={s}
                    type="HS"
                    index={i}
                    updateStudent={updateStudent}
                    removeStudent={removeStudent}
                    handleImageUpload={handleImageUpload} // Changed prop
                    playHoverSound={playHoverSound}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* HSS Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xl">
                <span className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                  HSS Top Achievers
                </span>
                <Button size="sm" onClick={() => addStudent("HSS")} onMouseEnter={playHoverSound} variant="outline" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4" /> Add Student
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!data || data.topHSSStudents.length === 0 ? (
                <p className="text-center text-gray-500 py-12 text-lg">No HSS students added yet</p>
              ) : (
                data.topHSSStudents.map((s, i) => (
                  <StudentRow
                    key={i}
                    student={s}
                    type="HSS"
                    index={i}
                    updateStudent={updateStudent}
                    removeStudent={removeStudent}
                    handleImageUpload={handleImageUpload} // Changed prop
                    playHoverSound={playHoverSound}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Removed: Cropper Dialog */}
    </>
  );
}

// Updated StudentRow signature and logic to use direct file upload
function StudentRow({ student, type, index, updateStudent, removeStudent, handleImageUpload, playHoverSound }: {
  student: TopStudent,
  type: "HS" | "HSS",
  index: number,
  updateStudent: (type: "HS" | "HSS", index: number, updates: Partial<TopStudent>) => void,
  removeStudent: (type: "HS" | "HSS", index: number) => void,
  handleImageUpload: (file: File, type: "HS" | "HSS", index: number) => void,
  playHoverSound: () => void
}) {
  return (
    <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4">
          <Input
            placeholder="Student Name *"
            value={student.name}
            onChange={e => updateStudent(type, index, { name: e.target.value })}
            className={`font-medium ${!student.name.trim() ? "border-red-500" : ""}`}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            type="number"
            value={student.aPlusCount}
            onChange={e => updateStudent(type, index, {
              aPlusCount: Math.max(1, Math.min(type === "HS" ? 10 : 6, Number(e.target.value) || 1))
            })}
            min="1"
            max={type === "HS" ? 10 : 6}
            className="text-center font-bold text-lg"
          />
        </div>

        {type === "HSS" && (
          <div className="md:col-span-3">
            <Select value={student.stream || ""} onValueChange={v => updateStudent(type, index, { stream: v as any })}>
              <SelectTrigger><SelectValue placeholder="Select stream" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Commerce">Commerce</SelectItem>
                <SelectItem value="Science (Biology)">Science (Biology)</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="md:col-span-3 flex justify-center">
          {student.pendingImage?.preview || student.photoUrl ? (
            <div className="relative group">
              <img
                src={student.pendingImage?.preview || student.photoUrl}
                alt="Student"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-green-500 shadow-lg"
              />
              <button
                // Clear the image and pending state
                onClick={() => updateStudent(type, index, {
                  pendingImage: undefined,
                  photoUrl: undefined,
                  mediaId: undefined
                })}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                // Direct call to the image handler, skipping the cropper
                onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], type, index)}
              />
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                <Upload className="h-8 w-8 text-gray-500" />
              </div>
            </label>
          )}
        </div>

        <div className="md:col-span-1">
          <Button
            variant="destructive"
            size="icon"
            onMouseEnter={playHoverSound}
            onClick={() => removeStudent(type, index)}
            className="w-full"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}