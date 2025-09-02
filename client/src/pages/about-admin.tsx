import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import AboutSection from "@/components/about-section";

type ImageInput = {
  url: string;
  id?: string;
  mode: "url" | "upload";
  file?: File;
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
  "Established in 1946, Navamukunda Higher Secondary School Thirunavaya has been a beacon of educational excellence in the rural landscape of Malappuram district, Kerala. For over seven decades, we have been committed to nurturing young minds and shaping the leaders of tomorrow.",
  "As a privately aided co-educational institution, we serve students from grades 5 to 12, providing quality education in Malayalam medium. Our school is strategically located in the TIRUR block, easily accessible by all-weather roads.",
];

const fallbackImages: ImageInput[] = [
  {
    id: "fallback1",
    url: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=600&h=400",
    mode: "url",
  },
  {
    id: "fallback2",
    url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&h=400",
    mode: "url",
  },
];

const fallbackStats = [
  { label: "Students", value: "2.5K", description: "Well-equipped learning spaces" },
  { label: "Teachers", value: "60", description: "Extensive collection of resources" },
  { label: "Labs", value: "6", description: "Modern computer laboratory" },
  { label: "Courses", value: "3", description: "Separate facilities for all" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export default function AboutAdminPage() {
  const [aboutData, setAboutData] = useState<AboutData>({
    name: "about",
    title: "About Us",
    subtitle: "Building futures through quality education and holistic development since 1946",
    paragraphs: fallbackParagraphs,
    images: fallbackImages,
    stats: fallbackStats,
  });
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadSection = async () => {
      try {
        const res = await fetch("/api/sections?name=about");
        if (!res.ok) throw new Error("Failed to fetch");
        const sections = await res.json();
        const section = sections[0];
        if (section) {
          let images = (section.images || []).map((img: any) =>
            typeof img === "string"
              ? { id: "", url: img, mode: "url" }
              : { id: img.id, url: img.url, mode: "url" }
          );
          while (images.length < 2) {
            images.push(fallbackImages[images.length]);
          }
          if (images.length > 2) images = images.slice(0, 2);
          setAboutData({ ...section, images });
        }
      } catch {
        toast({ title: "Warning ⚠", description: "No Field Data Found, Using Default Values" });
      }
    };
    loadSection();
  }, []);

  const handleChange = (field: keyof AboutData, value: any) => {
    setAboutData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageModeToggle = (index: number) => {
    const updated = [...aboutData.images];
    updated[index].mode = updated[index].mode === "url" ? "upload" : "url";
    updated[index].url = "";
    updated[index].id = undefined;
    updated[index].file = undefined;
    setAboutData({ ...aboutData, images: updated });
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const updated = [...aboutData.images];
    updated[index].url = value;
    updated[index].id = undefined;
    updated[index].file = undefined;
    setAboutData({ ...aboutData, images: updated });
  };

  const handleFileSelect = (file: File, index: number) => {
    const blobUrl = URL.createObjectURL(file);
    const updated = [...aboutData.images];
    updated[index] = { url: blobUrl, file, mode: "upload" };
    setAboutData({ ...aboutData, images: updated });
  };

  const uploadIfNeeded = async (img: ImageInput) => {
    if (img.mode === "upload" && img.file && img.url.startsWith("blob:")) {
      const formData = new FormData();
      formData.append("file", img.file);
      try {
        const res = await fetch("/api/media", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) {
          return { url: data.url, id: data.id, mode: "upload" };
        } else {
          toast({ title: "Error", description: data.message });
        }
      } catch {
        toast({ title: "Error", description: "Upload failed" });
      }
    }
    return { url: img.url, id: img.id, mode: img.mode };
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...aboutData.images];
    updated[index] = { url: "", mode: "url" };
    setAboutData({ ...aboutData, images: updated });
  };

  const handleSave = async () => {
    try {
      const uploadedImages = await Promise.all(aboutData.images.map(uploadIfNeeded));
      const payload = {
        ...aboutData,
        images: uploadedImages.filter((i) => i.url).map((i) => ({ id: i.id || "", url: i.url })),
      };
      const res = await fetch("/api/sections/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "Saved", description: "About section updated successfully" });
        setPreviewMode(false);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to save" });
      }
    } catch {
      toast({ title: "Error", description: "Network error while saving" });
    }
  };

  const handleRestoreDefaults = () => {
    setAboutData({
      name: "about",
      title: "About Us",
      subtitle: "Building futures through quality education and holistic development since 1946",
      paragraphs: fallbackParagraphs,
      images: fallbackImages,
      stats: fallbackStats,
    });
    toast({ title: "Restored", description: "All fields reset to default values" });
  };

  return (
    <div className="p-6 space-y-6">
      {!previewMode ? (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Edit About Us Section</h1>
            <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
              Back to Dashboard
            </Button>
          </div>
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* General Info */}
            <Card className="bg-white/10 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl">
              <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input className="bg-gray-800/70 border border-gray-600 text-gray-100 
           placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required value={aboutData.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="Title" />
                <Input className="bg-gray-800/70 border border-gray-600 text-gray-100 
           placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required value={aboutData.subtitle} onChange={(e) => handleChange("subtitle", e.target.value)} placeholder="Subtitle" />
                {aboutData.paragraphs.map((p, i) => (
                  <Textarea className="bg-gray-800/70 border border-gray-600 text-gray-100 
           placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    key={i} value={p} onChange={(e) => {
                      const updated = [...aboutData.paragraphs];
                      updated[i] = e.target.value;
                      setAboutData({ ...aboutData, paragraphs: updated });
                    }} placeholder={`Paragraph ${i + 1}`} />
                ))}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Images */}
            <Card className="bg-white/10 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl">
              <CardHeader><CardTitle>Images</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aboutData.images.map((img, i) => (
                  <div key={i} className="space-y-2 border rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleImageModeToggle(i)}>
                        {img.mode === "url" ? "Switch to Upload" : "Switch to URL"}
                      </Button>
                      {img.url && !fallbackImages.some(f => f.url === img.url) && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveImage(i)}>
                          Remove
                        </Button>
                      )}
                    </div>
                    {img.mode === "url" ? (
                      <Input className="bg-gray-800/70 border border-gray-600 text-gray-100 
           placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder={`Image URL ${i + 1}`} value={img.url} onChange={(e) => handleImageUrlChange(i, e.target.value)} />
                    ) : (
                      <Input className="bg-gray-800/70 border border-gray-600 text-gray-100 
           placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        type="file" accept="image/*" onChange={(e) => {
                          if (e.target.files?.[0]) handleFileSelect(e.target.files[0], i);
                        }} />
                    )}
                    {img.url && (
                      <img src={img.url} alt={`Preview ${i + 1}`} className="w-full h-40 object-cover rounded-md border" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Stats */}
            <Card className="bg-white/10 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl">
              <CardHeader><CardTitle>Statistics</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {aboutData.stats.map((stat, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <Input className="bg-gray-800/70 border border-gray-600 text-gray-100 
           placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required value={stat.label} onChange={(e) => {
                        const updated = [...aboutData.stats];
                        updated[i].label = e.target.value;
                        setAboutData({ ...aboutData, stats: updated });
                      }} placeholder="Label" />
                    <Input className="bg-gray-800/70 border border-gray-600 text-gray-100 
           placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required value={stat.value} onChange={(e) => {
                        const updated = [...aboutData.stats];
                        updated[i].value = e.target.value;
                        setAboutData({ ...aboutData, stats: updated });
                      }} placeholder="Value" />
                    <Input className="bg-gray-800/70 border border-gray-600 text-gray-100 
           placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required value={stat.description} onChange={(e) => {
                        const updated = [...aboutData.stats];
                        updated[i].description = e.target.value;
                        setAboutData({ ...aboutData, stats: updated });
                      }} placeholder="Description" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
          {/* Actions */}
          <div className="flex space-x-4">
            <Button onClick={handleSave} variant="default">Save</Button>
            <Button onClick={() => setPreviewMode(true)} variant="outline">Preview</Button>
            <Button onClick={handleRestoreDefaults} variant="destructive">Restore Defaults</Button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <AboutSection section={{ ...aboutData, images: aboutData.images.filter((i) => i.url).map((i) => ({ id: i.id || "", url: i.url })) }} />
          <div className="flex space-x-4">
            <Button onClick={() => setPreviewMode(false)}>Back to Edit</Button>
            <Button onClick={handleSave} variant="default">Save & Exit Preview</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/admin")}>Back to Dashboard</Button>
          </div>
        </div>
      )}
    </div>
  );
}
