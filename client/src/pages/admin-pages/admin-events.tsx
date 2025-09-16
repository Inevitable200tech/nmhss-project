import { useState, useEffect } from "react";
import type { ClientEvent } from "@shared/schema";

export default function AdminEvents() {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("academic");

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Events list state
  const [events, setEvents] = useState<ClientEvent[]>([]);

  // Edit mode
  const [editId, setEditId] = useState<string | null>(null);

  // Fetch all events
  const fetchEvents = async () => {
    try {
      console.log("[Event Management] Fetching all events...");
      const res = await fetch("/api/events");
      const data = await res.json();
      console.log("[Event Management] Events fetched:", data);

      setEvents(
        data.map((event: any) => ({
          ...event,
          date: new Date(event.date),
          createdAt: new Date(event.createdAt),
        }))
      );
    } catch (err) {
      console.error("[Event Management] Failed to load events", err);
    }
  };

  useEffect(() => {
    console.log("[Event Management] useEffect: Component mounted, fetching events...");
    fetchEvents();
  }, []);

  // Submit handler (add or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Event Management] Handle submit triggered.");
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        title,
        description,
        date: new Date(date),
        time,
        category,
      };
      console.log("[Event Management] Payload:", payload);

      const token = localStorage.getItem("adminToken");

      let res;
      if (editId) {
        console.log("[Event Management] Updating event with ID:", editId);
        res = await fetch(`/api/events/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,  // Attach the token here
          },
          body: JSON.stringify(payload),
        });
      } else {
        console.log("[Event Management] Creating new event...");
        res = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,  // Attach the token here
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      console.log("[Event Management] Server response:", data);
      if (!res.ok) throw new Error(data.error || "Failed to save event");

      setMessage(editId ? "✅ Event updated successfully!" : "✅ Event added successfully!");
      console.log("[Event Management] Event saved successfully.");
      resetForm();
      fetchEvents();
    } catch (err: any) {
      setMessage("❌ " + err.message);
      console.error("[Event Management] Error saving event:", err.message);
    } finally {
      setLoading(false);
      console.log("[Event Management] Submit process complete.");
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    // Add the Authorization header with the Bearer token
    try {
      const token = localStorage.getItem("adminToken");
      console.log("[Event Management] Handle Delete triggered for event ID:", id);
      console.log("[Event Management] Token:", token);

      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,  // Make sure this is included
        },
      });

      const data = await res.json();
      console.log("[Event Management] Delete event response:", data);

      if (!res.ok) throw new Error(data.error || "Failed to delete event");

      setMessage("🗑️ Event deleted successfully!");
      fetchEvents();
    } catch (err: any) {
      setMessage("❌ " + err.message);
      console.error("[Event Management] Error deleting event:", err.message);
    }
  };

  // Load event into form for editing
  const handleEdit = (event: ClientEvent) => {
    console.log("[Event Management] Edit event triggered:", event);
    setEditId(event.id);
    setTitle(event.title);
    setDescription(event.description);
    setDate(new Date(event.date).toISOString().split("T")[0]);
    setTime(event.time);
    setCategory(event.category);
  };

  // Reset form
  const resetForm = () => {
    console.log("[Event Management] Resetting form.");
    setEditId(null);
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setCategory("academic");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      {/* Back Button */}
      <button
        onClick={() => (window.location.href = "/admin")}
        className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg shadow"
      >
        ← Back to Admin Dashboard
      </button>

      <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">📅 Manage Events</h2>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-4 p-3 rounded ${message.startsWith("✅") || message.startsWith("🗑️")
              ? "bg-green-700 text-green-100"
              : "bg-red-700 text-red-100"
              }`}
          >
            {message}
          </div>
        )}

        {/* Event Form */}
        <form onSubmit={handleSubmit} className="space-y-5 mb-10">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="academic">Academic</option>
              <option value="sports">Sports</option>
              <option value="cultural">Cultural</option>
              <option value="community">Community</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg shadow transition disabled:opacity-50"
            >
              {loading ? "Saving..." : editId ? "Update Event" : "Add Event"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg shadow"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Events Preview List */}
        <h3 className="text-xl font-semibold mb-4">📋 Existing Events</h3>
        {events.length === 0 ? (
          <p className="text-gray-400">No events found.</p>
        ) : (
          <ul className="space-y-4">
            {events.map((event) => (
              <li
                key={event.id}
                className="p-4 bg-gray-700 rounded-lg border border-gray-600 shadow-sm flex justify-between items-center"
              >
                <div>
                  <h4 className="font-semibold text-gray-100">{event.title}</h4>
                  <p className="text-sm text-gray-300">{event.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(event.date).toLocaleDateString()} — {event.time}
                  </p>
                  <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-indigo-600 text-white">
                    {event.category}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded"
                  >
                    Delete
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
