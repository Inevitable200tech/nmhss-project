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
  const [messages, setMessages] = useState<
    { id: number; text: string; type: "success" | "error" }[]
  >([]);
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

  // --- AUTHENTICATION CHECK ---
  useEffect(() => {
    if (token) {
      fetch("/api/admin/verify", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res.ok) setLoggedIn(true);
          else {
            setToken("");
            localStorage.removeItem("adminToken");
            setLoggedIn(false);
          }
        })
        .catch(() => {
          setToken("");
          localStorage.removeItem("adminToken");
          setLoggedIn(false);
        });
    }
  }, [token]);

  // --- NOTIFICATION HELPER ---
  const addMessage = (text: string, type: "success" | "error") => {
    const id = Date.now();
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 5000);
  };

  // --- LOGIN HANDLER ---
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setLoggedIn(true);
        localStorage.setItem("adminToken", data.token);
        addMessage("Logged in successfully", "success");
      } else {
        setError(data.message);
        addMessage(data.message, "error");
      }
    } catch {
      setError("Login failed");
      addMessage("Login failed", "error");
    }
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
          images: section.images || ["", ""],
          stats:
            section.stats ||
            [
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

  // --- CREATE / UPDATE MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Failed to create: ${res.status}`);
      const result = await res.json();
      setSectionId(result.id);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections/about"] });
      addMessage("About section created successfully", "success");
      setPreviewMode(false);
      setPreviewData(null);
    },
    onError: (error: any) => {
      addMessage(`Failed to create: ${error.message}`, "error");
      setPreviewMode(false);
      setPreviewData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
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
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections/about"] });
      addMessage("About section updated successfully", "success");
      setPreviewMode(false);
      setPreviewData(null);
    },
    onError: (error: any) => {
      addMessage(`Failed to update: ${error.message}`, "error");
      setPreviewMode(false);
      setPreviewData(null);
    },
  });

  // --- FORM SUBMIT HANDLER ---
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const data = insertSectionSchema.parse({
        name: "about",
        title: aboutData.title,
        subtitle: aboutData.subtitle,
        paragraphs: aboutData.paragraphs.filter((p: string) => p.trim()),
        images: aboutData.images.filter((i: string) => i.trim()),
        stats: aboutData.stats.filter((s: any) => s.label.trim() && s.value.trim()),
      });
      setPreviewData(data);
      setPreviewMode(true);
    } catch {
      addMessage("About section validation failed", "error");
    }
  };

  const handlePreviewConfirm = () => {
    if (previewData) updateMutation.mutate(previewData);
    else addMessage("No preview data to save", "error");
  };

  // --- UI RENDERING ---

  // LOGIN PAGE
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

  // EDIT MODE
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 p-4">
          <div className="container mx-auto max-w-2xl">
            {/* Back Button */}
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
                className={`p-2 rounded mb-2 ${
                  msg.type === "success"
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
                placeholder="Title"
                value={aboutData.title}
                onChange={(e) => setAboutData({ ...aboutData, title: e.target.value })}
              />
              <Input
                placeholder="Subtitle"
                value={aboutData.subtitle}
                onChange={(e) => setAboutData({ ...aboutData, subtitle: e.target.value })}
              />
              {aboutData.paragraphs.map((p: string, i: number) => (
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
              {aboutData.images.map((img: string, i: number) => (
                <Input
                  key={i}
                  placeholder={`Image URL ${i + 1}`}
                  value={img}
                  onChange={(e) => {
                    const updated = [...aboutData.images];
                    updated[i] = e.target.value;
                    setAboutData({ ...aboutData, images: updated });
                  }}
                />
              ))}
              {aboutData.stats.map((s: any, i: number) => (
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
              <Button type="submit" className="w-full">
                Preview Changes
              </Button>
            </form>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
