import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { insertSectionSchema } from "@shared/schema";
import AboutSection from "@/components/about-section";

export default function AboutAdminPage() {
  // --- STATE MANAGEMENT ---
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<{
    id: number;
    text: string;
    type: "success" | "error";
  }[]>([]);
  const [aboutData, setAboutData] = useState<any>({
    name: "about",
    title: "",
    subtitle: "",
    paragraphs: ["", ""],
    images: ["", ""],
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

  // Fallback values
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
      try {
        const res = await fetch("/api/sections?name=about");
        console.log("Fetching About Section: ", res); // Log the response
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const sections = await res.json();
        console.log("Fetched Sections: ", sections); // Log fetched sections

        const section = Array.isArray(sections)
          ? sections.find((s: any) => s.name === "about")
          : sections;
        if (section) {
          console.log("About Section Found: ", section); // Log found section
          setSectionId(section._id || section.id);
          setAboutData({
            name: "about",
            title: section.title || "",
            subtitle: section.subtitle || "",
            paragraphs: section.paragraphs || fallbackParagraphs,
            images: section.images || fallbackImages,
            stats: section.stats || fallbackStats,
          });
        }
        return section;
      } catch (error) {
        console.error("Error fetching About Section: ", error); // Log error
      }
    },
    enabled: loggedIn,
  });

  // --- IMAGE URL OR UPLOAD TOGGLE LOGIC ---
  const [isImageUrl1, setIsImageUrl1] = useState(false);  // Image 1 URL toggle
  const [isImageUploaded1, setIsImageUploaded1] = useState(false);  // Image 1 upload toggle
  const [isImageUrl2, setIsImageUrl2] = useState(false);  // Image 2 URL toggle
  const [isImageUploaded2, setIsImageUploaded2] = useState(false);  // Image 2 upload toggle
  const [imagePreview1, setImagePreview1] = useState(""); // Preview for Image 1
  const [imagePreview2, setImagePreview2] = useState(""); // Preview for Image 2

  // Handle image toggles, URL change, and file uploads
  // --- IMAGE URL OR UPLOAD TOGGLE LOGIC ---
  const toggleImageSource1 = () => {
    console.log("Toggling Image Source 1. Current State: ", isImageUrl1); // Log the current state before toggling
    setIsImageUrl1(!isImageUrl1);
    setIsImageUploaded1(false);
    setImagePreview1("");
  };

  const toggleImageSource2 = () => {
    console.log("Toggling Image Source 2. Current State: ", isImageUrl2); // Log the current state before toggling
    setIsImageUrl2(!isImageUrl2);
    setIsImageUploaded2(false);
    setImagePreview2("");
  };

  // Image URL Change Handlers with Logging
  const handleImageUrlChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Image 1 URL Change: ", e.target.value); // Log URL change for Image 1
    const updatedImages = [...aboutData.images];
    updatedImages[0] = e.target.value;
    setAboutData({ ...aboutData, images: updatedImages });
  };

  const handleImageUrlChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Image 2 URL Change: ", e.target.value); // Log URL change for Image 2
    const updatedImages = [...aboutData.images];
    updatedImages[1] = e.target.value;
    setAboutData({ ...aboutData, images: updatedImages });
  };




  // File Upload Handlers with Logging
  const handleFileUpload1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      console.log("Image 1 Uploaded: ", file.name); // Log the uploaded file name
      setIsImageUploaded1(true);
      setImagePreview1(URL.createObjectURL(file));
      const updatedImages = [...aboutData.images];
      updatedImages[0] = file.name;
      setAboutData({ ...aboutData, images: updatedImages });
    }
  };

  const handleFileUpload2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      console.log("Image 2 Uploaded: ", file.name); // Log the uploaded file name
      setIsImageUploaded2(true);
      setImagePreview2(URL.createObjectURL(file));
      const updatedImages = [...aboutData.images];
      updatedImages[1] = file.name;
      setAboutData({ ...aboutData, images: updatedImages });
    }
  };

  // Remove Image Handlers with Logging
  const handleRemoveImage1 = () => {
    console.log("Removing Image 1"); // Log the removal of Image 1
    setIsImageUploaded1(false);
    setImagePreview1("");
    const updatedImages = [...aboutData.images];
    updatedImages[0] = "";
    setAboutData({ ...aboutData, images: updatedImages });
  };

  const handleRemoveImage2 = () => {
    console.log("Removing Image 2"); // Log the removal of Image 2
    setIsImageUploaded2(false);
    setImagePreview2("");
    const updatedImages = [...aboutData.images];
    updatedImages[1] = "";
    setAboutData({ ...aboutData, images: updatedImages });
  };

  // Restore Defaults with Logging
  const restoreDefaults = () => {
    console.log("Restoring Defaults"); // Log when defaults are restored
    setAboutData({
      name: "about",
      title: "About Us",
      subtitle: "Building futures through quality education and holistic development since 1946",
      paragraphs: fallbackParagraphs,
      images: fallbackImages,
      stats: fallbackStats,
    });
    setIsImageUrl1(true);
    setIsImageUploaded1(false);
    setIsImageUrl2(true);
    setIsImageUploaded2(false);
    setImagePreview1("");
    setImagePreview2("");
    setPreviewData(null);
    setPreviewMode(false);
    addMessage("Form reset to default values with fallback image URLs", "success");
  };

  // --- CREATE/UPDATE MUTATION ---
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating About Section with data: ", data); // Log the data being sent to create
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Failed to create: ${res.status}`);
      console.log("Section Created Successfully: ", res); // Log the successful creation response
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections/about"] });
      addMessage("About section created successfully", "success");
      setPreviewMode(false);
      setPreviewData(null);
    },
    onError: (error: any) => {
      console.error("Error creating About section: ", error); // Log any errors during creation
      addMessage(`Failed to create: ${error.message}`, "error");
      setPreviewMode(false);
      setPreviewData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Updating About Section with data: ", data); // Log the data being sent to update
      if (!sectionId) return await createMutation.mutateAsync(data);
      const res = await fetch(`/api/sections/${sectionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Failed to update: ${res.status}`);
      console.log("Section Updated Successfully: ", res); // Log the successful update response
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections/about"] });
      addMessage("About section updated successfully", "success");
      setPreviewMode(false);
      setPreviewData(null);
    },
    onError: (error: any) => {
      console.error("Error updating About section: ", error); // Log any errors during update
      console.log(`Failed to update: ${error.message}`, "error");
      setPreviewMode(false);
      setPreviewData(null);
    },
  });

  // Submit Handler with Logging
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", "about");
    formData.append("title", aboutData.title);
    formData.append("subtitle", aboutData.subtitle);
    aboutData.paragraphs.forEach((paragraph: string | Blob, i: any) => formData.append(`paragraphs[${i}]`, paragraph));
    aboutData.stats.forEach((stat: { label: string | Blob; value: string | Blob; description: string | Blob; }, i: any) => {
      formData.append(`stats[${i}][label]`, stat.label);
      formData.append(`stats[${i}][value]`, stat.value);
      formData.append(`stats[${i}][description]`, stat.description);
    });

    // Handle images (either uploaded or URL)
    aboutData.images.forEach((image: string | Blob, i: any) => {
      if (image && !isImageUrl1 && !isImageUrl2) {
        formData.append(`images[${i}]`, image); // Assuming image is a file object
      } else {
        formData.append(`images[${i}]`, image); // Assuming image is a URL
      }
    });

    console.log("FormData to send:", formData);

    // Proceed with the submission
    updateMutation.mutate(formData);
  };


  // Handle Preview Confirmation with Logging
  const handlePreviewConfirm = () => {
    if (previewData) {
      console.log("Preview confirmed, updating section with data: ", previewData); // Log preview confirmation
      updateMutation.mutate(previewData);
    } else {
      addMessage("No preview data to save", "error");
    }
  };


  const handlePreviewSubmit = () => {
    // Validate the data before showing the preview
    try {
      const data = insertSectionSchema.parse({
        name: "about",
        title: aboutData.title,
        subtitle: aboutData.subtitle,
        paragraphs: aboutData.paragraphs.filter((p: string) => p.trim()),
        images: aboutData.images.filter((i: string) => i.trim()),  // Ensure image URLs or filenames are valid
        stats: aboutData.stats.filter((s: any) => s.label.trim() && s.value.trim()),  // Ensure stats are valid
      });

      // Set the preview data and enable preview mode
      setPreviewData(data);
      setPreviewMode(true);  // Show preview
    } catch (error) {
      addMessage("About section validation failed", "error");  // Show error if validation fails
    }
  };

  // PREVIEW MODE
  if (previewMode && previewData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-4">Preview About Section</h1>
          <AboutSection section={previewData} />
        </div>
        <div className="fixed bottom-4 right-4 flex gap-2">
          <Button onClick={handlePreviewConfirm} className="bg-green-600 hover:bg-green-700">
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

            {/* Notifications */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded mb-2 ${msg.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
                  }`}
              >
                {msg.text}
              </div>
            ))}

            {/* Form */}
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
              {aboutData.paragraphs.map((p: string, i: number) => (
                <Textarea
                  required
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

              {/* Image 1 URL or File Upload Option */}
              <div className="flex gap-4">
                <Button onClick={toggleImageSource1} variant="outline">
                  {isImageUrl1 ? "Switch to Image Upload" : "Switch to Image URL"}
                </Button>

                {isImageUrl1 ? (
                  <Input
                    type="url"
                    value={aboutData.images[0]}
                    onChange={handleImageUrlChange1}
                    placeholder="Enter Image 1 URL"
                  />
                ) : (
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload1}
                    />
                    {imagePreview1 && <img src={imagePreview1} alt="Preview 1" />}
                  </div>
                )}

                {aboutData.images[0] && (
                  <Button variant="outline" onClick={handleRemoveImage1}>
                    Remove Image 1
                  </Button>
                )}
              </div>

              {/* Image 2 URL or File Upload Option */}
              <div className="flex gap-4">
                <Button onClick={toggleImageSource2} variant="outline">
                  {isImageUrl2 ? "Switch to Image Upload" : "Switch to Image URL"}
                </Button>

                {isImageUrl2 ? (
                  <Input
                    type="url"
                    value={aboutData.images[1]}
                    onChange={handleImageUrlChange2}
                    placeholder="Enter Image 2 URL"
                  />
                ) : (
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload2}
                    />
                    {imagePreview2 && <img src={imagePreview2} alt="Preview 2" />}
                  </div>
                )}

                {aboutData.images[1] && (
                  <Button variant="outline" onClick={handleRemoveImage2}>
                    Remove Image 2
                  </Button>
                )}
              </div>

              {/* Stats */}
              {aboutData.stats.map((s: any, i: number) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <Input
                    required
                    placeholder="Label"
                    value={s.label}
                    onChange={(e) => {
                      const updated = [...aboutData.stats];
                      updated[i].label = e.target.value;
                      setAboutData({ ...aboutData, stats: updated });
                    }}
                  />
                  <Input
                    required
                    placeholder="Value"
                    value={s.value}
                    onChange={(e) => {
                      const updated = [...aboutData.stats];
                      updated[i].value = e.target.value;
                      setAboutData({ ...aboutData, stats: updated });
                    }}
                  />
                  <Input
                    required
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

              <Button type="submit" className="w-full" onClick={handlePreviewSubmit}>
                Preview Changes
              </Button>
            </form>

            {/* Restore Defaults Button */}
            <Button
              variant="outline"
              onClick={restoreDefaults}
              className="mt-4"
            >
              Restore Defaults
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
