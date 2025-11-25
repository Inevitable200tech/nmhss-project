'use client';

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Trash2, Save, Upload, X, Crop } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type TopStudent = {
  name: string;
  aPlusCount: number;
  mediaId?: string;
  stream?: "Commerce" | "Science (Biology)" | "Computer Science";
  blobUrl?: string; // Local preview only
  croppedBlob?: Blob;
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
  const [years, setYears] = useState<number[]>([]);
  const [customYear, setCustomYear] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [data, setData] = useState<AcademicResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Crop state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropTarget, setCropTarget] = useState<{ type: "HS" | "HSS"; index: number } | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";

  useEffect(() => {
    fetch("/api/academic-results/years")
      .then(r => r.json())
      .then(setYears);
  }, []);

  const loadYear = async (year: number) => {
    setIsLoading(true);
    const res = await fetch(`/api/academic-results/${year}`);
    if (res.ok) {
      const result = await res.json();
      result.topHSStudents = result.topHSStudents.map((s: any) => ({ ...s, blobUrl: s.mediaId ? `/api/media/${s.mediaId}` : undefined }));
      result.topHSSStudents = result.topHSSStudents.map((s: any) => ({ ...s, blobUrl: s.mediaId ? `/api/media/${s.mediaId}` : undefined }));
      setData(result);
    } else {
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
    }
    setSelectedYear(year);
    setIsLoading(false);
  };

  const openCropper = (file: File, type: "HS" | "HSS", index: number) => {
    const url = URL.createObjectURL(file);
    setCropImage(url);
    setCropTarget({ type, index });
    setCropOpen(true);
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveCroppedImage = async () => {
    if (!cropImage || !croppedAreaPixels || !cropTarget) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const image = new Image();
    image.src = cropImage;

    await new Promise(resolve => { image.onload = resolve; });

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx?.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const key = cropTarget.type === "HS" ? "topHSStudents" : "topHSSStudents";
      const updated = [...data![key]];
      updated[cropTarget.index] = {
        ...updated[cropTarget.index],
        blobUrl: url,
        croppedBlob: blob,
      };
      setData({ ...data!, [key]: updated });
      setCropOpen(false);
      toast({ title: "Cropped!", description: "Photo ready for upload on save" });
    }, "image/jpeg", 0.95);
  };

  const validateAndSave = async () => {
    if (!data || !selectedYear) return;

    const emptyNames = [...data.topHSStudents, ...data.topHSSStudents]
      .map((s, i) => (!s.name?.trim() ? i + 1 : 0))
      .filter(Boolean);

    if (emptyNames.length > 0) {
      toast({ title: "Error", description: "All students must have a name", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      // Upload all cropped images
      for (const [type, list] of [
        ["HS", data.topHSStudents] as const,
        ["HSS", data.topHSSStudents] as const,
      ]) {
        for (let i = 0; i < list.length; i++) {
          const student = list[i];
          if (student.croppedBlob && !student.mediaId) {
            const formData = new FormData();
            formData.append("file", student.croppedBlob, `student-${selectedYear}-${i}.jpg`);

            const res = await fetch("/api/media", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const { id } = await res.json();
            const key = type === "HS" ? "topHSStudents" : "topHSSStudents";
            const updated = [...data[key]];
            updated[i] = { ...updated[i], mediaId: id, blobUrl: `/api/media/${id}`, croppedBlob: undefined };
            setData({ ...data, [key]: updated });
          }
        }
      }

      // Save to DB
      const res = await fetch("/api/admin/academic-results", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast({ title: "Success!", description: `Results for ${data.year} saved successfully` });
        loadYear(data.year); // Refresh
      } else throw new Error();
    } catch {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedYear) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Select or Create Academic Year</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={(v) => loadYear(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Choose existing year" /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                placeholder="Enter new year (e.g. 2023)"
                value={customYear}
                onChange={e => setCustomYear(e.target.value.replace(/\D/g, ""))}
                maxLength={4}
              />
              <Button onClick={() => customYear && loadYear(Number(customYear))} disabled={!customYear || years.includes(Number(customYear))}>
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Card>
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl">Academic Results • {data?.year}</CardTitle>
                <p className="opacity-90">Crop photos → Save once → Done</p>
              </div>
              <Button variant="secondary" onClick={() => setSelectedYear(null)}>Change Year</Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            {isLoading ? (
              <div className="text-center py-20"><Loader2 className="h-12 w-12 animate-spin mx-auto" /></div>
            ) : data && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><Label>HS Total A+ Students</Label><Input type="number" value={data.hsTotalAplusStudents} onChange={e => setData(d => d && {...d, hsTotalAplusStudents: Number(e.target.value)})} /></div>
                  <div><Label>HS Avg (%)</Label><Input type="number" step="0.1" value={data.hsTotalMarkAverage} onChange={e => setData(d => d && {...d, hsTotalMarkAverage: Number(e.target.value)})} /></div>
                  <div><Label>HSS Overall Avg (%)</Label><Input type="number" step="0.1" value={data.hssTotalAveragePercentage} onChange={e => setData(d => d && {...d, hssTotalAveragePercentage: Number(e.target.value)})} /></div>
                  <div><Label>HSS Commerce Avg (%)</Label><Input type="number" step="0.1" value={data.hssCommerceAverage} onChange={e => setData(d => d && {...d, hssCommerceAverage: Number(e.target.value)})} /></div>
                  <div><Label>HSS Science (Bio) Avg (%)</Label><Input type="number" step="0.1" value={data.hssScienceBiologyAverage} onChange={e => setData(d => d && {...d, hssScienceBiologyAverage: Number(e.target.value)})} /></div>
                  <div><Label>HSS CS Avg (%)</Label><Input type="number" step="0.1" value={data.hssComputerScienceAverage} onChange={e => setData(d => d && {...d, hssComputerScienceAverage: Number(e.target.value)})} /></div>
                </div>

                {/* HS & HSS Sections */}
                {["HS", "HSS"].map((type: any) => (
                  <div key={type}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-2xl font-bold ${type === "HS" ? "text-indigo-700" : "text-green-700"}`}>
                        {type === "HS" ? "HS" : "HSS"} Top Achievers
                      </h3>
                      <Button onClick={() => {
                        const newStudent: TopStudent = {
                          name: "",
                          aPlusCount: type === "HS" ? 10 : 6,
                          ...(type === "HSS" && { stream: "Commerce" }),
                        };
                        setData(d => ({ ...d!, [type === "HS" ? "topHSStudents" : "topHSSStudents"]: [...d![type === "HS" ? "topHSStudents" : "topHSSStudents"], newStudent] }));
                      }}>
                        <Plus className="h-4 w-4 mr-2" />Add
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {data[type === "HS" ? "topHSStudents" : "topHSSStudents"].map((s, i) => (
                        <StudentRow
                          key={i}
                          student={s}
                          type={type}
                          index={i}
                          openCropper={openCropper}
                          updateStudent={(field: keyof TopStudent, value: any) => {
                            const key = type === "HS" ? "topHSStudents" : "topHSSStudents";
                            const updated = [...data[key]];
                            updated[i] = { ...updated[i], [field]: value };
                            setData({ ...data, [key]: updated });
                          }}
                          removeStudent={() => {
                            const key = type === "HS" ? "topHSStudents" : "topHSSStudents";
                            setData(d => ({ ...d!, [key]: d![key].filter((_, idx) => idx !== i) }));
                          }}
                          showStream={type === "HSS"}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex gap-4 pt-8 border-t">
                  <Button onClick={validateAndSave} disabled={isSaving} size="lg" className="flex-1">
                    {isSaving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                    Save All & Upload Photos
                  </Button>
                  <a href="/admin"><Button variant="outline" size="lg">Back</Button></a>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Crop Dialog */}
      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="max-w-2xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Crop Photo (Circle Preview)</DialogTitle>
          </DialogHeader>
          <div className="relative h-full">
            <Cropper
              image={cropImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setCropOpen(false)}>Cancel</Button>
            <Button onClick={saveCroppedImage}>Apply Crop</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudentRow({ student, type, index, openCropper, updateStudent, removeStudent, showStream }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border">
      <Input
        placeholder="Student Name *"
        value={student.name}
        onChange={e => updateStudent("name", e.target.value)}
        className={`md:col-span-3 ${!student.name.trim() ? "border-red-500" : ""}`}
      />
      <Input
        type="number"
        value={student.aPlusCount}
        onChange={e => updateStudent("aPlusCount", Math.max(1, Math.min(type === "HS" ? 10 : 6, Number(e.target.value))))}
        min="1"
        max={type === "HS" ? 10 : 6}
        className="md:col-span-2"
      />
      {showStream && (
        <Select value={student.stream || ""} onValueChange={v => updateStudent("stream", v)}>
          <SelectTrigger className="md:col-span-3"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Commerce">Commerce</SelectItem>
            <SelectItem value="Science (Biology)">Science (Biology)</SelectItem>
            <SelectItem value="Computer Science">Computer Science</SelectItem>
          </SelectContent>
        </Select>
      )}
      <div className="md:col-span-4 flex items-center gap-3">
        {student.blobUrl ? (
          <div className="relative">
            <img src={student.blobUrl} alt="preview" className="w-20 h-20 rounded-full object-cover border-4 border-green-500" />
            <button onClick={() => {
              updateStudent("blobUrl", undefined);
              updateStudent("croppedBlob", undefined);
            }} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && openCropper(e.target.files[0], type, index)}
            />
            <div className="w-20 h-20 bg-gray-200 border-2 border-dashed rounded-full flex items-center justify-center hover:bg-gray-300 transition">
              <Upload className="h-8 w-8 text-gray-500" />
            </div>
          </label>
        )}
      </div>
      <Button variant="destructive" size="icon" onClick={removeStudent}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}