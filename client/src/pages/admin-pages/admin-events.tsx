import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import type { ClientEvent } from "@shared/schema";

export default function AdminEvents() {
  const { toast } = useToast();
  const { playHoverSound, playErrorSound, playSuccessSound } = useSound();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("academic");

  // UI state
  const [loading, setLoading] = useState(false);

  // Events list state
  const [events, setEvents] = useState<ClientEvent[]>([]);

  // Edit mode
  const [editId, setEditId] = useState<string | null>(null);

  // Fetch all events
  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();

      setEvents(
        data.map((event: any) => ({
          ...event,
          date: new Date(event.date),
          createdAt: new Date(event.createdAt),
        }))
      );
    } catch (err) {
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Submit handler (add or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation: Check all required fields
    const titleTrimmed = title.trim();
    const descTrimmed = description.trim();
    const timeTrimmed = time.trim();

    if (!titleTrimmed) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Title is required and cannot be empty", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!descTrimmed) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Description is required and cannot be empty", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!date) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Date is required", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!timeTrimmed) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Time is required", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Edge case: Check if date is in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today && !editId) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Event date cannot be in the past", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Edge case: Check title length
    if (titleTrimmed.length > 200) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Title must be 200 characters or less", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Edge case: Check description length
    if (descTrimmed.length > 5000) {
      playErrorSound();
      toast({ title: "Validation Error", description: "Description must be 5000 characters or less", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: titleTrimmed,
        description: descTrimmed,
        date: new Date(date),
        time: timeTrimmed,
        category,
      };

      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast({ title: "Error", description: "Authentication token not found. Please log in again.", variant: "destructive" });
        setLoading(false);
        return;
      }

      let res;
      if (editId) {
        res = await fetch(`/api/events/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save event");
      }

      toast({
        title: "Success",
        description: editId ? "Event updated successfully!" : "Event added successfully!",
        variant: "default",
      });
      playSuccessSound();
      resetForm();
      fetchEvents();
    } catch (err: any) {
      playErrorSound();
      toast({
        title: "Save Failed",
        description: err.message || "An error occurred while saving the event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast({ title: "Error", description: "Authentication token not found", variant: "destructive" });
        return;
      }

      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete event");

      playSuccessSound();
      toast({ title: "Success", description: "Event deleted successfully!", variant: "default" });
      fetchEvents();
    } catch (err: any) {
      playErrorSound();
      toast({
        title: "Delete Failed",
        description: err.message || "An error occurred while deleting the event",
        variant: "destructive",
      });
    }
  };

  // Load event into form for editing
  const handleEdit = (event: ClientEvent) => {
    setEditId(event.id);
    setTitle(event.title);
    setDescription(event.description);
    setDate(new Date(event.date).toISOString().split("T")[0]);
    setTime(event.time);
    setCategory(event.category);
  };

  // Reset form
  const resetForm = () => {
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
        onMouseEnter={playHoverSound}
        className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg shadow"
      >
        ← Back to Admin Dashboard
      </button>

      <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">📅 Manage Events</h2>

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
              onMouseEnter={playHoverSound}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg shadow transition disabled:opacity-50"
            >
              {loading ? "Saving..." : editId ? "Update Event" : "Add Event"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                onMouseEnter={playHoverSound}
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
                    onMouseEnter={playHoverSound}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    onMouseEnter={playHoverSound}
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
