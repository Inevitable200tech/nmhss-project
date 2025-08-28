import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState("");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      const res = await apiRequest("POST", "/api/admin/login", form);
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setLoggedIn(true);
        localStorage.setItem("adminToken", data.token);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Login failed");
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="bg-card shadow-2xl rounded-2xl p-8 w-full max-w-md border border-border">
          <h2 className="text-3xl font-bold text-center mb-6 text-primary ">
            Admin Login
          </h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Username
              </label>
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-gray-100"  
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-"
                required 
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
            >
              Login
            </button>
            {error && (
              <div className="text-center text-destructive mt-2">{error}</div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // After login, show section edit UI (fetch sections, allow edit, send token in Authorization header)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="bg-card shadow-2xl rounded-2xl p-8 w-full max-w-2xl border border-border">
        <h2 className="text-3xl font-bold text-center mb-6 text-primary">
          Admin Panel
        </h2>
        {/* Section edit UI goes here */}
        <div className="text-center text-muted-foreground">
          Welcome,{" "}
          <span className="font-semibold text-foreground">admin</span>!
          <br />
          Use the panel to manage site content.
        </div>
      </div>
    </div>
  );
}