import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ChevronUp, BookOpen, Medal, Palette, Book, NotebookPen, Newspaper, Calendar, Upload, Play, Mail, Loader2 } from "lucide-react";
import { useSound } from "@/hooks/use-sound";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_DEVELOPER_KEY_EMAIL;
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [academicDropdownOpen, setAcademicDropdownOpen] = useState(false);
  const { playHoverSound, playErrorSound, playSuccessSound } = useSound();
  const { toast } = useToast();

  // Developer verification states
  const [showDeveloperDialog, setShowDeveloperDialog] = useState(false);
  const [developerStep, setDeveloperStep] = useState<"email" | "code">("email");
  const [developerEmail, setDeveloperEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoadingDeveloper, setIsLoadingDeveloper] = useState(false);
  const [sentCodeEmail, setSentCodeEmail] = useState("");

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

  const handleSendDeveloperCode = async () => {
    if (!developerEmail.trim()) {
      playErrorSound();
      toast({
        title: "Enter your email",
        description: "Please provide your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingDeveloper(true);

    try {
      const response = await fetch("/api/admin/developer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: developerEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        playErrorSound();
        toast({
          title: "Failed to send code",
          description: data.message || "Please try again later",
          variant: "destructive",
        });
        return;
      }

      // Send email with the code
      const emailPayload = {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `Developer Verification Code for School Dashboard`,
        message: `Dear Developer,\n\nYour verification code is: ${data.code}\n\nThis code will expire in 10 minutes.\n\nPlease use this code in the dashboard to gain access.\n\nBest regards,\nSchool Connect Admin System`,
        email: developerEmail.trim(),
        "bot-field": "",
      };


      const emailResponse = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailPayload),
      });

      const emailResult = await emailResponse.json();


      if (emailResponse.ok && emailResult.success) {
        playSuccessSound();
        toast({
          title: "Code sent!",
          description: `Verification code sent to ${developerEmail}`,
        });
        setSentCodeEmail(developerEmail);
        setDeveloperStep("code");
      } else {
        playErrorSound();
        toast({
          title: "Failed to send email",
          description: emailResult.message || "Could not send verification code. Check console for details.",
          variant: "destructive",
        });
        console.error("Email service error:", emailResult);
      }
    } catch (error) {
      playErrorSound();
      toast({
        title: "Error",
        description: "An error occurred while processing your request",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoadingDeveloper(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      playErrorSound();
      toast({
        title: "Enter verification code",
        description: "Please paste the code you received",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingDeveloper(true);

    try {
      const response = await fetch("/api/admin/verify-developer-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: sentCodeEmail,
          code: verificationCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        playErrorSound();
        toast({
          title: "Invalid code",
          description: data.message || "Please check your code and try again",
          variant: "destructive",
        });
        return;
      }

      // Login successful
      localStorage.setItem("adminToken", data.token);
      setToken(data.token);
      setLoggedIn(true);
      setShowDeveloperDialog(false);
      setDeveloperStep("email");
      setDeveloperEmail("");
      setVerificationCode("");
      setSentCodeEmail("");
      playSuccessSound();
      toast({
        title: "Access granted!",
        description: "Welcome to the dashboard",
      });
    } catch (error) {
      playErrorSound();
      toast({
        title: "Error",
        description: "An error occurred while verifying your code",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoadingDeveloper(false);
    }
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

      {/* Developer Access Link */}
      <div className="text-center mt-6 pt-4 border-t border-gray-700">
        <button
          onClick={() => {
            setShowDeveloperDialog(true);
            playHoverSound();
          }}
          className="text-sm text-amber-500 hover:text-amber-400 transition-colors flex items-center justify-center gap-1 w-full"
        >
          <Mail className="w-4 h-4" />
          Are you a developer?
        </button>
      </div>

      {/* Developer Verification Dialog */}
      <Dialog open={showDeveloperDialog} onOpenChange={setShowDeveloperDialog}>
        <DialogContent className="sm:max-w-md">
          {developerStep === "email" ? (
            <>
              <DialogHeader>
                <DialogTitle>Developer Access</DialogTitle>
                <DialogDescription>
                  Enter your email to receive a verification code
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dev-email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="dev-email"
                    type="email"
                    placeholder="developer@example.com"
                    value={developerEmail}
                    onChange={(e) => setDeveloperEmail(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendDeveloperCode()}
                  />
                </div>
                <Button
                  onClick={handleSendDeveloperCode}
                  disabled={isLoadingDeveloper}
                  className="w-full"
                >
                  {isLoadingDeveloper && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send Verification Code
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Enter Verification Code</DialogTitle>
                <DialogDescription>
                  Check your email at <span className="font-semibold text-foreground">{sentCodeEmail}</span> for the code
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dev-code" className="text-sm font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="dev-code"
                    placeholder="Enter the code from your email"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleVerifyCode()}
                  />
                </div>
                <Button
                  onClick={handleVerifyCode}
                  disabled={isLoadingDeveloper}
                  className="w-full"
                >
                  {isLoadingDeveloper && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Verify & Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeveloperStep("email");
                    setVerificationCode("");
                  }}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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
              <a href="/admin-tutorial">
                <Button variant="outline" className="w-full text-left flex items-center gap-2 bg-purple-900/50 hover:bg-purple-900/70 border-purple-800 text-purple-300" onMouseEnter={playHoverSound}>
                  <Play className="w-4 h-4" /> Dashboard Tutorials
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