import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // REMOVED: const [hasMediaDb, setHasMediaDb] = useState(false);

  useEffect(() => {
    if (token) {
      fetch("/api/admin/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            setLoggedIn(true);
            // REMOVED: The logic to fetch /api/admin/media-dbs and set hasMediaDb
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
      } else {
        setError(data.message);
      }
    } catch {
      setError("Login failed");
    }
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("adminToken");
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Admin Login
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              name="username"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="Username"
              className="w-full p-2 border rounded"
              required
              style={{ color: "#fff", backgroundColor: "#0000" }}
            />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Password"
              className="w-full p-2 border rounded"
              required
              style={{ color: "#fff", backgroundColor: "#0000" }}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => (window.location.href = "/")}
          >
            ← Back to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile top bar */}
      <div className="sm:hidden fixed top-0 left-0 right-0 flex items-center justify-between bg-card p-4 shadow-md z-50">
        <h2 className="text-lg font-bold">Admin Panel</h2>
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed sm:static top-20 left-0 h-full sm:h-screen w-64 bg-card shadow-lg p-4 transform transition-transform duration-300 z-40
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}`}
      >
        <h2 className="text-xl font-bold mb-4 hidden sm:block">Admin Panel</h2>
        <ul className="space-y-2">
          {/* Sidebar items now fully enabled */}
          <li>
            <a href="/admin-about">
              <Button variant="outline" className="w-full text-left">
                Manage About Section
              </Button>
            </a>
          </li>
          <li>
            <a href="/admin-events">
              <Button variant="outline" className="w-full text-left">
                Manage Events
              </Button>
            </a>
          </li>
          <li>
            <a href="/admin-news">
              <Button variant="outline" className="w-full text-left">
                Manage News
              </Button>
            </a>
          </li>
          <li>
            <a href="/admin-gallery">
              <Button variant="outline" className="w-full text-left">
                Manage Gallery
              </Button>
            </a>
          </li>
          <li>
            <a href="/admin-intro">
              <Button variant="outline" className="w-full text-left">
                Manage Introsection Video
              </Button>
            </a>
          </li>
          <li>
            <a href="/admin-faculty">
              <Button variant="outline" className="w-full text-left">
                Edit Faculty Section
              </Button>
            </a>
          </li>
          <li>
            <a href="/admin-students-setting">
              <Button variant="outline" className="w-full text-left">
                Manage Students Media
              </Button>
            </a>
          </li>
          <li>
            <a href="/admin-teachers-edit">
              <Button variant="outline" className="w-full text-left">
                Manage Teacher's Section
              </Button>
            </a>
          </li>
        </ul>
        <Button variant="outline" className="w-full mt-4" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 sm:ml-64 mt-16 sm:mt-0 overflow-y-auto">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-4">Welcome to Admin Dashboard</h1>
          <p className="text-gray-500">
            Use the sidebar to manage content.
          </p>
        </div>
      </div>
    </div>
  );
}