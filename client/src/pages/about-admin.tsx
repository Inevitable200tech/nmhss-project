import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AboutSection from "@/components/about-section";

type ImageInput = {
  url: string;
  id?: string; // only set if uploaded
  mode: "url" | "upload";
};

type AboutData = {
  name: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  images: ImageInput[];
  stats: { label: string; value: string; description: string }[];
};

const fallbackParagraphs = [
  "This is the default about section paragraph one.",
  "This is the default about section paragraph two.",
];

const fallbackImages: ImageInput[] = [
  { url: "", mode: "url" },
  { url: "", mode: "url" },
];

const fallbackStats = [
  { label: "Students", value: "0", description: "Number of students" },
  { label: "Teachers", value: "0", description: "Number of teachers" },
  { label: "Alumni", value: "0", description: "Number of alumni" },
  { label: "Courses", value: "0", description: "Number of courses" },
];

export default function AboutAdminPage() {
  const [aboutData, setAboutData] = useState<AboutData>({
    name: "about",
    title: "About Us",
    subtitle:
      "Building futures through quality education and holistic development since 1946",
    paragraphs: fallbackParagraphs,
    images: fallbackImages,
    stats: fallbackStats,
  });

  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: keyof AboutData, value: any) => {
    setAboutData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageModeToggle = (index: number) => {
    const updated = [...aboutData.images];
    updated[index].mode = updated[index].mode === "url" ? "upload" : "url";
    updated[index].url = "";
    updated[index].id = undefined;
    setAboutData({ ...aboutData, images: updated });
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const updated = [...aboutData.images];
    updated[index].url = value;
    updated[index].id = undefined;
    setAboutData({ ...aboutData, images: updated });
  };

  const handleFileUpload = async (file: File, index: number) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        const updated = [...aboutData.images];
        updated[index] = { url: data.url, id: data.id, mode: "upload" };
        setAboutData({ ...aboutData, images: updated });
        toast({ title: "Success", description: "File uploaded successfully" });
      } else {
        toast({ title: "Error", description: data.message });
      }
    } catch (err) {
      toast({ title: "Error", description: "Upload failed" });
    }
  };

  const handleRemoveImage = async (index: number) => {
    const img = aboutData.images[index];
    if (img.id) {
      try {
        await fetch(`/api/media/${img.id}`, { method: "DELETE" });
      } catch (err) {
        toast({ title: "Error", description: "Failed to delete media" });
      }
    }
    const updated = [...aboutData.images];
    updated[index] = { url: "", mode: "url" };
    setAboutData({ ...aboutData, images: updated });
  };

  const restoreDefaults = () => {
    setAboutData({
      name: "about",
      title: "About Us",
      subtitle:
        "Building futures through quality education and holistic development since 1946",
      paragraphs: fallbackParagraphs,
      images: fallbackImages,
      stats: fallbackStats,
    });
    toast({ title: "Defaults Restored", description: "Form reset to defaults" });
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...aboutData,
        images: aboutData.images
          .filter((i) => i.url) // only non-empty
          .map((i) => ({
            id: i.id || "",      // required by schema
            url: i.url,
          })),
      };

      const res = await fetch("/api/sections/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });


      if (res.ok) {
        toast({ title: "Saved", description: "About section updated successfully" });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to save" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error while saving" });
    }
  };


  return (
    <div className="p-6 space-y-6">
      {!previewMode ? (
        <>
          <h1 className="text-2xl font-bold">Admin: About Section</h1>

          <Card>
            <CardContent className="space-y-4">
              <Input
                value={aboutData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Title"
              />
              <Input
                value={aboutData.subtitle}
                onChange={(e) => handleChange("subtitle", e.target.value)}
                placeholder="Subtitle"
              />

              {aboutData.paragraphs.map((p, i) => (
                <Textarea
                  key={i}
                  value={p}
                  onChange={(e) => {
                    const updated = [...aboutData.paragraphs];
                    updated[i] = e.target.value;
                    setAboutData({ ...aboutData, paragraphs: updated });
                  }}
                  placeholder={`Paragraph ${i + 1}`}
                />
              ))}

              {/* Images */}
              <div className="space-y-4">
                {aboutData.images.map((img, i) => (
                  <div key={i} className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleImageModeToggle(i)}
                    >
                      Switch to {img.mode === "url" ? "Upload" : "URL"}
                    </Button>

                    {img.mode === "url" ? (
                      <Input
                        placeholder={`Image URL ${i + 1}`}
                        value={img.url}
                        onChange={(e) =>
                          handleImageUrlChange(i, e.target.value)
                        }
                      />
                    ) : (
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0], i);
                          }
                        }}
                      />
                    )}

                    {img.url && (
                      <div className="flex items-center space-x-2">
                        <img
                          src={img.url}
                          alt={`Preview ${i + 1}`}
                          className="h-24 w-24 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => handleRemoveImage(i)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Stats */}
              {aboutData.stats.map((stat, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <Input
                    value={stat.label}
                    onChange={(e) => {
                      const updated = [...aboutData.stats];
                      updated[i].label = e.target.value;
                      setAboutData({ ...aboutData, stats: updated });
                    }}
                    placeholder="Label"
                  />
                  <Input
                    value={stat.value}
                    onChange={(e) => {
                      const updated = [...aboutData.stats];
                      updated[i].value = e.target.value;
                      setAboutData({ ...aboutData, stats: updated });
                    }}
                    placeholder="Value"
                  />
                  <Input
                    value={stat.description}
                    onChange={(e) => {
                      const updated = [...aboutData.stats];
                      updated[i].description = e.target.value;
                      setAboutData({ ...aboutData, stats: updated });
                    }}
                    placeholder="Description"
                  />
                </div>
              ))}

              <div className="flex space-x-4">
                <Button onClick={restoreDefaults}>Restore Defaults</Button>
                <Button
                  onClick={() => {
                    setPreviewMode(true);
                  }}
                >
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div>
          <AboutSection
            section={{
              ...aboutData,
              images: aboutData.images.filter((i) => i.url).map((i) => ({ id: i.id || '', url: i.url })), // still object[]

            }}
          />
          <div className="flex space-x-4">
            <Button onClick={() => setPreviewMode(false)}>Back to Edit</Button>
            <Button onClick={handleSave} variant="default">
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
