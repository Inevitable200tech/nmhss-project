// src/pages/admin-pages/admin-arts-science.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Upload,
  Star,
  Loader2,
  Image as ImageIcon,
  Home, // Added Home icon
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

type Grade = "A" | "B" | "C";
type SchoolSection = "HSS" | "HS" | "UP";
type CompetitionLevel = "State" | "District" | "Sub-District";

interface Achievement {
  id: string;
  name: string;
  item: string;
  grade: Grade;
  schoolSection: SchoolSection;
  competitionLevel: CompetitionLevel;
  groupMembers?: string[];
  mediaId?: string;
  photoUrl?: string;
  featured?: boolean;
  _tempFile?: File;
  _tempPreview?: string;
}

interface EventResult {
  totalA: number;
  totalB: number;
  totalC: number;
  totalParticipants: number;
  achievements: Achievement[];
}

interface ArtsScienceResult {
  year: number;
  kalolsavam: EventResult;
  sasthrosavam: EventResult;
}

const GradeOptions: Grade[] = ["A", "B", "C"];
const SectionOptions: SchoolSection[] = ["HSS", "HS", "UP"];
const LevelOptions: CompetitionLevel[] = ["State", "District", "Sub-District"];

async function uploadMediaFile(file: File): Promise<{ mediaId: string; photoUrl: string }> {
  const token = localStorage.getItem("adminToken");
  if (!token) throw new Error("Authentication required");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/media", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(err.message || "Failed to upload image");
  }

  const data = await res.json();
  return { mediaId: data.id, photoUrl: data.url };
}

