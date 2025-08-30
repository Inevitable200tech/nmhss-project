import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Save, X, ArrowLeft } from "lucide-react";
import type { ClientNews } from "@shared/schema";

export default function AdminNews() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "",
    expiresAt: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null); // State for date error

  // Helper to show auto-hide message
  const showMessage = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

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
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create news");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setFormData({ title: "", content: "", type: "", expiresAt: "" });
      showMessage("✅ News created successfully!");
    },
    onError: () => showMessage("❌ Failed to create news"),
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
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update news");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setEditingId(null);
      setFormData({ title: "", content: "", type: "", expiresAt: "" });
      showMessage("✅ News updated successfully!");
    },
    onError: () => showMessage("❌ Failed to update news"),
  });

  // Delete news
  const deleteNews = useMutation({
    mutationFn: async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this news?")) {
        throw new Error("Cancelled");
      }
      const res = await fetch(`/api/news/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      if (!res.ok) throw new Error("Failed to delete news");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      showMessage("🗑️ News deleted successfully!");
    },
    onError: (err) => {
      if (err.message !== "Cancelled") {
        showMessage("❌ Failed to delete news");
      }
    },
  });

  // Submit handler (add or update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side validation for expiration date
    const expiryDate = new Date(formData.expiresAt);
    const currentDate = new Date();

    // Check if the expiry date is in the future
    if (formData.expiresAt && expiryDate <= currentDate) {
      setDateError("❌ Expiry date must be in the future.");
      return; // Prevent form submission
    } else {
      setDateError(null); // Clear error if the date is valid
    }

    editingId ? updateNews.mutate({ id: editingId, data: formData }) : createNews.mutate(formData);
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Status banner */}
      {statusMessage && (
        <div className="p-3 rounded-lg text-center font-medium bg-gray-700 text-white shadow-md">
          {statusMessage}
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => (window.location.href = "/admin")}
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
            {dateError && <p className="text-red-500 text-xs mt-2">{dateError}</p>} {/* Show error */}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
            >
              {editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editingId ? "Update" : "Add"} News
            </button>
            {editingId && (
              <button
                type="button"
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
