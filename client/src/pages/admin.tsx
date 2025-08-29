import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { insertSectionSchema, insertEventSchema, insertNewsSchema } from "@shared/schema";
import { z } from "zod";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<{ id: number; text: string; type: "success" | "error" }[]>([]);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", date: "", time: "", category: "" });
  const [newNews, setNewNews] = useState({ title: "", content: "", type: "" });
  const [sectionForms, setSectionForms] = useState<
    Record<string, { stats: { label: string; value: string; description: string }[]; profiles: { name: string; role: string; description: string; image: string }[] }>
  >({});
  const queryClient = useQueryClient();

  // Add message with auto-dismiss after 5 seconds
  const addMessage = (text: string, type: "success" | "error") => {
    const id = Date.now();
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 5000);
  };

  // Handle logout
  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("adminToken");
    setLoggedIn(false);
    addMessage("Logged out successfully", "success");
  };

  // Validate token on mount
  useEffect(() => {
    if (token) {
      fetch("/api/admin/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            setLoggedIn(true);
          } else {
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

  const { data: sections, isLoading } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const res = await fetch("/api/sections", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const sections = await res.json();
      // Initialize section forms
      setSectionForms(
        sections.reduce((acc: any, section: any) => ({
          ...acc,
          [section.id]: {
            stats: section.stats || [],
            profiles: section.profiles || [],
          },
        }), {})
      );
      return sections;
    },
    enabled: loggedIn,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/sections/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      addMessage("Section updated successfully", "success");
    },
    onError: (error: any) => {
      addMessage(error.message || "Failed to update section", "error");
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });
      if (!res.ok) throw new Error("Failed to create event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setNewEvent({ title: "", description: "", date: "", time: "", category: "" });
      addMessage("Event created successfully", "success");
    },
    onError: (error: any) => {
      addMessage(error.message || "Failed to create event", "error");
    },
  });

  const createNewsMutation = useMutation({
    mutationFn: async (newsData: any) => {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newsData),
      });
      if (!res.ok) throw new Error("Failed to create news");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setNewNews({ title: "", content: "", type: "" });
      addMessage("News created successfully", "success");
    },
    onError: (error: any) => {
      addMessage(error.message || "Failed to create news", "error");
    },
  });

  const handleAddStat = (sectionId: string) => {
    setSectionForms((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        stats: [...(prev[sectionId]?.stats || []), { label: "", value: "", description: "" }],
      },
    }));
  };

  const handleAddProfile = (sectionId: string) => {
    setSectionForms((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        profiles: [...(prev[sectionId]?.profiles || []), { name: "", role: "", description: "", image: "" }],
      },
    }));
  };

  const handleRemoveStat = (sectionId: string, index: number) => {
    setSectionForms((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        stats: prev[sectionId].stats.filter((_, i) => i !== index),
      },
    }));
  };

  const handleRemoveProfile = (sectionId: string, index: number) => {
    setSectionForms((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        profiles: prev[sectionId].profiles.filter((_, i) => i !== index),
      },
    }));
  };

  const handleStatChange = (sectionId: string, index: number, field: string, value: string) => {
    setSectionForms((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        stats: prev[sectionId].stats.map((stat: any, i: number) =>
          i === index ? { ...stat, [field]: value } : stat
        ),
      },
    }));
  };

  const handleProfileChange = (sectionId: string, index: number, field: string, value: string) => {
    setSectionForms((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        profiles: prev[sectionId].profiles.map((profile: any, i: number) =>
          i === index ? { ...profile, [field]: value } : profile
        ),
      },
    }));
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
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
      {/* Section Editing */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-2xl font-semibold mb-4">Edit Sections</h2>
        {isLoading ? (
          <p>Loading sections...</p>
        ) : (
          sections?.map((section: any) => (
            <div key={section.id} className="mb-4 p-4 border rounded">
              <h3 className="text-xl font-semibold mb-2">{section.name}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    const data = insertSectionSchema.parse({
                      name: section.name,
                      title: (e.target as any).title.value,
                      subtitle: (e.target as any).subtitle.value,
                      paragraphs: (e.target as any).paragraphs.value.split("\n").filter((p: string) => p.trim()),
                      images: (e.target as any).images.value.split(",").map((i: string) => i.trim()).filter((i: string) => i),
                      stats: sectionForms[section.id]?.stats.filter((s: any) => s.label && s.value),
                      profiles: sectionForms[section.id]?.profiles.filter((p: any) => p.name && p.role && p.description),
                    });
                    updateMutation.mutate({ id: section.id, data });
                  } catch (error) {
                    console.error("Section validation failed:", error);
                    addMessage("Section validation failed", "error");
                  }
                }}
              >
                <Input
                  name="title"
                  defaultValue={section.title}
                  placeholder="Section Title"
                  className="mb-2"
                  required
                />
                <Input
                  name="subtitle"
                  defaultValue={section.subtitle}
                  placeholder="Section Subtitle"
                  className="mb-2"
                />
                <Textarea
                  name="paragraphs"
                  defaultValue={section.paragraphs?.join("\n")}
                  placeholder="Paragraphs (one per line)"
                  className="mb-2"
                />
                <Input
                  name="images"
                  defaultValue={section.images?.join(",")}
                  placeholder="Image URLs (comma-separated)"
                  className="mb-2"
                />
                <h4 className="text-lg font-semibold mt-4 mb-2">Stats</h4>
                {sectionForms[section.id]?.stats.map((stat: any, index: number) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={stat.label}
                      onChange={(e) => handleStatChange(section.id, index, "label", e.target.value)}
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Input
                      value={stat.value}
                      onChange={(e) => handleStatChange(section.id, index, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-1"
                    />
                    <Input
                      value={stat.description}
                      onChange={(e) => handleStatChange(section.id, index, "description", e.target.value)}
                      placeholder="Description"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleRemoveStat(section.id, index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => handleAddStat(section.id)} className="mb-4">
                  Add Stat
                </Button>
                <h4 className="text-lg font-semibold mt-4 mb-2">Profiles</h4>
                {sectionForms[section.id]?.profiles.map((profile: any, index: number) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={profile.name}
                      onChange={(e) => handleProfileChange(section.id, index, "name", e.target.value)}
                      placeholder="Name"
                      className="flex-1"
                    />
                    <Input
                      value={profile.role}
                      onChange={(e) => handleProfileChange(section.id, index, "role", e.target.value)}
                      placeholder="Role"
                      className="flex-1"
                    />
                    <Input
                      value={profile.description}
                      onChange={(e) => handleProfileChange(section.id, index, "description", e.target.value)}
                      placeholder="Description"
                      className="flex-1"
                    />
                    <Input
                      value={profile.image}
                      onChange={(e) => handleProfileChange(section.id, index, "image", e.target.value)}
                      placeholder="Image URL"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleRemoveProfile(section.id, index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => handleAddProfile(section.id)} className="mb-4">
                  Add Profile
                </Button>
                <Button type="submit">Update Section</Button>
              </form>
            </div>
          ))
        )}
      </div>

      {/* Event Creation Form */}
      <div className="mb-8 p-4 border rounded">
        <h3 className="text-xl font-semibold mb-4">Create New Event</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const eventData = insertEventSchema.parse({
                ...newEvent,
                date: new Date(newEvent.date),
              });
              createEventMutation.mutate(eventData);
            } catch (error) {
              console.error("Event validation failed:", error);
              addMessage("Event validation failed", "error");
            }
          }}
        >
          <Input
            name="title"
            value={newEvent.title}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Event Title"
            className="mb-2"
            required
          />
          <Textarea
            name="description"
            value={newEvent.description}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Event Description"
            className="mb-2"
            required
          />
          <Input
            type="date"
            name="date"
            value={newEvent.date}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))}
            placeholder="Event Date"
            className="mb-2"
            required
          />
          <Input
            name="time"
            value={newEvent.time}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, time: e.target.value }))}
            placeholder="Event Time (e.g., 10:00 AM)"
            className="mb-2"
            required
          />
          <Input
            name="category"
            value={newEvent.category}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, category: e.target.value }))}
            placeholder="Event Category"
            className="mb-2"
            required
          />
          <Button type="submit">Create Event</Button>
        </form>
      </div>

      {/* News Creation Form */}
      <div className="mb-8 p-4 border rounded">
        <h3 className="text-xl font-semibold mb-4">Create New News</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const newsData = insertNewsSchema.parse(newNews);
              createNewsMutation.mutate(newsData);
            } catch (error) {
              console.error("News validation failed:", error);
              addMessage("News validation failed", "error");
            }
          }}
        >
          <Input
            name="title"
            value={newNews.title}
            onChange={(e) => setNewNews((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="News Title"
            className="mb-2"
            required
          />
          <Textarea
            name="content"
            value={newNews.content}
            onChange={(e) => setNewNews((prev) => ({ ...prev, content: e.target.value }))}
            placeholder="News Content"
            className="mb-2"
            required
          />
          <Input
            name="type"
            value={newNews.type}
            onChange={(e) => setNewNews((prev) => ({ ...prev, type: e.target.value }))}
            placeholder="News Type"
            className="mb-2"
            required
          />
          <Button type="submit">Create News</Button>
        </form>
      </div>
    </div>
  );
}