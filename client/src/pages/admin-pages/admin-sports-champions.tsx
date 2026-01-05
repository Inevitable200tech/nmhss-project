'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Trash2, Plus, Save, Upload, X, Loader2, Trophy, CalendarPlus, Edit3, Star, ArrowLeft
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { insertOrUpdateSportsResultSchema, type InsertOrUpdateSportsResult } from '@shared/schema';
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";

const getPhotoUrl = (mediaId?: string) => mediaId ? `/api/media/${mediaId}` : undefined;
type ChampionLevel = 'HSS' | 'HS' | 'State' | 'District';

type ChampionForm = InsertOrUpdateSportsResult['champions'][number] & { photoUrl?: string; level: ChampionLevel };

export default function AdminSportsChampions() {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0); // Track overall save/upload progress
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const { playHoverSound, playErrorSound, playSuccessSound } = useSound();
  const [openYearDialog, setOpenYearDialog] = useState(false);
  const [openChampionDialog, setOpenChampionDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [isDeletingYear, setIsDeletingYear] = useState(false);
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Store champion files separately by index (files don't serialize in form data)
  const championFilesRef = useRef<Map<number, File>>(new Map());

  // Fixed 4 slots for slideshow - always 4 positions
  const [slideshowFiles, setSlideshowFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [slideshowPreviews, setSlideshowPreviews] = useState<(string | null)[]>([null, null, null, null]);
  const [slideshowMediaIds, setSlideshowMediaIds] = useState<string[]>(['', '', '', '']); // Fixed 4 empty slots

  const [tempChampion, setTempChampion] = useState<{
    name: string;
    event: string;
    position: 1 | 2 | 3;
    level: ChampionLevel;
    teamMembers: string;
    featured: boolean;
    mediaId?: string;
  }>({
    name: '', event: '', position: 1, level: 'HSS', teamMembers: '', featured: false
  });

  // Track last saved form state for detecting deletions
  const lastSavedFormRef = useRef<InsertOrUpdateSportsResult | null>(null);
  
  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleCancelImageUpload = () => {
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
      setIsImageUploading(false);
      setUploadProgress(0);
      toast({ title: "Upload cancelled", variant: "default" });
      playSuccessSound();
    }
  };

  const {
    register, control, handleSubmit, reset, watch, setValue, getValues,
    formState: { isDirty }
  } = useForm<InsertOrUpdateSportsResult>({
    resolver: zodResolver(insertOrUpdateSportsResultSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      gold: 0, silver: 0, bronze: 0,
      totalNationalMedals: 0, totalParticipants: 0,
      events: [], champions: [], slideshowImages: []
    }
  });

  const { fields: events, append: addEvent, remove: removeEvent } = useFieldArray({ control, name: 'events' });
  const { fields: champions, append: addChampion, update: updateChampion, remove: removeChampion } = useFieldArray({ control, name: 'champions' });

  const watchedEvents = watch('events');
  const watchedChampions = watch('champions') as ChampionForm[] || [];

  const featuredHS = useMemo(() => watchedChampions.find(c => c.level === 'HS' && c.featured), [watchedChampions]);
  const featuredHSS = useMemo(() => watchedChampions.find(c => c.level === 'HSS' && c.featured), [watchedChampions]);

  const fetchYears = useCallback(() => {
    fetch('/api/sports-results/years')
      .then(r => r.json())
      .then(d => setYears(Array.isArray(d) ? d.sort((a: number, b: number) => b - a) : []))
      .catch(() => toast({ title: "Error", description: "Failed to fetch years.", variant: "destructive" }));
  }, []);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const g = watch('gold') || 0;
    const s = watch('silver') || 0;
    const b = watch('bronze') || 0;
    setValue('totalNationalMedals', g + s + b, { shouldDirty: true });
  }, [watch('gold'), watch('silver'), watch('bronze'), setValue]);

  useEffect(() => {
    if (!selectedYear) return;
    setIsLoading(true);
    fetch(`/api/sports-results/${selectedYear}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          reset({
            year: data.year,
            gold: data.gold || 0,
            silver: data.silver || 0,
            bronze: data.bronze || 0,
            totalNationalMedals: data.totalNationalMedals || 0,
            totalParticipants: data.totalParticipants || 0,
            events: data.events || [],
            champions: (data.champions || []).map((c: any) => ({
              ...c,
              photoUrl: getPhotoUrl(c.mediaId),
              featured: !!c.featured,
              level: c.level || 'HSS'
            })),
            slideshowImages: data.slideshowImages || []
          });
          
          // Track last saved form state for detecting deletions
          lastSavedFormRef.current = JSON.parse(JSON.stringify({
            year: data.year,
            gold: data.gold || 0,
            silver: data.silver || 0,
            bronze: data.bronze || 0,
            totalNationalMedals: data.totalNationalMedals || 0,
            totalParticipants: data.totalParticipants || 0,
            events: data.events || [],
            champions: data.champions || [],
            slideshowImages: data.slideshowImages || []
          }));
          setHasUnsavedChanges(false);

          // Load into fixed 4 slots (pad with empty if less than 4)
          const loadedMediaIds = (data.slideshowImages || []).map((img: any) => img.mediaId || '');
          const paddedMediaIds = [...loadedMediaIds, ...Array(4 - loadedMediaIds.length).fill('')].slice(0, 4);
          setSlideshowMediaIds(paddedMediaIds);

          const previews = paddedMediaIds.map(id => getPhotoUrl(id) || null);
          setSlideshowPreviews(previews);

        } else {
          reset({ year: selectedYear, gold: 0, silver: 0, bronze: 0, totalNationalMedals: 0, totalParticipants: 0, events: [], champions: [], slideshowImages: [] });
          lastSavedFormRef.current = null;
          setHasUnsavedChanges(false);
          setSlideshowPreviews([null, null, null, null]);
          setSlideshowMediaIds(['', '', '', '']);
        }
      })
      .finally(() => setIsLoading(false));
  }, [selectedYear, reset]);

  const openChampion = (index?: number) => {
    
    if (index === undefined && watchedEvents.length === 0) {
      playErrorSound();
      return toast({ title: "Error", description: "Please add at least one event before adding champions.", variant: "destructive" });
    }

    if (index !== undefined) {
      const c = champions[index] as ChampionForm;
      setTempChampion({
        name: c.name || '',
        event: c.event || '',
        position: c.position || 1,
        level: c.level || 'HSS',
        teamMembers: Array.isArray(c.teamMembers) ? c.teamMembers.join(', ') : '',
        featured: !!c.featured,
        mediaId: c.mediaId
      });
      setImagePreviewUrl(c.photoUrl ?? null);
      setImageFile(null);
      setEditingIndex(index);
    } else {
      setTempChampion({ name: '', event: watchedEvents[0]?.name || '', position: 1, level: 'HSS', teamMembers: '', featured: false });
      setImagePreviewUrl(null);
      setImageFile(null);
      setEditingIndex(null);
    }
    setOpenChampionDialog(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSlideshowImageChange = (index: number, file: File | null) => {
    const newFiles = [...slideshowFiles];
    newFiles[index] = file;
    setSlideshowFiles(newFiles);

    const newPreviews = [...slideshowPreviews];
    if (file) {
      newPreviews[index] = URL.createObjectURL(file);
    } else {
      newPreviews[index] = null;
    }
    setSlideshowPreviews(newPreviews);
  };

  const onMainFormSubmit = async (data: InsertOrUpdateSportsResult) => {

    if (isLoading || !selectedYear) return;
    const confirmed = window.confirm(
      "Are you sure you want to save these changes? This will overwrite the current data."
    );

    if (!confirmed) return;

    setIsLoading(true);
    setOverallProgress(0);
    uploadAbortControllerRef.current = new AbortController();
    const uploadedMediaIds: string[] = []; // Track for rollback
    
    try {
      // STEP 0: Delete orphaned champion media from removed champions
      setOverallProgress(10);
      if (lastSavedFormRef.current) {
        const deletedChampions = lastSavedFormRef.current.champions.filter(
          orig => !data.champions.some(curr => curr.mediaId === orig.mediaId && curr.name === orig.name)
        );
        
        for (const champion of deletedChampions) {
          if (champion.mediaId) {
            await deleteMedia(champion.mediaId).catch(() => {});
          }
        }
      }

      // STEP 1: Upload champion photos that have files in the ref
      setOverallProgress(20);
      const championsWithUploadedMedia = await Promise.all(
        data.champions.map(async (champ: any, index: number) => {
          // Check if this champion has a file in the ref
          const file = championFilesRef.current.get(index);
          if (file) {
            try {
              // Check if abort was signaled
              if (uploadAbortControllerRef.current?.signal.aborted) {
                throw new Error('Upload cancelled');
              }

              const fd = new FormData();
              fd.append('file', file);
              
              const res = await fetch('/api/media', {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`, 'X-Requested-With': 'SchoolConnect-App' },
                body: fd,
                signal: uploadAbortControllerRef.current?.signal
              });
              
              if (!res.ok) throw new Error('Upload failed');
              const json = await res.json();
              
              // Track uploaded media for rollback if needed
              uploadedMediaIds.push(json.id);
              
              // Clear from ref after successful upload
              championFilesRef.current.delete(index);
              
              return {
                ...champ,
                mediaId: json.id,
                photoUrl: getPhotoUrl(json.id)
              };
            } catch (err) {
              toast({ title: "Error", description: "Failed to upload champion photo", variant: "destructive" });
              playErrorSound();
              throw err;
            }
          }
          // Remove photoUrl if no mediaId (it's just for UI display)
          const { photoUrl, ...rest } = champ;
          return rest.mediaId 
            ? { ...rest, photoUrl: getPhotoUrl(rest.mediaId) }
            : rest;
        })
      );
      setOverallProgress(50);

      // STEP 2: Upload slideshow images that have files
      const uploadedSlideshowMediaIds: string[] = [];
      for (let i = 0; i < 4; i++) {
        const file = slideshowFiles[i];
        if (file) {
          try {
            // Check if abort was signaled
            if (uploadAbortControllerRef.current?.signal.aborted) {
              throw new Error('Upload cancelled');
            }

            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/media', {
              method: 'POST',
              headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`, 'X-Requested-With': 'SchoolConnect-App' },
              body: fd,
              signal: uploadAbortControllerRef.current?.signal
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Slideshow upload failed');
            uploadedSlideshowMediaIds[i] = json.id;
            uploadedMediaIds.push(json.id); // Track for rollback
          } catch (err) {
            toast({ title: "Error", description: "Failed to upload slideshow image", variant: "destructive" });
            playErrorSound();
            throw err;
          }
        } else {
          uploadedSlideshowMediaIds[i] = slideshowMediaIds[i] || '';
        }
        // Update progress for each slideshow image
        setOverallProgress(50 + ((i + 1) / 4) * 30);
      }

      // Filter non-empty for form array
      const finalSlideshowImages = uploadedSlideshowMediaIds
        .filter(id => id && id !== '')
        .map(id => ({ mediaId: id }));

      setOverallProgress(80);
      // Check if abort was signaled before final save
      if (uploadAbortControllerRef.current?.signal.aborted) {
        throw new Error('Upload cancelled');
      }

      const res = await fetch('/api/admin/sports-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        body: JSON.stringify({ ...data, champions: championsWithUploadedMedia, slideshowImages: finalSlideshowImages }),
        signal: uploadAbortControllerRef.current?.signal
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast({ title: "Error", description: errorData.error || 'Save failed', variant: "destructive" });
        playErrorSound();
        throw new Error(errorData.error || 'Failed to save');
      }

      setOverallProgress(90);
      toast({
        title: "Saved successfully",
        description: "All champions and photos uploaded and saved.",
      });
      playSuccessSound();

      // Re-fetch and reload into fixed slots
      await fetch(`/api/sports-results/${selectedYear}`)
        .then(r => r.json())
        .then(freshData => {
          const loadedMediaIds = (freshData.slideshowImages || []).map((img: any) => img.mediaId || '');
          const paddedMediaIds = [...loadedMediaIds, ...Array(4 - loadedMediaIds.length).fill('')].slice(0, 4);
          setSlideshowMediaIds(paddedMediaIds);

          const previews = paddedMediaIds.map(id => getPhotoUrl(id) || null);
          setSlideshowPreviews(previews);
          
          // Track last saved form state for detecting future deletions
          lastSavedFormRef.current = JSON.parse(JSON.stringify({
            year: freshData.year,
            gold: freshData.gold || 0,
            silver: freshData.silver || 0,
            bronze: freshData.bronze || 0,
            totalNationalMedals: freshData.totalNationalMedals || 0,
            totalParticipants: freshData.totalParticipants || 0,
            events: freshData.events || [],
            champions: freshData.champions || [],
            slideshowImages: freshData.slideshowImages || []
          }));
          setHasUnsavedChanges(false); // Clear unsaved changes flag after successful save
        });

      // Clean up blob URLs and reset files
      slideshowPreviews.forEach(url => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      setSlideshowFiles([null, null, null, null]);
      
      // Clear champion files ref
      championFilesRef.current.clear();
      
      setOverallProgress(100);
    } catch (error: any) {
      // ROLLBACK: Delete all successfully uploaded media on failure
      if (uploadedMediaIds.length > 0) {
        toast({
          title: "Cleaning up...",
          description: `Upload failed. Removing ${uploadedMediaIds.length} orphaned file(s) from storage...`,
          variant: "default"
        });
        
        for (const mediaId of uploadedMediaIds) {
          try {
            await fetch(`/api/media/${mediaId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`, 'X-Requested-With': 'SchoolConnect-App' }
            });
          } catch (deleteErr) {
            console.warn(`Failed to delete orphaned media ${mediaId}:`, deleteErr);
          }
        }
      }

      toast({
        title: "Error",
        description: error.message === 'Upload cancelled' ? 'Upload cancelled. All uploaded files have been cleaned up.' : (error.message || 'Save failed'),
        variant: "destructive"
      });
      playErrorSound();
    } finally {
      setIsLoading(false);
      setIsImageUploading(false);
      setOverallProgress(0);
      uploadAbortControllerRef.current = null;
    }
  };

  const saveChampion = async () => {
    if (!tempChampion.name.trim()){ playErrorSound(); return toast({ title: "Error", description: "Name required", variant: "destructive" });}
    if (!tempChampion.event) { playErrorSound(); return toast({ title: "Error", description: "Event required", variant: "destructive" }); }

    const payload = {
      name: tempChampion.name.trim(),
      event: tempChampion.event,
      position: tempChampion.position,
      level: tempChampion.level,
      teamMembers: tempChampion.teamMembers.split(',').map(s => s.trim()).filter(Boolean),
      mediaId: tempChampion.mediaId,
      featured: tempChampion.featured,
      photoUrl: imagePreviewUrl // For UI display only
    };

    const championWithPhoto = { ...payload } as ChampionForm;
    let newChampionsArray = [...watchedChampions];

    if (payload.featured && (payload.level === 'HS' || payload.level === 'HSS')) {
      newChampionsArray = watchedChampions.map((c, idx) => {
        if (idx === editingIndex) return championWithPhoto;
        if (c.level === payload.level) return { ...c, featured: false };
        return c;
      });
      if (editingIndex === null) newChampionsArray.push(championWithPhoto);
      setValue('champions', newChampionsArray as any, { shouldDirty: true });
    } else {
      if (editingIndex !== null) {
        updateChampion(editingIndex, championWithPhoto);
        newChampionsArray[editingIndex] = championWithPhoto;
      } else {
        addChampion(championWithPhoto as any);
        newChampionsArray.push(championWithPhoto);
      }
    }

    // Store the file in ref, keyed by the champion's index
    if (imageFile) {
      const champIndex = editingIndex !== null ? editingIndex : newChampionsArray.length - 1;
      championFilesRef.current.set(champIndex, imageFile);
    }

    setOpenChampionDialog(false);
    toast({
      title: "Champion saved locally. Click 'Save All' to upload and finalize.",
      description: "Photo will be uploaded when you click Save All."
    });
    playSuccessSound();
    const currentFormData = getValues();
    currentFormData.champions = newChampionsArray;
    reset(currentFormData, { keepDirty: true });
    
    // Clear the image state for next champion
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const deleteMedia = async (mediaId: string) => {
    try {
      await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`, 'X-Requested-With': 'SchoolConnect-App' },
      });
    } catch (e) {
      console.error('Media deletion failed:', e);
      toast({ title: "Error", description: "Failed to delete media.", variant: "destructive" });
      playErrorSound();
    }
  };

  const handleRemoveChampion = async (index: number) => {
    const championToRemove = watchedChampions[index];

    if (!window.confirm(`Delete champion: ${championToRemove.name}?`)) return;

    // Clear file from ref if it exists
    championFilesRef.current.delete(index);
    
    removeChampion(index);
    
    toast({ title: "Champion removed. Saving...", variant: "default" });
    playSuccessSound();
    
    // Trigger immediate save to ensure atomic deletion
    const newChampionsArray = watchedChampions.filter((_, i) => i !== index);
    const currentFormData = getValues();
    currentFormData.champions = newChampionsArray;
    await onMainFormSubmit(currentFormData);
  };

  const handleDeleteYear = async () => {
    if (!selectedYear || !window.confirm(`Delete year ${selectedYear} and all data?`)) return;

    setIsDeletingYear(true);
    try {
      const res = await fetch(`/api/admin/sports-results/${selectedYear}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast({ title: "Success", description: `Year ${selectedYear} deleted` });
      playSuccessSound();
      setYears(prev => prev.filter(y => y !== selectedYear));
      setSelectedYear(null);
      reset();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || 'Deletion failed', variant: "destructive" });
      playErrorSound();
    } finally {
      setIsDeletingYear(false);
    }
  };

  const isFeaturedDisabled = useMemo(() => {
    if (tempChampion.level !== 'HS' && tempChampion.level !== 'HSS') return true;
    const currentFeatured = tempChampion.level === 'HS' ? featuredHS : featuredHSS;
    if (currentFeatured) {
      if (editingIndex !== null && watchedChampions[editingIndex]?.level === tempChampion.level && watchedChampions[editingIndex]?.featured) return false;
      return true;
    }
    return false;
  }, [tempChampion.level, featuredHS, featuredHSS, editingIndex, watchedChampions]);

  const handleGoToDashboard = () => {
    window.location.href = '/admin';
  };

  // Helper to remove slideshow image from slot i
  const removeSlideshowImage = async (index: number) => {
  // Immediately clear the UI slot (no waiting for save)
  if (slideshowPreviews[index]?.startsWith('blob:')) {
    URL.revokeObjectURL(slideshowPreviews[index]!);
  }

  const newPreviews = [...slideshowPreviews];
  newPreviews[index] = null;
  setSlideshowPreviews(newPreviews);

  const newFiles = [...slideshowFiles];
  newFiles[index] = null;
  setSlideshowFiles(newFiles);

  const newMediaIds = [...slideshowMediaIds];
  newMediaIds[index] = '';
  setSlideshowMediaIds(newMediaIds);

  // Mark form as dirty so "Save All" button enables
  setValue('slideshowImages', newMediaIds.filter(id => id && id !== '').map(id => ({ mediaId: id })), { shouldDirty: true });

  // Permanently delete the file from storage immediately (keeps storage clean)
  if (slideshowMediaIds[index]) {
    try {
      await fetch(`/api/media/${slideshowMediaIds[index]}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
      });
      toast({ title: "Deleted", description: "Image permanently removed from storage." });
      playSuccessSound();
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete image from storage.", variant: "destructive" });
      playErrorSound();
    }
  } else {
    toast({ title: "Removed", description: "Image cleared. Click 'Save All' to confirm changes." });
    playSuccessSound();
  }
};

