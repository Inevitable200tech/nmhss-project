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
type StatItem = { label: string; value: string; description: string };
type AboutSectionDTO = {
  id: string;
  name: "about";
  title: string;
  subtitle: string;
  paragraphs: string[];
  images: ImageItem[];
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
  stats: [
    { label: "", value: "", description: "" },
    { label: "", value: "", description: "" },
    { label: "", value: "", description: "" },
    { label: "", value: "", description: "" },
  ],
};

export default function AboutAdmin() {

  const token = localStorage.getItem("adminToken");
  const [aboutData, setAboutData] = useState<AboutSectionDTO>(emptyAbout);
  const [previewMode, setPreviewMode] = useState(false);

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
      });
    }
  }, [serverData]);

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

  const handleSave = async () => {
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

      const payload = { ...aboutData, images: uploadedImages };
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
    const resetData: AboutSectionDTO = {
      ...aboutData,
      title: "About Us",
      subtitle: "About Us in short",
      paragraphs: [...DEFAULT_PARAGRAPHS],
      stats: [...DEFAULT_STATS],
      images: [...FALLBACKS],
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

          {/* Actions */}
          <div className="flex space-x-4">
            <Button onClick={handleSave} disabled={!imagesValid}>
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewMode(true)}
              disabled={!imagesValid}
            >
              Preview
            </Button>
            <Button variant="secondary" onClick={handleRestoreDefaults}>
              Restore Defaults
            </Button>
            <a href="/admin">
              <Button variant="default">
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
