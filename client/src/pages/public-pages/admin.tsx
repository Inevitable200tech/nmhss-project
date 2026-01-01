import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ChevronUp, BookOpen, Medal, Palette, Book, NotebookPen, Newspaper, Calendar, Upload } from "lucide-react";
import { useSound } from "@/hooks/use-sound";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // NEW STATE for the collapsible sub-section
  const [academicDropdownOpen, setAcademicDropdownOpen] = useState(false);
  const { playHoverSound, playErrorSound, playSuccessSound } = useSound();

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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Login failed");
      }

      const data = await res.json();
      localStorage.setItem("adminToken", data.token);
      setToken(data.token);
      setLoggedIn(true);
      playSuccessSound();
    } catch (err: any) {
      playErrorSound();
      setError(err.message || "An unknown error occurred");
    }
  };// Inside your component:
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Set up an interval to update the state every 1 second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Clean up the interval when the component unmounts to prevent memory leaks
    return () => clearInterval(timer);
  }, []);

  // In your JSX:

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setToken("");
    setLoggedIn(false);
    setSidebarOpen(false);
    // Force a reload to clear all state and ensure full logout
    window.location.reload();
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
            <Button type="submit" className="w-full" onMouseEnter={playHoverSound}>
              Login
            </Button>
          </form>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => (window.location.href = "/")}
            onMouseEnter={playHoverSound}
          >
            ← Back to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">

      {/* Mobile Menu Button */}
      <button
        data-drawer-target="default-sidebar"
        data-drawer-toggle="default-sidebar"
        aria-controls="default-sidebar"
        type="button"
        className="inline-flex items-center p-2 mt-2 ml-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 fixed z-50 bg-gray-900"
        onClick={() => {
          setSidebarOpen(!sidebarOpen);
          playHoverSound();
        }}
      >
        <span className="sr-only">Open sidebar</span>
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar (Desktop & Mobile) */}
      <aside
        id="default-sidebar"
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
          }`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800 border-r border-gray-700">
          <h1 className="text-2xl font-black  mb-6 text-cyan-500">Admin Panel</h1>
          <ul className="space-y-2 font-medium">
            <li>
              <a href="/admin-about">
                <Button variant="outline" className="w-full text-left" onMouseEnter={playHoverSound}>
                  Manage About Section
                </Button>
              </a>
            </li>

            <li>
              <a href="/admin-intro">
                <Button variant="outline" className="w-full text-left" onMouseEnter={playHoverSound}>
                  Manage Introsection Video
                </Button>
              </a>
            </li>
            <li>
              <a href="/admin-faculty">
                <Button variant="outline" className="w-full text-left" onMouseEnter={playHoverSound}>
                  Edit Faculty Section
                </Button>
              </a>
            </li>

            {/* START OF NEW DROPDOWN SECTION: Manage Events & Staff */}
            <li>
              <Button
                variant="outline"
                className="w-full text-left justify-start font-bold pr-2 bg-blue-900/50 hover:bg-blue-900/70 border-blue-800 text-blue-300"
                onClick={() => {
                  setAcademicDropdownOpen(!academicDropdownOpen);
                  playHoverSound();
                }}
                onMouseEnter={playHoverSound}
              >
                <div className="flex justify-between items-center w-full">
                  <span>Manage Events & Staff  </span>
                  {academicDropdownOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </div>
              </Button>

              {/* DROPDOWN CONTENT - Uses max-h/opacity for smooth collapse */}
              <div
                className={`overflow-hidden transition-all ease-in-out ${academicDropdownOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
                  }`}
              >
                <ul className="ml-4 space-y-1 border-l-2 border-cyan-500 pl-4">
                  <li>
                    <a href="/admin-events">
                      <Button variant="ghost" className="w-full text-left justify-start text-sm hover:bg-gray-700 dark:hover:bg-gray-700/80 text-gray-300" onMouseEnter={playHoverSound}>
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" /> Manage Events
                      </Button>
                    </a>
                  </li>
                  <li>
                    <a href="/admin-news">
                      <Button variant="ghost" className="w-full text-left justify-start text-sm hover:bg-gray-700 dark:hover:bg-gray-700/80 text-gray-300" onMouseEnter={playHoverSound}>
                        <Newspaper className="w-4 h-4 mr-2 text-pink-500" /> Manage News
                      </Button>
                    </a>
                  </li>
                  <li>
                    <a href="/admin-teachers-edit">
                      <Button variant="ghost" className="w-full text-left justify-start text-sm hover:bg-gray-700 dark:hover:bg-gray-700/80 text-gray-300" onMouseEnter={playHoverSound}>
                        <NotebookPen className="w-4 h-4 mr-2 text-yellow-500" />  Teacher's Section
                      </Button>
                    </a>
                  </li>
                  <li>
                    <a href="/admin-students-setting">
                      <Button variant="ghost" className="w-full text-left justify-start text-sm hover:bg-gray-700 dark:hover:bg-gray-700/80 text-gray-300" onMouseEnter={playHoverSound}>
                        <Book className="w-4 h-4 mr-2 text-yellow-500" />  Students's Section
                      </Button>
                    </a>
                  </li>
                </ul>
              </div>
            </li>
            {/* END OF NEW DROPDOWN SECTION */}

          </ul>
          <Button variant="outline" className="w-full mt-4 bg-red-800 hover:bg-red-700 border-red-700 text-white" onClick={handleLogout} onMouseEnter={playHoverSound}>
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      {/* Added transition to match sidebar */}
      <div className="flex-1 p-4 sm:ml-64 mt-16 sm:mt-0 overflow-y-auto transition-all duration-300">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold mb-4 text-white">Welcome, Admin</h1>
          <p className="text-gray-400 text-lg">
            Use the sidebar to navigate and manage different sections of the school website content.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-cyan-400 mb-3">Quick Actions</h2>
              <ul className="space-y-3">
                <li><a href="/admin-academic-results" className="text-gray-300 hover:text-cyan-500 transition flex items-center gap-2" onMouseEnter={playHoverSound}><BookOpen className="w-5 h-5" /> Update Academic Results</a></li>
                <li><a href="/admin-arts-science" className="text-gray-300 hover:text-cyan-500 transition flex items-center gap-2" onMouseEnter={playHoverSound}><Palette className="w-5 h-5" /> Manage Arts Fair</a></li>
                <li><a href="/admin-sports-champions" className="text-gray-300 hover:text-cyan-500 transition flex items-center gap-2" onMouseEnter={playHoverSound}><Medal className="w-5 h-5" /> Manage Sports Champions</a></li>
                <li><a href="/admin-gallery" className="text-gray-300 hover:text-cyan-500 transition flex items-center gap-2" onMouseEnter={playHoverSound}><Upload className="w-5 h-5" /> Upload  Media</a></li>
              </ul>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-yellow-400 mb-3">System Info</h2>
              <p className="text-gray-400">Status: <span className="text-green-500 font-semibold">Online</span></p>
              <p className="text-gray-400">Good To See You Sir!! </p>
              <p className="text-gray-400">Server Time: {currentTime.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}