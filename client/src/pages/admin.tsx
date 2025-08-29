import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { insertSectionSchema } from "@shared/schema";
import { z } from "zod";
import AboutSection from "@/components/about-section";

type ClientSection = {
  name: string;
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  images?: string[];
  stats?: { label: string; value: string; description?: string }[];
  profiles?: { name: string; role: string; description: string; image?: string }[];
};

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<{ id: number; text: string; type: "success" | "error" }[]>([]);
  const [aboutData, setAboutData] = useState<ClientSection>({
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
  const [previewData, setPreviewData] = useState<ClientSection | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const queryClient = useQueryClient();
  const [sectionId, setSectionId] = useState("");

  // Add message with auto-dismiss after 5 seconds
  const addMessage = (text: string, type: "success" | "error") => {
    const id = Date.now();
    console.log(`Adding message: ${text} (Type: ${type}, ID: ${id})`);
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 5000);
  };

  // Handle logout
  const handleLogout = () => {
    console.log("Logging out: Clearing token and resetting state");
    setToken("");
    localStorage.removeItem("adminToken");
    setLoggedIn(false);
    setSelectedCategory("");
    addMessage("Logged out successfully", "success");
  };

  // Validate token on mount
  useEffect(() => {
    if (token) {
      console.log("Validating token on mount:", token);
      fetch("/api/admin/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            console.log("Token verification successful");
            setLoggedIn(true);
          } else {
            console.error("Token verification failed:", res.status, res.statusText);
            setToken("");
            localStorage.removeItem("adminToken");
            setLoggedIn(false);
          }
        })
        .catch((err) => {
          console.error("Token verification error:", err.message);
          setToken("");
          localStorage.removeItem("adminToken");
          setLoggedIn(false);
        });
    } else {
      console.log("No token found on mount");
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Login attempt:", form);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      console.log("Login response:", data);
      if (data.success) {
        setToken(data.token);
        setLoggedIn(true);
        localStorage.setItem("adminToken", data.token);
        addMessage("Logged in successfully", "success");
      } else {
        setError(data.message);
        addMessage(data.message, "error");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed");
      addMessage("Login failed", "error");
    }
  };

  const { data: aboutSection, isLoading: aboutLoading, error: queryError } = useQuery({
    queryKey: ["/api/sections/about"],
    queryFn: async () => {
      console.log("Fetching about section with token:", token);
      const res = await fetch("/api/sections?name=about", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Fetch about section failed:", {
          status: res.status,
          statusText: res.statusText,
          responseText: text.slice(0, 200),
        });
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      const sections = await res.json();
      console.log("Fetched about section response:", sections);
      const section = Array.isArray(sections) ? sections.find((s: any) => s.name === "about") : sections;
      if (section) {
        console.log("Setting sectionId:", section.id);
        setSectionId(section.id);
        setAboutData({
          name: "about",
          title: section.title || "",
          subtitle: section.subtitle || "",
          paragraphs: section.paragraphs || ["", ""],
          images: section.images || ["", ""],
          stats:
            section.stats || [
              { label: "", value: "", description: "" },
              { label: "", value: "", description: "" },
              { label: "", value: "", description: "" },
              { label: "", value: "", description: "" },
            ],
        });
      } else {
        console.warn("No 'about' section found, initializing default");
        setAboutData({
          name: "about",
          title: "About Us",
          subtitle: "Welcome to our school",
          paragraphs: ["", ""],
          images: ["", ""],
          stats: [
            { label: "", value: "", description: "" },
            { label: "", value: "", description: "" },
            { label: "", value: "", description: "" },
            { label: "", value: "", description: "" },
          ],
        });
      }
      return section;
    },
    enabled: loggedIn,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating new section with data:", data);
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Create section failed:", {
          status: res.status,
          statusText: res.statusText,
          responseText: text.slice(0, 200),
        });
        throw new Error(`Failed to create: ${res.status} ${res.statusText}`);
      }
      const result = await res.json();
      console.log("Create section response:", result);
      setSectionId(result.id);
      return result;
    },
    onSuccess: () => {
      console.log("Create successful, invalidating query cache");
      queryClient.invalidateQueries({ queryKey: ["/api/sections/about"] });
      addMessage("About section created successfully", "success");
      setPreviewMode(false);
      setPreviewData(null);
    },
    onError: (error: any) => {
      console.error("Create error:", error.message);
      addMessage(`Failed to create: ${error.message}`, "error");
      setPreviewMode(false);
      setPreviewData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!sectionId) {
        console.log("No sectionId, attempting to create new section");
        return await createMutation.mutateAsync(data);
      }
      console.log("Updating section with ID:", sectionId, "Data:", data);
      const res = await fetch(`/api/sections/${sectionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Update section failed:", {
          status: res.status,
          statusText: res.statusText,
          responseText: text.slice(0, 200),
        });
        throw new Error(`Failed to update: ${res.status} ${res.statusText}`);
      }
      const result = await res.json();
      console.log("Update section response:", result);
      return result;
    },
    onSuccess: () => {
      console.log("Update successful, invalidating query cache");
      queryClient.invalidateQueries({ queryKey: ["/api/sections/about"] });
      addMessage("About section updated successfully", "success");
      setPreviewMode(false);
      setPreviewData(null);
    },
    onError: (error: any) => {
      console.error("Update error:", error.message);
      addMessage(`Failed to update: ${error.message}`, "error");
      setPreviewMode(false);
      setPreviewData(null);
    },
  });

  const handleCreateAboutSection = () => {
    console.log("Creating default about section");
    try {
      const defaultData = insertSectionSchema.parse({
        name: "about",
        title: "About Us",
        subtitle: "Welcome to our school",
        paragraphs: ["", ""],
        images: ["", ""],
        stats: [
          { label: "", value: "", description: "" },
          { label: "", value: "", description: "" },
          { label: "", value: "", description: "" },
          { label: "", value: "", description: "" },
        ],
      });
      createMutation.mutate(defaultData);
    } catch (error) {
      console.error("Failed to create default about section:", error);
      addMessage("Failed to create default about section", "error");
    }
  };

  const handleAddParagraph = () => {
    console.log("Adding new paragraph to aboutData");
    setAboutData((prev) => ({ ...prev, paragraphs: [...(prev.paragraphs || []), ""] }));
  };

  const handleRemoveParagraph = (index: number) => {
    console.log(`Removing paragraph at index ${index}`);
    setAboutData((prev) => ({
      ...prev,
      paragraphs: (prev.paragraphs || []).filter((_, i) => i !== index),
    }));
  };

  const handleParagraphChange = (index: number, value: string) => {
    console.log(`Updating paragraph ${index}:`, value);
    setAboutData((prev) => {
      const paragraphs = [...(prev.paragraphs || [])];
      paragraphs[index] = value;
      return { ...prev, paragraphs };
    });
  };

  const handleAddImage = () => {
    console.log("Adding new image to aboutData");
    setAboutData((prev) => ({ ...prev, images: [...(prev.images || []), ""] }));
  };

  const handleRemoveImage = (index: number) => {
    console.log(`Removing image at index ${index}`);
    setAboutData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (index: number, value: string) => {
    console.log(`Updating image ${index}:`, value);
    setAboutData((prev) => {
      const images = [...(prev.images || [])];
      images[index] = value;
      return { ...prev, images };
    });
  };

  const handleAddStat = () => {
    console.log("Adding new stat to aboutData");
    setAboutData((prev) => ({ ...prev, stats: [...(prev.stats || []), { label: "", value: "", description: "" }] }));
  };

  const handleRemoveStat = (index: number) => {
    console.log(`Removing stat at index ${index}`);
    setAboutData((prev) => ({
      ...prev,
      stats: (prev.stats || []).filter((_, i) => i !== index),
    }));
  };

  const handleStatChange = (index: number, field: "label" | "value" | "description", value: string) => {
    console.log(`Updating stat ${index} field ${field}:`, value);
    setAboutData((prev) => {
      const stats = [...(prev.stats || [])];
      stats[index] = { ...stats[index], [field]: value };
      return { ...prev, stats };
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted with data:", aboutData);
    try {
      const data = insertSectionSchema.parse({
        name: "about",
        title: aboutData.title,
        subtitle: aboutData.subtitle,
        paragraphs: (aboutData.paragraphs || []).filter((p) => p.trim()),
        images: (aboutData.images || []).filter((i) => i.trim()),
        stats: (aboutData.stats || []).filter((s) => s.label.trim() && s.value.trim()),
      });
      console.log("Validated form data:", data);
      setPreviewData(data);
      setPreviewMode(true);
    } catch (error) {
      console.error("About section validation failed:", error);
      addMessage("About section validation failed", "error");
    }
  };

  const handlePreviewConfirm = () => {
    if (previewData) {
      console.log("Preview confirmed, saving data:", previewData);
      updateMutation.mutate(previewData);
    } else {
      console.error("No preview data to save");
      addMessage("No preview data to save", "error");
    }
  };

  const handlePreviewCancel = () => {
    console.log("Preview cancelled, resetting preview state");
    setPreviewMode(false);
    setPreviewData(null);
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Admin Login</h2>
          <form onSubmit={handleLogin}>
            <Input
              name="username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="Username"
              className="mb-4"
              required
            />
            <Input
              type="password"
              name="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password"
              className="mb-4"
              required
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </div>
      </div>
    );
  }

  if (previewMode && previewData) {
    return (
      <div className="min-h-screen bg-background p-4 relative">
        <style>
          {`
            .preview-compact .enhanced-card {
              padding: 0.75rem !important;
            }
            .preview-compact .enhanced-card h3 {
              font-size: 1rem !important;
              margin-bottom: 0.5rem !important;
            }
            .preview-compact .enhanced-card p {
              font-size: 0.75rem !important;
            }
            .preview-compact .enhanced-card div.w-12.h-12 {
              width: 2rem !important;
              height: 2rem !important;
            }
            .preview-compact .enhanced-card svg {
              width: 1rem !important;
              height: 1rem !important;
            }
            .preview-compact .facilities-section {
              padding: 1.5rem !important;
            }
            .preview-compact .facilities-section h3 {
              font-size: 1.25rem !important;
              margin-bottom: 1rem !important;
            }
            .preview-compact .facilities-section .w-16.h-16 {
              width: 3rem !important;
              height: 3rem !important;
            }
            .preview-compact .facilities-section span {
              font-size: 1rem !important;
            }
            .preview-compact .facilities-section h4 {
              font-size: 0.875rem !important;
              margin-bottom: 0.25rem !important;
            }
            .preview-compact .facilities-section p {
              font-size: 0.75rem !important;
            }
          `}
        </style>
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-4">Preview About Section</h1>
          <div className="preview-compact">
            <AboutSection section={previewData} />
          </div>
        </div>
        <div className="fixed bottom-4 right-4 flex gap-2">
          <Button onClick={handlePreviewConfirm} className="bg-green-600 hover:bg-green-700">
            OK
          </Button>
          <Button onClick={handlePreviewCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <div className="w-64 bg-card shadow-lg p-4">
          <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
          <ul className="space-y-2">
            <li>
              <Button
                variant={selectedCategory === "about" ? "default" : "outline"}
                className="w-full text-left"
                onClick={() => setSelectedCategory("about")}
              >
                About
              </Button>
            </li>
          </ul>
          <Button variant="outline" className="w-full mt-4" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        {/* Main Content */}
        <div className="flex-1 p-4">
          <div className="container mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold mb-4">Content Management</h1>
            {/* Message Display */}
            {messages.length > 0 && (
              <div className="mb-4 space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded text-sm animate-fade-out ${
                      msg.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
            )}
            {selectedCategory === "about" ? (
              aboutLoading ? (
                <p>Loading about section...</p>
              ) : queryError ? (
                <div>
                  <p className="text-red-500 mb-4">Failed to load about section: {queryError.message}</p>
                  <Button onClick={handleCreateAboutSection} className="mb-4">
                    Create Default About Section
                  </Button>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input
                          value={aboutData.title}
                          onChange={(e) => setAboutData((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="About Title"
                          className="mb-2"
                          required
                        />
                      </TooltipTrigger>
                      <TooltipContent>This changes the main header title in the About section (h2 tag)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input
                          value={aboutData.subtitle}
                          onChange={(e) => setAboutData((prev) => ({ ...prev, subtitle: e.target.value }))}
                          placeholder="About Subtitle"
                          className="mb-2"
                        />
                      </TooltipTrigger>
                      <TooltipContent>This changes the subtitle text below the title in the About section (p tag)</TooltipContent>
                    </Tooltip>
                    <h4 className="text-lg font-semibold">Paragraphs (Heritage Description)</h4>
                    {(aboutData.paragraphs || []).map((para, index) => (
                      <div key={index} className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Textarea
                              value={para}
                              onChange={(e) => handleParagraphChange(index, e.target.value)}
                              placeholder={`Paragraph ${index + 1}`}
                              className="flex-1"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            This changes the {index + 1}th paragraph in the Heritage section of About
                          </TooltipContent>
                        </Tooltip>
                        <Button type="button" variant="destructive" onClick={() => handleRemoveParagraph(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddParagraph}>
                      Add Paragraph
                    </Button>
                    <h4 className="text-lg font-semibold">Images (Heritage Images)</h4>
                    {(aboutData.images || []).map((img, index) => (
                      <div key={index} className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              value={img}
                              onChange={(e) => handleImageChange(index, e.target.value)}
                              placeholder={`Image URL ${index + 1}`}
                              className="flex-1"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            This changes the {index + 1}th image in the Heritage section of About
                          </TooltipContent>
                        </Tooltip>
                        <Button type="button" variant="destructive" onClick={() => handleRemoveImage(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddImage}>
                      Add Image
                    </Button>
                    <h4 className="text-lg font-semibold">Stats (Facilities Section)</h4>
                    {(aboutData.stats || []).map((stat, index) => (
                      <div key={index} className="space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              value={stat.label}
                              onChange={(e) => handleStatChange(index, "label", e.target.value)}
                              placeholder="Stat Label (e.g., Classrooms)"
                            />
                          </TooltipTrigger>
                          <TooltipContent>This changes the label for stat {index + 1} in Facilities</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              value={stat.value}
                              onChange={(e) => handleStatChange(index, "value", e.target.value)}
                              placeholder="Stat Value (e.g., 30)"
                            />
                          </TooltipTrigger>
                          <TooltipContent>This changes the value for stat {index + 1} in Facilities</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              value={stat.description}
                              onChange={(e) => handleStatChange(index, "description", e.target.value)}
                              placeholder="Stat Description (e.g., Well-equipped learning spaces)"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            This changes the description for stat {index + 1} in Facilities
                          </TooltipContent>
                        </Tooltip>
                        <Button type="button" variant="destructive" onClick={() => handleRemoveStat(index)}>
                          Remove Stat
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddStat}>
                      Add Stat
                    </Button>
                    <Button type="submit" className="w-full mt-4">Preview Changes</Button>
                  </form>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Edit About Section</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input
                          value={aboutData.title}
                          onChange={(e) => setAboutData((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="About Title"
                          className="mb-2"
                          required
                        />
                      </TooltipTrigger>
                      <TooltipContent>This changes the main header title in the About section (h2 tag)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input
                          value={aboutData.subtitle}
                          onChange={(e) => setAboutData((prev) => ({ ...prev, subtitle: e.target.value }))}
                          placeholder="About Subtitle"
                          className="mb-2"
                        />
                      </TooltipTrigger>
                      <TooltipContent>This changes the subtitle text below the title in the About section (p tag)</TooltipContent>
                    </Tooltip>
                    <h4 className="text-lg font-semibold">Paragraphs (Heritage Description)</h4>
                    {(aboutData.paragraphs || []).map((para, index) => (
                      <div key={index} className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Textarea
                              value={para}
                              onChange={(e) => handleParagraphChange(index, e.target.value)}
                              placeholder={`Paragraph ${index + 1}`}
                              className="flex-1"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            This changes the {index + 1}th paragraph in the Heritage section of About
                          </TooltipContent>
                        </Tooltip>
                        <Button type="button" variant="destructive" onClick={() => handleRemoveParagraph(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddParagraph}>
                      Add Paragraph
                    </Button>
                    <h4 className="text-lg font-semibold">Images (Heritage Images)</h4>
                    {(aboutData.images || []).map((img, index) => (
                      <div key={index} className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              value={img}
                              onChange={(e) => handleImageChange(index, e.target.value)}
                              placeholder={`Image URL ${index + 1}`}
                              className="flex-1"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            This changes the {index + 1}th image in the Heritage section of About
                          </TooltipContent>
                        </Tooltip>
                        <Button type="button" variant="destructive" onClick={() => handleRemoveImage(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddImage}>
                      Add Image
                    </Button>
                    <h4 className="text-lg font-semibold">Stats (Facilities Section)</h4>
                    {(aboutData.stats || []).map((stat, index) => (
                      <div key={index} className="space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              value={stat.label}
                              onChange={(e) => handleStatChange(index, "label", e.target.value)}
                              placeholder="Stat Label (e.g., Classrooms)"
                            />
                          </TooltipTrigger>
                          <TooltipContent>This changes the label for stat {index + 1} in Facilities</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              value={stat.value}
                              onChange={(e) => handleStatChange(index, "value", e.target.value)}
                              placeholder="Stat Value (e.g., 30)"
                            />
                          </TooltipTrigger>
                          <TooltipContent>This changes the value for stat {index + 1} in Facilities</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              value={stat.description}
                              onChange={(e) => handleStatChange(index, "description", e.target.value)}
                              placeholder="Stat Description (e.g., Well-equipped learning spaces)"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            This changes the description for stat {index + 1} in Facilities
                          </TooltipContent>
                        </Tooltip>
                        <Button type="button" variant="destructive" onClick={() => handleRemoveStat(index)}>
                          Remove Stat
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddStat}>
                      Add Stat
                    </Button>
                    <Button type="submit" className="w-full mt-4">Preview Changes</Button>
                  </form>
                </div>
              )
            ) : (
              <p className="text-gray-500">Select a category from the sidebar to edit content.</p>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}