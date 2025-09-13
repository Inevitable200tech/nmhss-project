import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import AboutSection from "@/components/about-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ImageItem = { url: string; mediaId?: string; file?: File; mode: "upload" | "url" };
type AudioItem = { url: string; mediaId?: string; file?: File; mode: "upload" }; // Restored mode, fixed to "upload"
type StatItem = { label: string; value: string; description: string };
type AboutSectionDTO = {
  id: string;
  name: "about";
  title: string;
  subtitle: string;
  paragraphs: string[];
  images: ImageItem[];
  audios: AudioItem[]; // Array with 0 or 1 item
  stats: StatItem[];
};

const FALLBACKS: ImageItem[] = [
  {
    url: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&w=1200&q=60",
    mode: "url",
  },
  {
    url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&w=1200&q=60",
    mode: "url",
  },
];

const DEFAULT_PARAGRAPHS = [
  "Established in 1946, Navamukunda Higher Secondary School Thirunavaya has been a beacon of educational excellence in the rural landscape of Malappuram district, Kerala. For over seven decades, we have been committed to nurturing young minds and shaping the leaders of tomorrow.",
  "As a privately aided co-educational institution, we serve students from grades 5 to 12, providing quality education in Malayalam medium. Our school is strategically located in the TIRUR block, easily accessible by all-weather roads.",
];

const DEFAULT_STATS: StatItem[] = [
  { label: "Classrooms", value: "30", description: "Well-equipped learning spaces" },
  { label: "Library Books", value: "2.5K", description: "Extensive collection of resources" },
  { label: "Computers", value: "25", description: "Modern computer laboratory" },
  { label: "Restrooms", value: "40", description: "Separate facilities for all" },
];

const emptyAbout: AboutSectionDTO = {
  id: "",
  name: "about",
  title: "",
  subtitle: "",
  paragraphs: ["", ""],
  images: [...FALLBACKS],
  audios: [],
  stats: [
    { label: "", value: "", description: "" },
    { label: "", value: "", description: "" },
    { label: "", value: "", description: "" },
    { label: "", value: "", description: "" },
  ],
};