return (
  <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-black p-4">
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header (Main Save Button) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold text-orange-600 flex items-center gap-3">
              <Trophy className="w-9 h-9" /> Sports Admin
            </h1>
            {selectedYear && (
              <Badge className="self-start mt-2 bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200">
                Editing: {selectedYear}–{selectedYear + 1}
              </Badge>
            )}
          </div>

          {/* Action Buttons - Stacked on mobile, horizontal on larger screens */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleGoToDashboard} onMouseEnter={playHoverSound}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
            <Select value={selectedYear?.toString()} onValueChange={v => setSelectedYear(v ? Number(v) : null)}>
              <SelectTrigger className="w-40" onMouseEnter={playHoverSound}><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}–{y + 1}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setOpenYearDialog(true)} onMouseEnter={playHoverSound}>
              <CalendarPlus className="w-4 h-4 mr-1" /> New Year
            </Button>
            {selectedYear && (
              <Button size="sm" variant="destructive" onClick={handleDeleteYear} disabled={isDeletingYear} onMouseEnter={playHoverSound}>
                {isDeletingYear ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />} Delete Year
              </Button>
            )}
            <Button size="sm" onClick={handleSubmit(onMainFormSubmit)} disabled={isLoading || !selectedYear} onMouseEnter={playHoverSound}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save All
            </Button>
          </div>

          {/* Progress Bar during save/upload */}
          {isLoading && overallProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {overallProgress < 20 ? "Cleaning up..." : overallProgress < 50 ? "Uploading champions..." : overallProgress < 80 ? "Uploading slides..." : "Saving to database..."}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-orange-600">{overallProgress}%</span>
                  <Button size="sm" variant="destructive" onClick={handleCancelImageUpload} onMouseEnter={playHoverSound}>
                    Cancel
                  </Button>
                </div>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {!selectedYear ? (
        <Card className="text-center py-16">
          <CardTitle>Select or create a year to begin editing sports results.</CardTitle>
          <Button className="mt-6" onClick={() => setOpenYearDialog(true)} onMouseEnter={playHoverSound}><Plus className="w-5 h-5 mr-2" /> New Year</Button>
        </Card>
      ) : (
        <>
          {/* Slideshow Images Upload */}
          <Card>
            <CardHeader><CardTitle>Slideshow Images (up to 4)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <Label>Image {i + 1}</Label>
                    {!slideshowPreviews[i] ? (
                      <label className="block border-2 border-dashed border-orange-300 rounded-xl p-4 text-center cursor-pointer hover:border-orange-500 h-40 flex items-center justify-center" onMouseEnter={playHoverSound}>
                        <Upload className="w-8 h-8 text-orange-400" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleSlideshowImageChange(i, e.target.files?.[0] || null)} />
                      </label>
                    ) : (
                      <div className="relative">
                        <img src={slideshowPreviews[i]!} alt={`Slide ${i + 1}`} className="w-full h-40 object-cover rounded-xl" />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => removeSlideshowImage(i)}
                          disabled={isLoading}
                          onMouseEnter={playHoverSound}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Click the X on any image to <strong>permanently delete it from storage and database</strong>.<br />
                The slot will be cleared immediately and changes saved automatically.
              </p>
            </CardContent>
          </Card>

          {/* Top Champions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(['HSS', 'HS'] as const).map(level => {
              const champ = watchedChampions.find((c: any) => c.level === level && c.featured);
              return (
                <Card key={level} className="overflow-hidden">
                  <CardHeader className={`bg-gradient-to-r ${level === 'HSS' ? 'from-orange-600 to-red-600' : 'from-blue-600 to-cyan-600'} text-white`}>
                    <CardTitle className="flex items-center justify-between">
                      {level === 'HSS' ? 'Higher Secondary' : 'High School'} Top Champion
                      <Star className="w-7 h-7" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {champ ? (
                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        <img
                          src={champ.photoUrl || '/placeholder.svg'}
                          alt={champ.name}
                          className="w-32 h-32 rounded-full object-cover border-4 border-orange-200 shadow-xl flex-shrink-0"
                          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                        />
                        <div className="text-center sm:text-left">
                          <h3 className="text-2xl font-bold">{champ.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{champ.event}</p>
                          <Badge className={`text-xs ${champ.position === 1 ? 'bg-yellow-500' : champ.position === 2 ? 'bg-gray-400' : 'bg-orange-700'}`}>
                            {champ.position === 1 ? 'Gold' : champ.position === 2 ? 'Silver' : 'Bronze'}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8 italic">No top champion selected</p>
                    )}
                    <Button
                      className="w-full mt-6"
                      disabled={watchedChampions.length === 0}
                      onClick={() => toast({ title: "Success", description: "Use the 'All Champions' section below to set a champion as 'Top Champion'." })}
                      variant="secondary"
                      onMouseEnter={playHoverSound}
                    >
                      {watchedChampions.length === 0 ? 'Add Champions First' : 'See Champions List'}
                    </Button>
                    <p className='text-xs text-center text-gray-400 mt-2'>*Set 'Top Champion' in the 'All Champions' list below.</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Medal Stats */}
          <Card>
            <CardHeader><CardTitle>Medal Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-center">
                {['gold', 'silver', 'bronze', 'totalNationalMedals', 'totalParticipants'].map(field => (
                  <div key={field} className="space-y-1">
                    <Label className="text-sm text-gray-600 dark:text-gray-400">
                      {field === 'totalNationalMedals' ? 'Total Medals' : field === 'totalParticipants' ? 'Participants' : field.charAt(0).toUpperCase() + field.slice(1)}
                    </Label>
                    <Input
                      type="number"
                      {...register(field as any, { valueAsNumber: true })}
                      disabled={field === 'totalNationalMedals'}
                      className="text-2xl font-bold text-center mt-1 focus:border-orange-500"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Events */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Events</CardTitle>
              <Button size="sm" onClick={() => addEvent({ name: '', category: 'Individual' })} onMouseEnter={playHoverSound}>
                <Plus className="w-4 h-4 mr-1" /> Add Event
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.length === 0 && <p className="text-gray-500 text-center py-4">No events added. Champions require events.</p>}
              {events.map((e, i) => (
                <div key={e.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <Input {...register(`events.${i}.name`)} placeholder="Event name (e.g., 100m Sprint, Badminton)" className="flex-1 focus:border-orange-500" />
                  <Select value={watch(`events.${i}.category`)} onValueChange={v => setValue(`events.${i}.category`, v as any)}>
                    <SelectTrigger className="w-full sm:w-40" onMouseEnter={playHoverSound}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 self-end sm:self-center" onClick={() => removeEvent(i)} onMouseEnter={playHoverSound}><X className="w-4 h-4" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* All Champions */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>All Champions ({champions.length})</CardTitle>
              <Button size="sm" onClick={() => openChampion()} disabled={watchedEvents.length === 0} onMouseEnter={playHoverSound}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {champions.length === 0 ? (
                <p className="text-center text-gray-500 py-10">
                  {watchedEvents.length === 0 ? "First, add events above." : "No champions added yet. Click 'Add' to start."}
                </p>
              ) : (
                champions.map((c: any, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                    <img
                      src={c.photoUrl || '/placeholder.svg'}
                      alt={c.name}
                      className="w-24 h-24 rounded-full object-cover flex-shrink-0 border-2 border-orange-300 self-center sm:self-start"
                      onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200">{(c.level as ChampionLevel)}</Badge>
                            <span className="font-semibold text-lg truncate">{c.name}</span>
                            {c.featured && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>{c.event}</span>
                            <span>•</span>
                            <Badge className={`text-xs ${c.position === 1 ? 'bg-yellow-500' : c.position === 2 ? 'bg-gray-400' : 'bg-orange-700'}`}>
                              {c.position === 1 ? 'Gold' : c.position === 2 ? 'Silver' : 'Bronze'}
                            </Badge>
                          </div>
                          {c.teamMembers?.length > 0 && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">Team: {c.teamMembers.join(', ')}</p>}
                        </div>
                        <div className="flex gap-2 self-end sm:self-center">
                          <Button size="icon" variant="outline" className='w-10 h-10' onClick={() => openChampion(i)} onMouseEnter={playHoverSound}><Edit3 className="w-4 h-4" /></Button>
                          <Button size="icon" variant="destructive" className='w-10 h-10' onClick={() => handleRemoveChampion(i)} onMouseEnter={playHoverSound}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Year Dialog */}
      <Dialog open={openYearDialog} onOpenChange={setOpenYearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create New Year</DialogTitle></DialogHeader>
          <Label htmlFor="newYear">Enter Academic Year Start (e.g., 2025 for 2025–2026)</Label>
          <Input id="newYear" type="number" value={newYear} onChange={e => setNewYear(e.target.value)} placeholder="2025" className='focus:border-orange-500' />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenYearDialog(false)} onMouseEnter={playHoverSound}>Cancel</Button>
            <Button onClick={() => {
              const y = Number(newYear);
              if (y >= 2000 && y <= 2100 && !years.includes(y)) {
                setYears(p => [y, ...p].sort((a, b) => b - a));
                setSelectedYear(y);
                reset({ year: y, gold: 0, silver: 0, bronze: 0, totalNationalMedals: 0, totalParticipants: 0, events: [], champions: [], slideshowImages: [] });
                setOpenYearDialog(false);
                toast({ title: "Success", description: `Year ${y} created` });
              } else {
                toast({ title: "Error", description: years.includes(y) ? 'Year already exists.' : 'Invalid year (must be 2000-2100).', variant: "destructive" });
              }
            }} onMouseEnter={playHoverSound}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Champion Dialog */}
      <Dialog open={openChampionDialog} onOpenChange={setOpenChampionDialog}>
        <DialogContent className="max-w-2xl w-full mx-4 overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle>{editingIndex !== null ? 'Edit' : 'Add'} Champion</DialogTitle></DialogHeader>

          {isLoading && <div className='absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-50 rounded-lg'><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>}

          {/* Stack columns on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Photo Uploader */}
            <div className="space-y-3">
              <Label>Photo (Raw Upload)</Label>
              {!imagePreviewUrl ? (
                <label className="block mt-1 border-2 border-dashed border-orange-300 rounded-xl p-6 text-center cursor-pointer hover:border-orange-500 h-48 flex flex-col justify-center items-center" onMouseEnter={playHoverSound}>
                  <Upload className="w-12 h-12 mx-auto text-orange-400" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Tap to upload (1:1 aspect ratio recommended)</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="relative w-full overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700">
                    <img src={imagePreviewUrl} alt="Preview" className="w-full object-contain max-h-72 mx-auto" />
                  </div>
                  <Button size="sm" variant="outline" className='w-full' onClick={() => {
                    if (imagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
                    setImagePreviewUrl(null); setImageFile(null);
                  }} onMouseEnter={playHoverSound}>
                    <X className="w-4 h-4 mr-2" /> Remove/Change Photo
                  </Button>
                </div>
              )}
            </div>

            {/* Champion Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Champion Name</Label>
                <Input id="name" value={tempChampion.name} onChange={e => setTempChampion(p => ({ ...p, name: e.target.value }))} className='focus:border-orange-500' />
              </div>

              <div>
                <Label htmlFor="event">Event</Label>
                <Select value={tempChampion.event} onValueChange={v => setTempChampion(p => ({ ...p, event: v }))}>
                  <SelectTrigger className="w-full" onMouseEnter={playHoverSound}><SelectValue placeholder="Select Event" /></SelectTrigger>
                  <SelectContent>{watchedEvents.map(e => <SelectItem key={e.name} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Select value={String(tempChampion.position)} onValueChange={v => setTempChampion(p => ({ ...p, position: Number(v) as 1 | 2 | 3 }))}>
                    <SelectTrigger className="w-full" onMouseEnter={playHoverSound}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st (Gold)</SelectItem>
                      <SelectItem value="2">2nd (Silver)</SelectItem>
                      <SelectItem value="3">3rd (Bronze)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Select value={tempChampion.level} onValueChange={v => setTempChampion(p => ({ ...p, level: v as ChampionLevel }))}>
                    <SelectTrigger className="w-full" onMouseEnter={playHoverSound}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HSS">HSS</SelectItem>
                      <SelectItem value="HS">HS</SelectItem>
                      <SelectItem value="State">State</SelectItem>
                      <SelectItem value="District">District</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {tempChampion.event && watchedEvents.find(e => e.name === tempChampion.event)?.category === 'Team' && (
                <div>
                  <Label htmlFor="teamMembers">Team Members (Comma-separated)</Label>
                  <Input id="teamMembers" value={tempChampion.teamMembers} onChange={e => setTempChampion(p => ({ ...p, teamMembers: e.target.value }))} placeholder="Rahul, Amit, Suresh" className='focus:border-orange-500' />
                </div>
              )}

              <div className='flex items-center space-x-2 pt-2'>
                <Checkbox id="featured" checked={tempChampion.featured} onCheckedChange={checked => setTempChampion(p => ({ ...p, featured: !!checked }))} disabled={isFeaturedDisabled} />
                <Label htmlFor="featured" className="text-sm font-medium">Set as Top Champion (HSS/HS only)</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button variant="outline" onClick={() => setOpenChampionDialog(false)} className="w-full sm:w-auto" onMouseEnter={playHoverSound}>Cancel</Button>
            <Button onClick={saveChampion} disabled={isLoading || !tempChampion.name.trim() || !tempChampion.event} className="w-full sm:w-auto" onMouseEnter={playHoverSound}>
              {editingIndex !== null ? (
                'Update Champion'
              ) : (
                'Add Champion'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
)
};