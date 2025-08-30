import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

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
          <form onSubmit={handleLogin}>
            <input
              name="username"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="Username"
              className="mb-4 w-full p-2 border rounded"
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
              className="mb-4 w-full p-2 border rounded"
              required
              style={{ color: "#fff", backgroundColor: "#0000" }}
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          {/* Back to homepage button */}
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
      <div className="w-64 bg-card shadow-lg p-4">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <ul className="space-y-2">
          <li>
            <a href="/about-admin">
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
        </ul>
        <Button variant="outline" className="w-full mt-4" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      <div className="flex-1 p-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-4">Welcome to Admin Dashboard</h1>
          <p className="text-gray-500">Use the sidebar to manage content.</p>
        </div>
      </div>
    </div>
  );
}
