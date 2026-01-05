import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import { Plus, Trash2, Edit, Save, X, ArrowLeft, Loader2 } from "lucide-react";
import type { ClientNews } from "@shared/schema";

export default function AdminNews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { playHoverSound, playErrorSound, playSuccessSound } = useSound();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "",
    expiresAt: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Fetch news
  const { data: news = [], isLoading } = useQuery<ClientNews[]>({
    queryKey: ["/api/news"],
    queryFn: async () => {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
  });

  // Create news
  const createNews = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = { ...data, expiresAt: data.expiresAt || null };
      const res = await fetch("/api/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          "X-Requested-With": "SchoolConnect-App",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create news");
      return res.json();
    },
    onSuccess: () => {
      playSuccessSound();
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setFormData({ title: "", content: "", type: "", expiresAt: "" });
      toast({ title: "Success", description: "News created successfully!", variant: "default" });
    },
    onError: (err: any) => {
      playErrorSound();
      toast({
        title: "Creation Failed",
        description: err.message || "Failed to create news",
        variant: "destructive",
      });
    },
  });

  // Update news
  const updateNews = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const payload = { ...data, expiresAt: data.expiresAt || null };
      const res = await fetch(`/api/news/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          "X-Requested-With": "SchoolConnect-App",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update news");
      return res.json();
    },
    onSuccess: () => {
      playSuccessSound();
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setEditingId(null);
      setFormData({ title: "", content: "", type: "", expiresAt: "" });
      toast({ title: "Success", description: "News updated successfully!", variant: "default" });
    },
    onError: (err: any) => {
      playErrorSound();
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update news",
        variant: "destructive",
      });
    },
  });

  // Delete news
  const deleteNews = useMutation({
    mutationFn: async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this news?")) {
        throw new Error("Cancelled");
      }
      const res = await fetch(`/api/news/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}`, "X-Requested-With": "SchoolConnect-App" },
      });
      if (!res.ok) throw new Error("Failed to delete news");
      return res.json();
    },
    onSuccess: () => {
      playSuccessSound();
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "Success", description: "News deleted successfully!", variant: "default" });
    },
    onError: (err: any) => {
      if (err.message !== "Cancelled") {
        playErrorSound();
        toast({
          title: "Deletion Failed",
          description: err.message || "Failed to delete news",
          variant: "destructive",
        });
      }
    },
  });

  // Submit handler (add or update) - WITH VALIDATION
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Check required fields
    const titleTrimmed = formData.title.trim();
    const contentTrimmed = formData.content.trim();

    if (!titleTrimmed) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Title is required and cannot be empty", variant: "destructive" });
      return;
    }

    if (titleTrimmed.length < 3) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Title must be at least 3 characters long", variant: "destructive" });
      return;
    }

    if (titleTrimmed.length > 200) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Title must be 200 characters or less", variant: "destructive" });
      return;
    }

    if (!contentTrimmed) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Content is required and cannot be empty", variant: "destructive" });
      return;
    }

    if (contentTrimmed.length < 10) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Content must be at least 10 characters long", variant: "destructive" });
      return;
    }

    if (contentTrimmed.length > 10000) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Content must be 10000 characters or less", variant: "destructive" });
      return;
    }

    if (!formData.type) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Type (Announcement, News, Update) is required", variant: "destructive" });
      return;
    }

    // Edge case: Check if expiry date is in the future
    if (formData.expiresAt) {
      const expiryDate = new Date(formData.expiresAt);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      if (expiryDate <= currentDate) {
        playErrorSound();
        toast({
          title: "Validation Error",
          description: "Expiry date must be in the future (not today or earlier)",
          variant: "destructive",
        });
        setDateError("Expiry date must be in the future");
        return;
      }
      setDateError(null);
    }

    editingId
      ? updateNews.mutate({ id: editingId, data: formData })
      : createNews.mutate(formData);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">Please Wait...</span>
    </div>
  );
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Status banner */}
      {dateError && (
        <div className="p-3 rounded-lg text-center font-medium bg-red-700 text-red-100 shadow-md">
          {dateError}
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => (window.location.href = "/admin")}
        onMouseEnter={playHoverSound}
        className="flex items-center mb-6 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-4">Manage News</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 p-5 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">{editingId ? "Edit News" : "Create News"}</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white"
              placeholder="Enter news headline"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white"
              rows={4}
              placeholder="Detailed news content..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            >
              <option value="">Select type...</option>
              <option value="announcement">Announcement</option>
              <option value="news">News</option>
              <option value="update">Update</option>
            </select>
            <small className="text-gray-400 text-xs">Choose what kind of news item this is.</small>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expiry Date</label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            <small className="text-gray-400 text-xs">Leave blank for no expiry</small>
            {dateError && <p className="text-red-400 text-xs mt-1">{dateError}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              onMouseEnter={playHoverSound}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
            >
              {editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editingId ? "Update" : "Add"} News
            </button>
            {editingId && (
              <button
                type="button"
                onMouseEnter={playHoverSound}
                onClick={() => {
                  setEditingId(null);
                  setFormData({ title: "", content: "", type: "", expiresAt: "" });
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center"
              >
                <X className="w-4 h-4 mr-2" /> Cancel
              </button>
            )}
          </div>
        </form>

        {/* Live Preview */}
        {(formData.title || formData.content) && (
          <div className="bg-gray-900 p-5 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-2">Live Preview</h2>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">{formData.title || "Title Preview"}</h3>
              <p className="text-sm text-gray-300">{formData.content || "Content Preview"}</p>
              <p className="text-xs text-gray-400 mt-1">Type: {formData.type || "Type Preview"}</p>
              {formData.expiresAt && (
                <p className="text-xs text-gray-500">Expires: {new Date(formData.expiresAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* News List */}
      <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Existing News</h2>
        {news.length === 0 ? (
          <p className="text-gray-400">No existing news</p> // Show no existing news message
        ) : (
          <ul className="space-y-4">
            {news.map((item) => (
              <li key={item.id} className="p-4 bg-gray-900 rounded-lg flex justify-between items-start hover:bg-gray-700 transition">
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-300">{item.content}</p>
                  <span className="text-xs text-gray-400">Type: {item.type}</span>
                  {item.expiresAt && (
                    <p className="text-xs text-gray-500">Expires: {new Date(item.expiresAt).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    title="Edit this news"
                    onMouseEnter={playHoverSound}
                    onClick={() => {
                      setEditingId(item.id);
                      setFormData({
                        title: item.title,
                        content: item.content,
                        type: item.type,
                        expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().split("T")[0] : "",
                      });
                    }}
                    className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    title="Delete this news"
                    onMouseEnter={playHoverSound}
                    onClick={() => deleteNews.mutate(item.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