export default function AboutAdmin() {
  const [aboutData, setAboutData] = useState<AboutSectionDTO>(emptyAbout);
  const [previewMode, setPreviewMode] = useState(false);
  const [token] = useState(localStorage.getItem("adminToken") || "");
  const [previousParagraphs, setPreviousParagraphs] = useState<string[]>([]);

  const isMalayalam = (text?: string) =>
    text ? /[\u0D00-\u0D7F]/.test(text) : false;

  const hasMalayalam = aboutData.paragraphs.some(isMalayalam);

  // Fetch section
  const { data: serverData, refetch } = useQuery({
    queryKey: ["about-section"],
    queryFn: async (): Promise<AboutSectionDTO | null> => {
      const res = await fetch("/api/sections/about");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch about section");
      return (await res.json()) as AboutSectionDTO;
    },
  });

  // Hydrate
  useEffect(() => {
    if (serverData) {
      setAboutData({
        id: serverData.id,
        name: serverData.name,
        title: serverData.title,
        subtitle: serverData.subtitle ?? "",
        paragraphs: serverData.paragraphs?.length ? serverData.paragraphs : ["", ""],
        stats: serverData.stats?.length
          ? serverData.stats
          : [
            { label: "", value: "", description: "" },
            { label: "", value: "", description: "" },
            { label: "", value: "", description: "" },
            { label: "", value: "", description: "" },
          ],
        images: [
          serverData.images?.[0] ?? { ...FALLBACKS[0], mode: "url" },
          serverData.images?.[1] ?? { ...FALLBACKS[1], mode: "url" },
        ].map((img, i) => ({
          ...FALLBACKS[i],
          ...img,
        })),
        audios: serverData.audios?.length ? [{ ...serverData.audios[0], mode: "upload" }] : [], // Ensure mode: "upload"
      });
      setPreviousParagraphs([...serverData.paragraphs]);
    }
  }, [serverData]);

  // Watch for paragraph changes when audio exists
  useEffect(() => {
    const hasChanged = aboutData.paragraphs.some((p, i) => p !== previousParagraphs[i]);
    if (hasChanged && aboutData.audios.length > 0) {
      const confirmed = window.confirm(
        "Paragraph content has changed since audio was uploaded. This may mismatch the audio. Remove audio and save? (OK to confirm)"
      );
      if (confirmed) {
        handleRemoveAudioOnParagraphChange();
      }
    }
    setPreviousParagraphs([...aboutData.paragraphs]);
  }, [aboutData.paragraphs]);

  const isFallback = (img: ImageItem) => FALLBACKS.some((f) => f.url === img.url);

  // Validation gates
  const textsValid =
    aboutData.title.trim() &&
    aboutData.subtitle.trim() &&
    aboutData.paragraphs.every((p) => p.trim());
  const statsValid =
    textsValid &&
    aboutData.stats.every((s) => s.label && s.value && s.description);
  const imagesValid =
    statsValid &&
    aboutData.images.every(
      (img) =>
        !isFallback(img) &&
        (img.mode === "upload" || (img.mode === "url" && img.url.trim() !== ""))
    );
  const audiosValid =
    imagesValid &&
    (!hasMalayalam || (aboutData.audios.length === 0 || (aboutData.audios[0]?.file || aboutData.audios[0]?.mediaId)));

  // Handlers
  const handleFieldChange = (field: keyof AboutSectionDTO, value: any) => {
    setAboutData((prev) => ({ ...prev, [field]: value }));
  };

  const handleParagraphChange = (i: number, v: string) => {
    const updated = [...aboutData.paragraphs];
    updated[i] = v;
    setAboutData((p) => ({ ...p, paragraphs: updated }));
  };

  const handleStatChange = (i: number, field: keyof StatItem, v: string) => {
    const updated = [...aboutData.stats];
    updated[i] = { ...updated[i], [field]: v };
    setAboutData((p) => ({ ...p, stats: updated }));
  };

  const handleFileSelect = (file: File, index: number) => {
    const blobUrl = URL.createObjectURL(file);
    const updated = [...aboutData.images];
    updated[index] = { url: blobUrl, file, mode: "upload" };
    setAboutData((p) => ({ ...p, images: updated }));
  };

  const handleAudioFileSelect = (file: File) => {
    const blobUrl = URL.createObjectURL(file);
    setAboutData((p) => ({ ...p, audios: [{ url: blobUrl, file, mode: "upload" }] }));
  };

  const handleUrlChange = (url: string, index: number) => {
    const updated = [...aboutData.images];
    updated[index] = { url, mode: "url" };
    setAboutData((p) => ({ ...p, images: updated }));
  };

  const handleConfirmUrl = (url: string, index: number) => {
    if (!url.trim()) {
      toast({ title: "Image URL cannot be empty", variant: "destructive" });
      return;
    }
    handleUrlChange(url.trim(), index);
    toast({ title: `Image ${index + 1} URL confirmed` });
  };

  const handleRemoveImage = async (index: number) => {
    const confirmed = window.confirm(
      "⚠️ Are you sure you want to delete the image?\nThis action will delete image from the database completely."
    );
    if (!confirmed) return;
    const current = aboutData.images[index];

    if (current.mediaId) {
      try {
        const res = await fetch(`/api/media/${current.mediaId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete media file");
        console.log("Deleted media:", current.mediaId);
      } catch (err) {
        toast({ title: "Failed to delete image file", variant: "destructive" });
      }
    }

    if (current.file) {
      URL.revokeObjectURL(current.url);
    }

    const updated = [...aboutData.images];
    updated[index] = { ...FALLBACKS[index], mode: "url" };
    setAboutData((p) => ({ ...p, images: updated }));

    if (statsValid) {
      try {
        const payload = { ...aboutData, images: updated };
        const res = await fetch("/api/sections/about", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast({ title: `Image ${index + 1} removed & saved` });
          refetch();
        }
      } catch {
        toast({ title: "Failed to auto-save after remove", variant: "destructive" });
      }
    }
  };

  const handleRemoveAudio = async () => {
    const confirmed = window.confirm(
      "⚠️ Are you sure you want to delete the audio?\nThis action will reset all paragraphs to default and save the section."
    );
    if (!confirmed) return;
    const current = aboutData.audios[0];

    if (current?.mediaId) {
      try {
        const res = await fetch(`/api/media/${current.mediaId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete media file");
        console.log("Deleted media:", current.mediaId);
      } catch (err) {
        toast({ title: "Failed to delete audio file", variant: "destructive" });
        return;
      }
    }

    if (current?.file) {
      URL.revokeObjectURL(current.url);
    }

    // Reset all paragraphs to default
    const updatedParagraphs = [...DEFAULT_PARAGRAPHS];
    setAboutData((p) => ({ ...p, paragraphs: updatedParagraphs, audios: [] }));

    // Save immediately
    try {
      const payload = { ...aboutData, paragraphs: updatedParagraphs, audios: [] };
      const res = await fetch("/api/sections/about", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "Audio removed, paragraphs reset, & saved" });
        refetch();
      }
    } catch {
      toast({ title: "Failed to save after audio removal", variant: "destructive" });
    }
  };

  const handleRemoveAudioOnParagraphChange = async () => {
    if (!aboutData.audios.length) return;
    const current = aboutData.audios[0];

    if (current.mediaId) {
      try {
        const res = await fetch(`/api/media/${current.mediaId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete media file");
        console.log("Deleted media:", current.mediaId);
      } catch (err) {
        toast({ title: "Failed to delete audio file", variant: "destructive" });
        return;
      }
    }

    if (current.file) {
      URL.revokeObjectURL(current.url);
    }

    setAboutData((p) => ({ ...p, audios: [] }));
    // Save
    try {
      const payload = { ...aboutData, audios: [] };
      await fetch("/api/sections/about", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      toast({ title: "Audio removed due to paragraph changes & saved" });
      refetch();
    } catch {
      toast({ title: "Failed to save after audio removal", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    const confirmed = window.confirm("Continue With Changes ?.");
    if (!confirmed) return;
    try {
      const uploadedImages: ImageItem[] = [];
      for (const img of aboutData.images) {
        if (img.file) {
          const formData = new FormData();
          formData.append("file", img.file);
          const res = await fetch("/api/media", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (!res.ok) throw new Error("Failed to upload image");
          const uploaded = await res.json();
          uploadedImages.push({
            url: uploaded.url,
            mediaId: uploaded.id,
            mode: "upload",
          });
          URL.revokeObjectURL(img.url);
        } else {
          uploadedImages.push({
            url: img.url,
            mediaId: img.mediaId,
            mode: img.mode ?? "url",
          });
        }
      }

      let uploadedAudios: AudioItem[] = [];
      if (aboutData.audios[0]?.file) {
        const formData = new FormData();
        formData.append("file", aboutData.audios[0].file);
        const res = await fetch("/api/media", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to upload audio");
        const uploaded = await res.json();
        uploadedAudios = [{ url: uploaded.url, mediaId: uploaded.id, mode: "upload" }];
        URL.revokeObjectURL(aboutData.audios[0].url);
      } else {
        uploadedAudios = aboutData.audios.map(aud => ({ ...aud, mode: "upload" }));
      }

      const payload = { ...aboutData, images: uploadedImages, audios: uploadedAudios };
      const res = await fetch("/api/sections/about", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save section");
      toast({ title: "Section saved successfully" });
      refetch();
    } catch (err) {
      toast({ title: "Error saving section", variant: "destructive" });
    }
  };

  const handleRestoreDefaults = async () => {
    const confirmed = window.confirm(
      "⚠️ Are you sure you want to reset?\nThis will delete all images and audio from the form and database."
    );
    if (!confirmed) return;

    // Delete all uploaded images
    for (const img of aboutData.images) {
      if (img.mediaId) {
        try {
          const res = await fetch(`/api/media/${img.mediaId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to delete media file");
          console.log("Deleted media:", img.mediaId);
          toast({title:`Deleted Image ${img.mediaId}`})
        } catch (err) {
          toast({ title: `Failed to delete image ${img.mediaId}`, variant: "destructive" });
        }
      }
      if (img.file) {
        URL.revokeObjectURL(img.url);
      }
    }

    // Delete audio if exists
    const currentAudio = aboutData.audios[0];
    if (currentAudio?.mediaId) {
      try {
        const res = await fetch(`/api/media/${currentAudio.mediaId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete audio file");
        console.log("Deleted media:", currentAudio.mediaId);
        toast({ title: "Deleted Audio"  })
      } catch (err) {
        toast({ title: "Failed to delete audio file", variant: "destructive" });
      }
    }
    if (currentAudio?.file) {
      URL.revokeObjectURL(currentAudio.url);
    }

    const resetData: AboutSectionDTO = {
      ...aboutData,
      title: "About Us",
      subtitle: "About Us in short",
      paragraphs: [...DEFAULT_PARAGRAPHS],
      stats: [...DEFAULT_STATS],
      images: [...FALLBACKS],
      audios: [],
    };
    setAboutData(resetData);
    try {
      const res = await fetch("/api/sections/about", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(resetData),
      });
      if (!res.ok) throw new Error("Failed to restore defaults");
      toast({ title: "Restored defaults and saved" });
      refetch();
    } catch {
      toast({ title: "Failed to save defaults", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">About Section Admin</h1>

      {!previewMode ? (
        <div className="space-y-6">
          {/* Step 1: Texts */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={aboutData.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={aboutData.subtitle}
                  onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                />
              </div>
              {aboutData.paragraphs.map((p, i) => (
                <div key={i}>
                  <Label>Paragraph {i + 1}</Label>
                  <Textarea
                    value={p}
                    onChange={(e) => handleParagraphChange(i, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Step 2: Stats */}
          <Card className={!textsValid ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {aboutData.stats.map((s, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 items-center">
                    <Input
                      placeholder="Label"
                      value={s.label}
                      onChange={(e) => handleStatChange(i, "label", e.target.value)}
                    />
                    <Input
                      placeholder="Value"
                      value={s.value}
                      onChange={(e) => handleStatChange(i, "value", e.target.value)}
                    />
                    <Input
                      placeholder="Description"
                      value={s.description}
                      onChange={(e) => handleStatChange(i, "description", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Images */}
          <Card className={!statsValid ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aboutData.images.map((img, i) => (
                  <div key={i} className="space-y-2">
                    <img
                      src={img.url}
                      alt={`Preview ${i}`}
                      className="h-32 w-full object-cover rounded-lg shadow"
                    />
                    <ToggleGroup
                      type="single"
                      value={img.mode}
                      onValueChange={(val) => {
                        if (!val) return;
                        const updated = [...aboutData.images];
                        updated[i] = { ...FALLBACKS[i], mode: val as "upload" | "url" };
                        setAboutData((prev) => ({ ...prev, images: updated }));
                      }}
                      className="flex gap-2"
                    >
                      <ToggleGroupItem value="upload" aria-label="Upload">
                        Upload
                      </ToggleGroupItem>
                      <ToggleGroupItem value="url" aria-label="URL">
                        URL
                      </ToggleGroupItem>
                    </ToggleGroup>
                    {img.mode === "upload" && isFallback(img) && (
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] && handleFileSelect(e.target.files[0], i)
                        }
                      />
                    )}
                    {img.mode === "url" && (
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Paste image URL"
                          value={img.url}
                          onChange={(e) => {
                            const updated = [...aboutData.images];
                            updated[i] = { ...updated[i], url: e.target.value };
                            setAboutData((p) => ({ ...p, images: updated }));
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleConfirmUrl(img.url, i)}
                        >
                          OK
                        </Button>
                      </div>
                    )}
                    {!isFallback(img) && (
                      <Button
                        variant="destructive"
                        onClick={() => handleRemoveImage(i)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Audio (conditional, single upload) */}
          {hasMalayalam && (
            <Card className={!imagesValid ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader>
                <CardTitle>Audio (Malayalam Detected)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aboutData.audios.length > 0 && (
                    <audio src={aboutData.audios[0].url} controls className="w-full">
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  {aboutData.audios.length === 0 && (
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) =>
                        e.target.files?.[0] && handleAudioFileSelect(e.target.files[0])
                      }
                    />
                  )}
                  {aboutData.audios.length > 0 && (
                    <Button variant="destructive" onClick={handleRemoveAudio}>
                      Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 w-full">
            <Button
              onClick={handleSave}
              disabled={!audiosValid}
              className="w-full sm:w-auto"
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewMode(true)}
              disabled={!audiosValid}
              className="w-full sm:w-auto"
            >
              Preview
            </Button>
            <Button
              variant="secondary"
              onClick={handleRestoreDefaults}
              className="w-full sm:w-auto"
            >
              Restore Defaults
            </Button>
            <a href="/admin" className="w-full sm:w-auto">
              <Button variant="default" className="w-full sm:w-auto">
                Back to Dashboard
              </Button>
            </a>
          </div>
        </div>
      ) : (
        <div>
          <AboutSection
            section={{
              name: aboutData.name,
              title: aboutData.title,
              subtitle: aboutData.subtitle,
              paragraphs: aboutData.paragraphs,
              stats: aboutData.stats,
              images: aboutData.images.map((img, i) => ({
                id: img.mediaId ?? `preview-${i}`,
                url: img.url,
              })),
              audios: aboutData.audios.map((aud, i) => ({
                id: aud.mediaId ?? `preview-audio-${i}`,
                url: aud.url,
              })),
            }}
          />
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setPreviewMode(false)}
          >
            Back to Edit
          </Button>
        </div>
      )}
    </div>
  );
}