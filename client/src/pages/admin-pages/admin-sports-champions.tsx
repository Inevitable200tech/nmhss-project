// src/pages/admin-pages/admin-sports-champions.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
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
// Assuming the following import path is correct for your project structure
import { insertOrUpdateSportsResultSchema, type InsertOrUpdateSportsResult } from '@shared/schema';

// Helper to determine the photo URL based on mediaId
const getPhotoUrl = (mediaId?: string) => mediaId ? `/api/media/${mediaId}` : undefined;

type ChampionLevel = 'HSS' | 'HS' | 'State' | 'District';

type ChampionForm = InsertOrUpdateSportsResult['champions'][number] & { photoUrl?: string, level: ChampionLevel };


export default function AdminSportsChampions() {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openYearDialog, setOpenYearDialog] = useState(false);
  const [openChampionDialog, setOpenChampionDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [isDeletingYear, setIsDeletingYear] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [tempChampion, setTempChampion] = useState<{
    name: string;
    event: string;
    position: 1 | 2 | 3;
    level: ChampionLevel;
    teamMembers: string; // Comma-separated string for input
    featured: boolean;
    mediaId?: string; // Stored ID
  }>({
    name: '', event: '', position: 1, level: 'HSS', teamMembers: '', featured: false, mediaId: undefined
  });

  const {
    register, control, handleSubmit, reset, watch, setValue, getValues,
    formState: { isDirty }
  } = useForm<InsertOrUpdateSportsResult>({
    resolver: zodResolver(insertOrUpdateSportsResultSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      gold: 0, silver: 0, bronze: 0,
      totalNationalMedals: 0, totalParticipants: 0,
      events: [], champions: []
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
      .catch(() => toast.error('Failed to load years'));
  }, []);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

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
            }))
          });
        } else {
          reset({ year: selectedYear, gold: 0, silver: 0, bronze: 0, totalNationalMedals: 0, totalParticipants: 0, events: [], champions: [] });
        }
      })
      .finally(() => setIsLoading(false));
  }, [selectedYear, reset]);

  const openChampion = (index?: number) => {
    if (index === undefined && watchedEvents.length === 0) {
      return toast.error("Please add at least one event before adding champions.");
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
      setImagePreviewUrl((c.photoUrl ?? null) as string | null);
      setImageFile(null);
      setEditingIndex(index);
    } else {
      setTempChampion({ name: '', event: watchedEvents[0]?.name || '', position: 1, level: 'HSS', teamMembers: '', featured: false, mediaId: undefined });
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
    // Create a temporary URL for preview
    setImagePreviewUrl(URL.createObjectURL(file));
  };


  // 1. EXTRACTED MAIN SUBMISSION LOGIC
  const onMainFormSubmit = async (data: InsertOrUpdateSportsResult) => {
    if (isLoading || !selectedYear) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/sports-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save data on the server.');
      }

      toast.success('Changes saved successfully!');
      // Reset form state to mark it as clean (not dirty) after a successful save
      reset(data, { keepValues: true });

    } catch (error: any) {
      toast.error(error.message || 'Failed to save data.');
    }
    finally {
      setIsLoading(false);
    }
  };


  // 2. MODIFIED saveChampion logic
  const saveChampion = async () => {
    if (!tempChampion.name.trim()) return toast.error('Name required');
    if (!tempChampion.event) return toast.error('Event required');

    let mediaId = tempChampion.mediaId;
    let newPhotoUrl = getPhotoUrl(mediaId);

    // --- Image Upload Logic ---
    if (imageFile) {
      setIsLoading(true);
      try {
        const fd = new FormData();
        fd.append('file', imageFile);

        const res = await fetch('/api/media', {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
          body: fd
        });
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || 'Upload failed');

        mediaId = json.id;
        newPhotoUrl = getPhotoUrl(mediaId);

      } catch (e: any) {
        setIsLoading(false);
        console.error('Photo upload failed', e);
        toast.error(`Photo upload failed: ${e.message}`);
        return; // Stop if photo upload fails
      }

      // Clean up and reset file state after successful upload
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImageFile(null);
      setImagePreviewUrl(newPhotoUrl ?? null);
    }
    // --- End Image Upload Logic ---

    const payload = {
      name: tempChampion.name.trim(),
      event: tempChampion.event,
      position: tempChampion.position,
      level: tempChampion.level,
      teamMembers: tempChampion.teamMembers.split(',').map(s => s.trim()).filter(Boolean),
      mediaId: mediaId || undefined,
      featured: tempChampion.featured
    };

    const championWithPhoto = { ...payload, photoUrl: newPhotoUrl } as ChampionForm;
    let newChampionsArray = [...watchedChampions];

    // --- Update Form State (RHF) ---
    if (payload.featured && (payload.level === 'HS' || payload.level === 'HSS')) {
      // Special logic for featured: manually update the whole array
      newChampionsArray = watchedChampions.map((c, idx) => {
        if (idx === editingIndex) {
          return championWithPhoto;
        } else if (c.level === payload.level) {
          return { ...c, featured: false }; // Un-feature others
        }
        return c;
      });

      if (editingIndex === null) {
        newChampionsArray = [...newChampionsArray, championWithPhoto];
      }

      setValue('champions', newChampionsArray as any, { shouldDirty: true });
    } else {
      // Standard add/update path
      if (editingIndex !== null) {
        updateChampion(editingIndex, championWithPhoto);
        // Manually update the array copy for the next step, as RHF update is async
        newChampionsArray[editingIndex] = championWithPhoto;
      } else {
        addChampion(championWithPhoto as any);
        // Manually update the array copy for the next step
        newChampionsArray.push(championWithPhoto);
      }
    }
    // --- End Update Form State ---

    setOpenChampionDialog(false);
    toast.success('Champion details saved locally. Submitting to server...');

    // 3. Trigger the full form save with the *newest* data
    const currentFormData = getValues();
    // Ensure the champions array reflects the latest changes before submission
    currentFormData.champions = newChampionsArray;

    // Call the main submission function
    await onMainFormSubmit(currentFormData);

    // Final check to set loading off if it was on from image upload
    setIsLoading(false);
  };
  
  // --- NEW MEDIA DELETION LOGIC ---
  const deleteMedia = async (mediaId: string) => {
    try {
        const res = await fetch(`/api/media/${mediaId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
        });

        if (!res.ok) {
            console.error(`Failed to delete media ID ${mediaId}`);
            toast.error(`Warning: Failed to delete image on server for champion. Check console.`);
        }
    } catch (e) {
        console.error('Media deletion failed:', e);
    }
  }

  const handleRemoveChampion = async (index: number) => {
    const championToRemove = watchedChampions[index];
    const mediaIdToRemove = championToRemove?.mediaId;

    if (!window.confirm(`Are you sure you want to delete champion: ${championToRemove.name}?`)) {
      return;
    }

    // 1. Remove the champion from the local form state
    // We must call removeChampion(index) first to trigger the RHF state update.
    removeChampion(index);
    
    // 2. Prepare the data for submission
    // Since removeChampion is asynchronous, we manually create the new array
    const newChampionsArray = watchedChampions.filter((_, i) => i !== index);
    const currentFormData = getValues();
    currentFormData.champions = newChampionsArray;

    // 3. Save the main form data (persists the champion removal)
    await onMainFormSubmit(currentFormData);

    toast.success('Champion removed and changes saved.');

    // 4. Clean up the image on the server
    if (mediaIdToRemove) {
        await deleteMedia(mediaIdToRemove);
    }
  };
  // --- END NEW MEDIA DELETION LOGIC ---

  const handleDeleteYear = async () => {
    if (!selectedYear || !window.confirm(`Are you sure you want to delete the sports results for ${selectedYear} and all associated champions/photos? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingYear(true);
    try {
      const res = await fetch(`/api/admin/sports-results/${selectedYear}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete data.');
      }

      toast.success(`Sports result for ${selectedYear} deleted successfully.`);
      setYears(prev => prev.filter(y => y !== selectedYear));
      setSelectedYear(null);
      reset();
    } catch (error: any) {
      toast.error(error.message || 'An unknown error occurred during deletion.');
    } finally {
      setIsDeletingYear(false);
    }
  };


  const isFeaturedDisabled = useMemo(() => {
    if (tempChampion.level !== 'HS' && tempChampion.level !== 'HSS') return true;
    const currentFeatured = tempChampion.level === 'HS' ? featuredHS : featuredHSS;

    if (currentFeatured) {
      if (editingIndex !== null && watchedChampions[editingIndex]?.level === tempChampion.level && watchedChampions[editingIndex]?.featured) {
        return false;
      }
      return true;
    }
    return false;
  }, [tempChampion.level, featuredHS, featuredHSS, editingIndex, watchedChampions]);

  const handleGoToDashboard = () => {
    window.location.href = '/admin';
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-black p-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header (Main Save Button) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-orange-600 flex items-center gap-3">
                <Trophy className="w-9 h-9" /> Sports Admin
              </h1>
              {selectedYear && (
                <Badge className="mt-2 bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200">
                  Editing: {selectedYear}–{selectedYear + 1}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleGoToDashboard}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
              </Button>
              <Select value={selectedYear?.toString()} onValueChange={v => setSelectedYear(v ? Number(v) : null)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}–{y + 1}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setOpenYearDialog(true)}>
                <CalendarPlus className="w-4 h-4 mr-1" /> New Year
              </Button>
              {selectedYear && (
                <Button size="sm" variant="destructive" onClick={handleDeleteYear} disabled={isDeletingYear}>
                  {isDeletingYear ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />} Delete Year
                </Button>
              )}
              {/* Main Save Button: Now just calls the extracted submission logic */}
              <Button size="sm" onClick={handleSubmit(onMainFormSubmit)} disabled={!isDirty || isLoading || !selectedYear}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save
              </Button>
            </div>
          </div>
        </div>

        {/* --- Form sections (Medals, Events, Champions List) remain the same --- */}

        {!selectedYear ? (
          <Card className="text-center py-16">
            <CardTitle>Select or create a year to begin editing sports results.</CardTitle>
            <Button className="mt-6" onClick={() => setOpenYearDialog(true)}><Plus className="w-5 h-5 mr-2" /> New Year</Button>
          </Card>
        ) : (
          <>
            {/* Top Champions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <div className="flex items-center gap-5">
                          <img
                            src={champ.photoUrl || '/placeholder.svg'}
                            alt={champ.name}
                            className="w-28 h-28 rounded-full object-cover border-4 border-orange-200 shadow-xl"
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                          />
                          <div>
                            <h3 className="text-2xl font-bold">{champ.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{champ.event}</p>
                            <Badge className={`text-xs ${champ.position === 1 ? 'bg-yellow-500' : champ.position === 2 ? 'bg-gray-400' : 'bg-orange-700'}`}>{champ.position === 1 ? 'Gold' : champ.position === 2 ? 'Silver' : 'Bronze'}</Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8 italic">No top champion selected</p>
                      )}
                      <Button
                        className="w-full mt-6"
                        disabled={watchedChampions.length === 0}
                        onClick={() => toast.success("Use the 'All Champions' section below to set a champion as 'Top Champion'.")}
                        variant="secondary"
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
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 text-center">
                  {['gold', 'silver', 'bronze', 'totalNationalMedals', 'totalParticipants'].map(field => (
                    <div key={field}>
                      <Label className="text-sm text-gray-600 dark:text-gray-400">{field === 'totalNationalMedals' ? 'Total Medals' : field.charAt(0).toUpperCase() + field.slice(1)}</Label>
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
              <CardHeader className="flex-row justify-between items-center">
                <CardTitle>Events</CardTitle>
                <Button size="sm" onClick={() => addEvent({ name: '', category: 'Individual' })}>
                  <Plus className="w-4 h-4 mr-1" /> Add Event
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {events.length === 0 && <p className="text-gray-500 text-center py-4">No events added. Champions require events.</p>}
                {events.map((e, i) => (
                  <div key={e.id} className="flex gap-3 items-center">
                    <Input {...register(`events.${i}.name`)} placeholder="Event name (e.g., 100m Sprint, Badminton)" className="flex-1 focus:border-orange-500" />
                    <Select value={watch(`events.${i}.category`)} onValueChange={v => setValue(`events.${i}.category`, v as any)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => removeEvent(i)}><X className="w-4 h-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* All Champions */}
            <Card>
              <CardHeader className="flex-row justify-between items-center">
                <CardTitle>All Champions ({champions.length})</CardTitle>
                <Button size="sm" onClick={() => openChampion()} disabled={watchedEvents.length === 0}>
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
                    <div key={i} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                      <img
                        // Updated photo size to w-20 h-20 for better clarity in the list
                        src={c.photoUrl || '/placeholder.svg'}
                        alt={c.name}
                        className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-orange-300"
                        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200">{(c.level as ChampionLevel)}</Badge>
                              <span className="font-semibold text-lg truncate">{c.name}</span>
                              {c.featured && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {c.event} •
                              <Badge className={`text-xs ${c.position === 1 ? 'bg-yellow-500' : c.position === 2 ? 'bg-gray-400' : 'bg-orange-700'}`}>
                                {c.position === 1 ? 'Gold' : c.position === 2 ? 'Silver' : 'Bronze'}
                              </Badge>
                            </p>                            {c.teamMembers?.length > 0 && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">Team: {c.teamMembers.join(', ')}</p>}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="icon" variant="outline" className='w-8 h-8' onClick={() => openChampion(i)}><Edit3 className="w-4 h-4" /></Button>
                            {/* Calling the new handler that manages deletion and image cleanup */}
                            <Button size="icon" variant="destructive" className='w-8 h-8' onClick={() => handleRemoveChampion(i)}><Trash2 className="w-4 h-4" /></Button>
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
              <Button variant="outline" onClick={() => setOpenYearDialog(false)}>Cancel</Button>
              <Button onClick={() => {
                const y = Number(newYear);
                if (y >= 2000 && y <= 2100 && !years.includes(y)) {
                  setYears(p => [y, ...p].sort((a, b) => b - a));
                  setSelectedYear(y);
                  reset({ year: y, gold: 0, silver: 0, bronze: 0, totalNationalMedals: 0, totalParticipants: 0, events: [], champions: [] });
                  setOpenYearDialog(false);
                  toast.success(`Year ${y} created`);
                } else {
                  toast.error(years.includes(y) ? 'Year already exists.' : 'Invalid year (must be 2000-2100).');
                }
              }}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Champion Dialog */}
        <Dialog open={openChampionDialog} onOpenChange={setOpenChampionDialog}>
          <DialogContent className="max-w-xl w-full mx-4">
            <DialogHeader><DialogTitle>{editingIndex !== null ? 'Edit' : 'Add'} Champion</DialogTitle></DialogHeader>

            {isLoading && <div className='absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-50 rounded-lg'><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Left Column: Photo Uploader (NO CROPPING UI) */}
              <div className='md:col-span-1'>
                <Label>Photo (Raw Upload)</Label>
                {!imagePreviewUrl ? (
                  <label className="block mt-1 border-2 border-dashed border-orange-300 rounded-xl p-6 text-center cursor-pointer hover:border-orange-500 h-40 flex flex-col justify-center items-center">
                    <Upload className="w-10 h-10 mx-auto text-orange-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Tap to upload (1:1 aspect ratio recommended)</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                ) : (
                  <div className="space-y-2">
                    <div className="relative w-full overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700" style={{ height: 'auto' }}>
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="w-full object-contain max-h-64"
                        style={{ maxHeight: '20rem' }}
                      />
                    </div>
                    <Button size="sm" variant="outline" className='w-full' onClick={() => {
                      // Clean up URL before removing state
                      if (imagePreviewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(imagePreviewUrl);
                      }
                      setImagePreviewUrl(null); setImageFile(null);
                    }}>
                      <X className="w-4 h-4 mr-2" /> Remove/Change Photo
                    </Button>
                  </div>
                )}
              </div>

              {/* Right Column: Champion Details */}
              <div className='md:col-span-1 space-y-4'>
                <div>
                  <Label htmlFor="name">Champion Name</Label>
                  <Input
                    id="name"
                    value={tempChampion.name}
                    onChange={(e) => setTempChampion(p => ({ ...p, name: e.target.value }))}
                    className='focus:border-orange-500'
                  />
                </div>

                <div>
                  <Label htmlFor="event">Event</Label>
                  <Select
                    value={tempChampion.event}
                    onValueChange={(v) => setTempChampion(p => ({ ...p, event: v }))}
                  >
                    <SelectTrigger className="w-full focus:border-orange-500">
                      <SelectValue placeholder="Select Event" />
                    </SelectTrigger>
                    <SelectContent>
                      {watchedEvents.map(e => <SelectItem key={e.name} value={e.name}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Select
                      value={String(tempChampion.position)}
                      onValueChange={(v) => setTempChampion(p => ({ ...p, position: Number(v) as 1 | 2 | 3 }))}
                    >
                      <SelectTrigger className="w-full focus:border-orange-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st (Gold)</SelectItem>
                        <SelectItem value="2">2nd (Silver)</SelectItem>
                        <SelectItem value="3">3rd (Bronze)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={tempChampion.level}
                      onValueChange={(v) => setTempChampion(p => ({ ...p, level: v as ChampionLevel }))}
                    >
                      <SelectTrigger className="w-full focus:border-orange-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HSS">HSS</SelectItem>
                        <SelectItem value="HS">HS</SelectItem>
                        <SelectItem value="State">State</SelectItem>
                        <SelectItem value="District">District</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="teamMembers">Team Members (Comma-separated)</Label>
                  <Input
                    id="teamMembers"
                    value={tempChampion.teamMembers}
                    onChange={(e) => setTempChampion(p => ({ ...p, teamMembers: e.target.value }))}
                    placeholder="Rahul, Amit, Suresh"
                    className='focus:border-orange-500'
                  />
                </div>

                <div className='flex items-center space-x-2 pt-2'>
                  <Checkbox
                    id="featured"
                    checked={tempChampion.featured}
                    onCheckedChange={(checked) => setTempChampion(p => ({ ...p, featured: !!checked }))}
                    disabled={isFeaturedDisabled}
                  />
                  <Label htmlFor="featured" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Set as Top Champion (HSS/HS only)
                  </Label>
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenChampionDialog(false)}>Cancel</Button>
              {/* Dialog Save Button triggers the async saveChampion */}
              <Button onClick={saveChampion} disabled={isLoading || !tempChampion.name.trim() || !tempChampion.event}>
                {editingIndex !== null ? 'Update Champion' : 'Add Champion'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}