export default function AdminArtsScience() {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [data, setData] = useState<ArtsScienceResult | null>(null);
  const [activeTab, setActiveTab] = useState<"Kalolsavam" | "Sasthrosavam">("Kalolsavam");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  // NEW STATE: Tracks if the initial years API call has completed
  const [hasYearsLoaded, setHasYearsLoaded] = useState(false);

  // Reference to hold the LATEST data for use in saveYear
  const dataRef = useRef<ArtsScienceResult | null>(null);

  const [newAchievement, setNewAchievement] = useState<Partial<Achievement>>({
    name: "",
    item: "",
    grade: "A",
    schoolSection: "HS",
    competitionLevel: "District",
    featured: false,
    groupMembers: [],
  });

  const currentEventKey = activeTab === "Kalolsavam" ? "kalolsavam" : "sasthrosavam";
  const currentEvent = data ? data[currentEventKey] : null;

  const recalc = (ach: Achievement[]) => ({
    totalA: ach.filter(a => a.grade === "A").length,
    totalB: ach.filter(a => a.grade === "B").length,
    totalC: ach.filter(a => a.grade === "C").length,
    totalParticipants: ach.length,
  });

  const updateData = (achievements: Achievement[]) => {
    if (!data) return;
    setData({
      ...data,
      [currentEventKey]: {
        ...recalc(achievements),
        achievements,
      },
    });
  };

  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Keep dataRef synchronized with data state
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, []);

  const saveYear = useCallback(async () => {
    // Read from dataRef.current to get the latest state
    const currentData = dataRef.current;
    if (!currentData || !selectedYear) return;

    setIsSaving(true);
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setIsSaving(false);
      return toast({ title: "Login required", variant: "destructive" });
    }

    try {
      const strip = (a: Achievement) => {
        const { _tempFile, _tempPreview, ...rest } = a;
        return { ...rest, groupMembers: rest.groupMembers?.filter(m => m.trim()) || undefined };
      };

      const body = {
        year: selectedYear,
        kalolsavam: { ...recalc(currentData.kalolsavam.achievements), achievements: currentData.kalolsavam.achievements.map(strip) },
        sasthrosavam: { ...recalc(currentData.sasthrosavam.achievements), achievements: currentData.sasthrosavam.achievements.map(strip) },
      };

      const res = await fetch("/api/arts-science-results", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      toast({ title: "Changes saved successfully" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [selectedYear]); // saveYear depends only on selectedYear

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    autoSaveTimeout.current = setTimeout(() => {
      saveYear();
    }, 800);
  }, [saveYear]); // triggerAutoSave depends on saveYear

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", variant: "destructive" });
      return;
    }

    try {
      toast({ title: "Uploading..." });
      const { mediaId, photoUrl } = await uploadMediaFile(file);
      const preview = URL.createObjectURL(file);

      if (index !== undefined) {
        const updated = [...currentEvent!.achievements];
        updated[index] = { ...updated[index], mediaId, photoUrl, _tempPreview: preview };
        updateData(updated);
        triggerAutoSave();
      } else {
        setNewAchievement(prev => ({ ...prev, mediaId, photoUrl, _tempPreview: preview }));
      }
      toast({ title: "Image uploaded successfully" });
    } catch (err: any) {
      toast({ title: err.message || "Upload failed", variant: "destructive" });
    }
  };

  const addAchievement = () => {
    if (!newAchievement.name?.trim() || !newAchievement.item?.trim()) {
      toast({ title: "Main participant name and Item are required", variant: "destructive" });
      return;
    }

    const full: Achievement = {
      id: Date.now().toString(),
      name: newAchievement.name!.trim(),
      item: newAchievement.item!.trim(),
      grade: newAchievement.grade ?? "A",
      schoolSection: newAchievement.schoolSection ?? "HS",
      competitionLevel: newAchievement.competitionLevel ?? "District",
      featured: newAchievement.featured || false,
      mediaId: newAchievement.mediaId,
      photoUrl: newAchievement.photoUrl,
      groupMembers:
        newAchievement.groupMembers
          ?.map(m => m.trim())
          .filter(Boolean).length
          ? newAchievement.groupMembers.map(m => m.trim()).filter(Boolean)
          : undefined,
    };

    // Update UI instantly
    updateData([...currentEvent!.achievements, full]);

    // Reset form
    setNewAchievement({
      name: "",
      item: "",
      grade: "A",
      schoolSection: "HS",
      competitionLevel: "District",
      featured: false,
      groupMembers: [],
      mediaId: undefined,
      photoUrl: undefined,
      _tempPreview: undefined,
    });

    setIsAddingNew(false);
    toast({ title: "Achievement added successfully" });

    // Auto-save shortly after
    triggerAutoSave();
  };

  const deleteAchievement = async (i: number) => {
    if (!window.confirm("Delete this achievement and its media? This cannot be undone.")) return;

    const ach = currentEvent!.achievements[i];
    const token = localStorage.getItem("adminToken");
    if (!token) {
      toast({ title: "Login required", variant: "destructive" });
      return;
    }

    // Try to delete media first
    if (ach.mediaId) {
      try {
        const res = await fetch(`/api/media/${ach.mediaId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to delete media");
        // Success: media deleted
      } catch {
        toast({
          title: "Warning: Could not delete image from server (achievement still removed)",
          variant: "destructive",
        });
      }
    }

    // Always remove from local state immediately
    updateData(currentEvent!.achievements.filter((_, idx) => idx !== i));
    toast({ title: "Achievement deleted" });

    // Auto-save changes
    triggerAutoSave();
  };

  const toggleFeature = (i: number) => {
    const updated = [...currentEvent!.achievements];
    // This logic ensures only ONE item is featured at a time per event
    if (!updated[i].featured) {
      // Unfeature all others in the current event first
      updated.forEach((a, idx) => {
        if (idx !== i) a.featured = false;
      });
    }
    updated[i].featured = !updated[i].featured;
    updateData(updated);
    // Trigger save after toggling feature
    triggerAutoSave();
  };

  // UPDATED useEffect to set hasYearsLoaded
  useEffect(() => {
    fetch("/api/arts-science-results/years")
      .then(r => r.json())
      .then((y: number[]) => {
        const sorted = y.sort((a, b) => b - a);
        setYears(sorted);
        if (!selectedYear && sorted.length) setSelectedYear(sorted[0]);
      })
      .catch(() => toast({ title: "Failed to load years", variant: "destructive" }))
      .finally(() => setHasYearsLoaded(true)); // Mark the initial year fetch as complete
  }, []);

  const loadYear = useCallback(async (year: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/arts-science-results/${year}`);
      if (res.status === 404) {
        setData({
          year, kalolsavam: { totalA: 0, totalB: 0, totalC: 0, totalParticipants: 0, achievements: [] },
          sasthrosavam: { totalA: 0, totalB: 0, totalC: 0, totalParticipants: 0, achievements: [] }
        });
        return;
      }
      if (!res.ok) throw new Error();
      const d: ArtsScienceResult = await res.json();
      setData(d);
    } catch {
      toast({ title: "Failed to load year data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { if (selectedYear) loadYear(selectedYear); }, [selectedYear, loadYear]);

  const handleAddNewYear = () => {
    const v = prompt("Enter Year (e.g., 2024)");
    if (!v) return;
    const year = Number(v);
    if (isNaN(year) || year < 1900) return toast({ title: "Invalid year", variant: "destructive" });
    if (!years.includes(year)) setYears(prev => [...prev, year].sort((a, b) => b - a));
    setSelectedYear(year);
    // If we just added the first year, hide the "No Years Found" message
    if (years.length === 0) {
        setHasYearsLoaded(true);
    }
  };

  const deleteYear = async () => {
    if (!selectedYear || !confirm("Delete this entire year? This will permanently remove all associated achievement data.")) return;
    const token = localStorage.getItem("adminToken");
    if (!token) return toast({ title: "Login required", variant: "destructive" });

    try {
      const res = await fetch(`/api/arts-science-results/${selectedYear}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();

      setYears(prev => {
        const filtered = prev.filter(y => y !== selectedYear);
        setSelectedYear(filtered[0] ?? null);
        return filtered;
      });
      setData(null);
      toast({ title: "Year deleted successfully" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleEditChange = (i: number, field: keyof Achievement, val: any) => {
    const arr = [...currentEvent!.achievements];
    arr[i] = { ...arr[i], [field]: val };
    updateData(arr);
    // Trigger save on every input change
    triggerAutoSave();
  };

  const renderPhoto = (a: Achievement) => {
    const url = a._tempPreview || a.photoUrl;
    return url ? (
      <img src={url} alt="Achievement" className="w-14 h-14 object-cover rounded-lg ring-2 ring-gray-700" />
    ) : (
      <div className="w-14 h-14 bg-gray-700 rounded-lg flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-gray-500" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto bg-gray-900 rounded-2xl shadow-xl overflow-hidden">

        {/* HEADER: Added Back to Dashboard Button & Mobile-Friendly Text Size */}
        <div className="bg-gradient-to-r from-cyan-900 to-blue-900 p-6 sm:p-8 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Arts & Science Results Admin</h1>
          <a href="/admin" className="px-3 sm:px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center gap-2 text-sm sm:text-base font-medium transition-colors">
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">Back To Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </a>
        </div>

        <div className="p-4 sm:p-8">

          {/* New Loading State for Initial Year Fetch */}
          {!hasYearsLoaded && (
            <div className="py-20 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-cyan-500" /></div>
          )}

          {/* New Prompt for Creating First Year */}
          {hasYearsLoaded && years.length === 0 && (
            <div className="py-20 text-center space-y-8 bg-gray-800 rounded-xl p-6 border-2 border-yellow-500/50">
                <h2 className="text-4xl font-extrabold text-yellow-500 flex items-center justify-center gap-3">
                    <X className="w-10 h-10" /> No Academic Years Found
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    The database contains no records for academic years. You must create the first year before you can enter any Kalolsavam or Sasthrosavam achievements.
                </p>
                <button onClick={handleAddNewYear}
                    className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center justify-center gap-3 text-lg font-semibold mx-auto transition-colors shadow-lg hover:shadow-cyan-500/50">
                    <Plus className="w-6 h-6" /> Create First Academic Year
                </button>
            </div>
          )}

          {/* Main Content (only renders if years are loaded and exist) */}
          {hasYearsLoaded && years.length > 0 && (
            <>
              {/* YEAR SELECT */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <span className="text-base sm:text-lg whitespace-nowrap">Academic Year:</span>
                  <select value={selectedYear || ""} onChange={e => setSelectedYear(Number(e.target.value))}
                    className="flex-1 min-w-0 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm sm:text-base">
                    {years.map(y => <option key={y} value={y}>{y}–{y + 1}</option>)}
                  </select>
                </div>
                <button onClick={handleAddNewYear}
                  className="w-full sm:w-auto px-5 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base">
                  <Plus className="w-5 h-5" /> Add New Year
                </button>
              </div>

              {isLoading || !data ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-cyan-500" /></div>
              ) : (
                <>
                  {/* TABS */}
                  <div className="flex border-b border-gray-800 mb-8 overflow-x-auto">
                    {["Kalolsavam", "Sasthrosavam"].map(t => (
                      <button key={t} onClick={() => setActiveTab(t as any)}
                        className={`px-4 sm:px-8 py-4 text-sm sm:text-lg font-semibold whitespace-nowrap ${activeTab === t ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-400 hover:text-gray-200"}`}>
                        {t}
                      </button>
                    ))}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold mb-6">{activeTab} Results</h2>

                  {/* STATS GRID: Changed to grid-cols-2 on mobile */}
                  {currentEvent && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10">
                      {[{ label: "A Grades", value: currentEvent.totalA }, { label: "B Grades", value: currentEvent.totalB },
                      { label: "C Grades", value: currentEvent.totalC }, { label: "Total Achievements", value: currentEvent.totalParticipants }]
                        .map((s, idx) => (
                          <div key={idx} className="bg-gray-800 p-4 sm:p-6 rounded-xl">
                            <p className="text-4xl sm:text-5xl font-black">{s.value}</p>
                            <p className="mt-2 opacity-80 text-sm sm:text-base">{s.label}</p>
                          </div>
                        ))}
                    </div>
                  )}

                  <div className="mb-6">
                    <button onClick={() => setIsAddingNew(true)}
                      className="w-full sm:w-auto px-5 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base">
                      <Plus className="w-5 h-5" /> Add New Achievement
                    </button>
                  </div>

                  {/* ADD NEW FORM (Responsive) */}
                  {isAddingNew && (
                    <div className="bg-gray-800/70 rounded-xl p-4 sm:p-6 mb-8 border border-gray-700">
                      <h3 className="text-xl font-semibold mb-4">New Achievement</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <input placeholder="Main Participant Name *" value={newAchievement.name || ""}
                          onChange={e => setNewAchievement(prev => ({ ...prev, name: e.target.value }))}
                          className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-sm" />
                        <input placeholder="Item / Event Name *" value={newAchievement.item || ""}
                          onChange={e => setNewAchievement(prev => ({ ...prev, item: e.target.value }))}
                          className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-sm" />
                        <select value={newAchievement.grade || "A"}
                          onChange={e => setNewAchievement(prev => ({ ...prev, grade: e.target.value as Grade }))}
                          className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-sm">
                          {GradeOptions.map(g => <option key={g}>{g}</option>)}
                        </select>
                        <select value={newAchievement.schoolSection || "HS"}
                          onChange={e => setNewAchievement(prev => ({ ...prev, schoolSection: e.target.value as SchoolSection }))}
                          className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-sm">
                          {SectionOptions.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <select value={newAchievement.competitionLevel || "District"}
                          onChange={e => setNewAchievement(prev => ({ ...prev, competitionLevel: e.target.value as CompetitionLevel }))}
                          className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-sm">
                          {LevelOptions.map(l => <option key={l}>{l}</option>)}
                        </select>

                        {/* Group Members */}
                        <div className="md:col-span-2 lg:col-span-3 space-y-3">
                          <label className="block text-sm font-medium">Additional Participants (Group Events)</label>
                          {newAchievement.groupMembers?.map((member, idx) => (
                            <div key={idx} className="flex items-center gap-3 group">
                              <div className="flex-1">
                                <input placeholder="Participant name" value={member}
                                  onChange={e => {
                                    const updated = [...(newAchievement.groupMembers || [])];
                                    updated[idx] = e.target.value;
                                    setNewAchievement(prev => ({ ...prev, groupMembers: updated }));
                                  }}
                                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-sm placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition" />
                              </div>
                              <button type="button" onClick={() => {
                                const updated = (newAchievement.groupMembers || []).filter((_, i) => i !== idx);
                                setNewAchievement(prev => ({ ...prev, groupMembers: updated.length ? updated : [] }));
                              }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-3 bg-red-600/20 hover:bg-red-600 rounded-lg border border-red-500/30 hover:border-red-500"
                                title="Remove participant">
                                <X className="w-5 h-5 text-red-400" />
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={() => setNewAchievement(prev => ({
                            ...prev, groupMembers: [...(prev.groupMembers || []), ""]
                          }))}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-900/30 hover:bg-cyan-900/50 rounded-lg border border-cyan-800 hover:border-cyan-700 transition">
                            <Plus className="w-4 h-4" /> Add another participant
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Photo</label>
                          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 text-sm">
                            <Upload className="w-5 h-5" /><span>Choose Image</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                          </label>
                          {newAchievement._tempPreview && (
                            <img src={newAchievement._tempPreview} alt="Preview" className="mt-3 w-32 h-32 object-cover rounded-lg border border-gray-600" />
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button onClick={addAchievement} className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 text-sm sm:text-base">
                          <Save className="w-5 h-5" /> Add Achievement
                        </button>
                        <button onClick={() => setIsAddingNew(false)} className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm sm:text-base">Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* TABLE: Wrapped in overflow-x-auto for mobile usability */}
                  <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1200px]">
                        <thead className="bg-gray-800">
                          <tr>
                            {["#", "Participants", "Item", "Grade", "Section", "Level", "Photo", "Upload", "Featured", "Actions"].map(h => (
                              <th key={h} className="px-2 py-4 text-left text-sm text-gray-300 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {currentEvent?.achievements?.map((ach, i) => {
                            const editing = editIndex === i;

                            return (
                              <tr key={ach.id} className="hover:bg-gray-800/40">
                                <td className="px-2 py-4 text-sm">{i + 1}</td>

                                {/* PARTICIPANTS: Removed min-w-[300px] as the table wrapper handles scroll */}
                                <td className="px-2 py-4">
                                  {editing ? (
                                    <div className="space-y-2 w-[300px] min-w-[300px]">
                                      <input placeholder="Main participant *" value={ach.name}
                                        onChange={e => handleEditChange(i, "name", e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:border-cyan-500 focus:outline-none transition" />

                                      {ach.groupMembers?.map((member, mi) => (
                                        <div key={mi} className="flex items-center gap-2 group">
                                          <div className="flex-1">
                                            <input value={member}
                                              onChange={e => {
                                                const updated = [...(ach.groupMembers || [])];
                                                updated[mi] = e.target.value;
                                                handleEditChange(i, "groupMembers", updated);
                                              }}
                                              placeholder="Participant name"
                                              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition" />
                                          </div>
                                          <button type="button" onClick={() => {
                                            const updated = (ach.groupMembers || []).filter((_, idx) => idx !== mi);
                                            handleEditChange(i, "groupMembers", updated.length ? updated : undefined);
                                          }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-600/20 hover:bg-red-600 rounded-lg border border-red-500/30 hover:border-red-500"
                                            title="Remove participant">
                                            <X className="w-4 h-4 text-red-400" />
                                          </button>
                                        </div>
                                      ))}

                                      <button type="button" onClick={() => {
                                        const updated = [...(ach.groupMembers || []), ""];
                                        handleEditChange(i, "groupMembers", updated);
                                      }}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-900/30 hover:bg-cyan-900/50 rounded-lg border border-cyan-800 hover:border-cyan-700 transition">
                                        <Plus className="w-3 h-3" /> Add
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="text-sm">
                                      <div className="font-medium">{ach.name}</div>
                                      {ach.groupMembers && ach.groupMembers.length > 0 && (
                                        <div className="text-gray-400 text-xs mt-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]" title={ach.groupMembers.join(", ")}>+ {ach.groupMembers.join(", ")}</div>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* ITEM */}
                                <td className="px-2 py-4 min-w-[150px]">
                                  {editing ? (
                                    <input value={ach.item} onChange={e => handleEditChange(i, "item", e.target.value)}
                                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm" />
                                  ) : <span className="text-sm">{ach.item}</span>}
                                </td>

                                {/* GRADE, SECTION, LEVEL */}
                                <td className="px-2 py-4">
                                  <select value={ach.grade} disabled={!editing}
                                    onChange={e => handleEditChange(i, "grade", e.target.value as Grade)}
                                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm">
                                    {GradeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                </td>
                                <td className="px-2 py-4">
                                  <select value={ach.schoolSection} disabled={!editing}
                                    onChange={e => handleEditChange(i, "schoolSection", e.target.value as SchoolSection)}
                                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm">
                                    {SectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                </td>
                                <td className="px-2 py-4">
                                  <select value={ach.competitionLevel} disabled={!editing}
                                    onChange={e => handleEditChange(i, "competitionLevel", e.target.value as CompetitionLevel)}
                                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm">
                                    {LevelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                </td>

                                <td className="px-2 py-4">{renderPhoto(ach)}</td>

                                <td className="px-2 py-4">
                                  <label className="cursor-pointer">
                                    <Upload className="w-5 h-5 text-cyan-400 hover:text-cyan-300" />
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, i)} />
                                  </label>
                                </td>

                                <td className="px-2 py-4 text-center">
                                  <button onClick={() => toggleFeature(i)} title="Toggle Featured">
                                    <Star className={`w-6 h-6 ${ach.featured ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`} />
                                  </button>
                                </td>

                                <td className="px-2 py-4">
                                  <div className="flex gap-2">
                                    {editing ? (
                                      <>
                                        <button onClick={() => setEditIndex(null)} title="Save/Complete Edit"
                                          className="p-2 bg-green-600 hover:bg-green-700 rounded-lg"><Save className="w-5 h-5" /></button>
                                        <button onClick={() => { setEditIndex(null); loadYear(selectedYear!); }} title="Cancel Edit"
                                          className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => setEditIndex(i)} title="Edit Achievement"
                                          className="p-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg"><Edit className="w-5 h-5" /></button>
                                        <button onClick={() => deleteAchievement(i)} title="Delete Achievement"
                                          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SAVE/DELETE BUTTONS */}
                  <div className="flex flex-col sm:flex-row justify-end mt-8 gap-3 sm:gap-4">
                    <button onClick={deleteYear}
                      className="w-full sm:w-auto px-6 py-3 bg-red-700 hover:bg-red-800 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base">
                      <Trash2 className="w-5 h-5" /> Delete Year
                    </button>
                    <button onClick={saveYear} disabled={isSaving}
                      className="w-full sm:w-auto px-6 py-3 bg-green-700 hover:bg-green-800 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Save All Changes
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}