import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { insertSectionSchema } from "@shared/schema";
import AboutSection from "@/components/about-section";

// --- Type for image inputs ---
type ImageInput = {
  url?: string;
  file?: File;
  preview?: string;
  mode: "url" | "upload"; // 👈 toggle between modes
};

export default function AboutAdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token] = useState(localStorage.getItem("adminToken") || "");
  const [messages, setMessages] = useState<{
    id: number;
    text: string;
    type: "success" | "error";
  }[]>([]);
  const [aboutData, setAboutData] = useState({
    name: "about",
    title: "",
    subtitle: "",
    paragraphs: ["", ""],
    images: [
      { mode: "url" } as ImageInput,
      { mode: "url" } as ImageInput,
    ],
    stats: [
      { label: "", value: "", description: "" },
      { label: "", value: "", description: "" },
      { label: "", value: "", description: "" },
      { label: "", value: "", description: "" },
    ],
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [sectionId, setSectionId] = useState("");
  const queryClient = useQueryClient();

  // --- Fallback Values ---
  const fallbackImages = [
    "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
  ];
  const fallbackParagraphs = [
    "Established in 1946, Navamukunda Higher Secondary School Thirunavaya has been a beacon of educational excellence in the rural landscape of Malappuram district, Kerala. For over seven decades, we have been committed to nurturing young minds and shaping the leaders of tomorrow.",
    "As a privately aided co-educational institution, we serve students from grades 5 to 12, providing quality education in Malayalam medium. Our school is strategically located in the TIRUR block, easily accessible by all-weather roads.",
  ];
  const fallbackStats = [
    { label: "Classrooms", value: "30", description: "Well-equipped learning spaces" },
    { label: "Library Books", value: "2.5K", description: "Extensive collection of resources" },
    { label: "Computers", value: "25", description: "Modern computer laboratory" },
    { label: "Restrooms", value: "40", description: "Separate facilities for all" },
  ];

  const addMessage = (text: string, type: "success" | "error") => {
    const id = Date.now();
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 5000);
  };

  // --- FETCH ABOUT SECTION ---
  useQuery({
    queryKey: ["/api/sections/about"],
    queryFn: async () => {
      const res = await fetch("/api/sections?name=about");
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const sections = await res.json();
      const section = Array.isArray(sections)
        ? sections.find((s: any) => s.name === "about")
        : sections;
      if (section) {
        setSectionId(section._id || section.id);
        setAboutData({
          name: "about",
          title: section.title || "",
          subtitle: section.subtitle || "",
          paragraphs: section.paragraphs || ["", ""],
          images: (section.images || ["", ""]).map((i: string) => ({ url: i, mode: "url" })),
          stats: section.stats || [],
        });
      }
      return section;
    },
    enabled: loggedIn,
  });

  // --- Image handlers ---
  const toggleImageMode = (index: number) => {
    const updated = [...aboutData.images];
    updated[index] = { mode: updated[index].mode === "url" ? "upload" : "url" };
    setAboutData({ ...aboutData, images: updated });
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const updated = [...aboutData.images];
    updated[index] = { ...updated[index], url: value, mode: "url" };
    setAboutData({ ...aboutData, images: updated });
  };

  const handleFileUpload = (index: number, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const updated = [...aboutData.images];
    updated[index] = { file, preview, mode: "upload" };
    setAboutData({ ...aboutData, images: updated });
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...aboutData.images];
    updated[index] = { mode: "url" };
    setAboutData({ ...aboutData, images: updated });
  };

  // --- RESET FORM TO DEFAULT VALUES ---
  const restoreDefaults = () => {
    setAboutData({
      name: "about",
      title: "About Us",
      subtitle:
        "Building futures through quality education and holistic development since 1946",
      paragraphs: fallbackParagraphs,
      images: fallbackImages.map((url) => ({ url, mode: "url" })), // 👈 wrap as ImageInput
      stats: fallbackStats,
    });
    addMessage("Form reset to default values", "success");
  };


  // --- CREATE/UPDATE MUTATION ---
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Failed to create: ${res.status}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections/about"] });
      setPreviewMode(false);
      setPreviewData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!sectionId) return await createMutation.mutateAsync(formData);
      const res = await fetch(`/api/sections/${sectionId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Failed to update: ${res.status}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections/about"] });
      setPreviewMode(false);
      setPreviewData(null);
    },
  });

  // --- Submit Handler ---
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", "about");
    formData.append("title", aboutData.title);
    formData.append("subtitle", aboutData.subtitle);

    aboutData.paragraphs.forEach((p, i) => formData.append(`paragraphs[${i}]`, p));
    aboutData.stats.forEach((s, i) => {
      formData.append(`stats[${i}][label]`, s.label);
      formData.append(`stats[${i}][value]`, s.value);
      formData.append(`stats[${i}][description]`, s.description);
    });

    aboutData.images.forEach((img, i) => {
      if (img.mode === "upload" && img.file) {
        formData.append("images", img.file);
      } else if (img.mode === "url" && img.url) {
        formData.append(`images[${i}]`, img.url);
      }
    });

    updateMutation.mutate(formData);
  };

  // --- Preview Submit ---
  const handlePreviewSubmit = () => {
    try {
      const previewImages = aboutData.images.map((img) => {
        if (img.mode === "upload" && img.preview) return img.preview;
        if (img.mode === "url" && img.url) return img.url;
        return "";
      }).filter(Boolean);

      const data = insertSectionSchema.parse({
        name: "about",
        title: aboutData.title,
        subtitle: aboutData.subtitle,
        paragraphs: aboutData.paragraphs.filter((p) => p.trim()),
        images: previewImages,
        stats: aboutData.stats.filter((s) => s.label.trim() && s.value.trim()),
      });

      setPreviewData(data);
      setPreviewMode(true);
    } catch {
      console.error("Validation failed");
    }
  };

  // --- Preview Mode ---
  if (previewMode && previewData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-4">Preview About Section</h1>
          <AboutSection section={previewData} />
        </div>
        <div className="fixed bottom-4 right-4 flex gap-2">
          <Button onClick={() => handleSubmit(new Event("submit") as any)} className="bg-green-600 hover:bg-green-700">
            OK
          </Button>
          <Button onClick={() => setPreviewMode(false)} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // --- UI RENDERING ---
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 p-4">
          <div className="container mx-auto max-w-2xl">
            <Button
              variant="outline"
              className="mb-4"
              onClick={() => (window.location.href = "/admin")}
            >
              ← Back to Dashboard
            </Button>

            <h1 className="text-3xl font-bold mb-4">Edit About Section</h1>

            {messages.map((msg) => (
              <div key={msg.id} className={`p-2 rounded mb-2 ${msg.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {msg.text}
              </div>
            ))}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                required
                placeholder="Title"
                value={aboutData.title}
                onChange={(e) => setAboutData({ ...aboutData, title: e.target.value })}
              />
              <Input
                required
                placeholder="Subtitle"
                value={aboutData.subtitle}
                onChange={(e) => setAboutData({ ...aboutData, subtitle: e.target.value })}
              />

              {aboutData.paragraphs.map((p, i) => (
                <Textarea
                  key={i}
                  placeholder={`Paragraph ${i + 1}`}
                  value={p}
                  onChange={(e) => {
                    const updated = [...aboutData.paragraphs];
                    updated[i] = e.target.value;
                    setAboutData({ ...aboutData, paragraphs: updated });
                  }}
                />
              ))}

              {/* Images */}
              {aboutData.images.map((img, i) => (
                <div key={i} className="space-y-2 border p-2 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Image {i + 1}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => toggleImageMode(i)}>
                      Switch to {img.mode === "url" ? "Upload" : "URL"}
                    </Button>
                  </div>

                  {img.mode === "url" ? (
                    <Input
                      type="url"
                      value={img.url || ""}
                      onChange={(e) => handleImageUrlChange(i, e.target.value)}
                      placeholder={`Enter Image ${i + 1} URL`}
                    />
                  ) : (
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(i, e.target.files?.[0] || null)} />
                  )}

                  {img.preview && (
                    <img src={img.preview} alt={`Preview ${i + 1}`} className="w-24 h-24 object-cover" />
                  )}

                  {(img.url || img.file) && (
                    <Button variant="outline" onClick={() => handleRemoveImage(i)}>Remove</Button>
                  )}
                </div>
              ))}

              {/* Stats */}
              {aboutData.stats.map((s, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Label"
                    value={s.label}
                    onChange={(e) => {
                      const updated = [...aboutData.stats];
                      updated[i].label = e.target.value;
                      setAboutData({ ...aboutData, stats: updated });
                    }}
                  />
                  <Input
                    placeholder="Value"
                    value={s.value}
                    onChange={(e) => {
                      const updated = [...aboutData.stats];
                      updated[i].value = e.target.value;
                      setAboutData({ ...aboutData, stats: updated });
                    }}
                  />
                  <Input
                    placeholder="Description"
                    value={s.description}
                    onChange={(e) => {
                      const updated = [...aboutData.stats];
                      updated[i].description = e.target.value;
                      setAboutData({ ...aboutData, stats: updated });
                    }}
                  />
                </div>
              ))}

              <Button type="button" className="w-full" onClick={handlePreviewSubmit}>
                Preview Changes
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={restoreDefaults}>
                Restore Defaults
              </Button>

            </form>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}