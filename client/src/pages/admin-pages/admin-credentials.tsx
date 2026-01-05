import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Shield, Zap, User, ArrowLeft } from "lucide-react";

export default function AdminCredentials() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    // Get current username from localStorage or token
    const token = localStorage.getItem("adminToken");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setCurrentUsername(decoded.username || "admin");
      } catch (e) {
        setCurrentUsername("admin");
      }
    }
  }, []);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newUsername) {
      newErrors.newUsername = "New username is required";
    } else if (formData.newUsername.length < 3) {
      newErrors.newUsername = "Username must be at least 3 characters";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/update-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newUsername: formData.newUsername,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to update credentials",
        });
        return;
      }

      setSuccess(true);
      setFormData({
        currentPassword: "",
        newUsername: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Success",
        description: "Credentials updated successfully. Please log in again with your new credentials.",
      });
          localStorage.removeItem("adminToken");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/admin";
      }, 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => window.location.href = "/admin"}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin</span>
        </button>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-50"></div>
              <div className="relative p-4 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400">
            Security Settings
          </h1>
          <p className="text-slate-400 text-lg">Secure your admin account with new credentials</p>
        </div>

        {success && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2">
            <Alert className="border-emerald-500/50 bg-emerald-500/10 backdrop-blur">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <AlertDescription className="text-emerald-300 font-medium">
                ✓ Credentials updated successfully! Redirecting to login...
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border border-blue-500/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur shadow-2xl">
              <CardHeader className="border-b border-blue-500/20 pb-6">
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  Update Credentials
                </CardTitle>
                <CardDescription className="text-slate-400 text-base">
                  Change your admin username and password to maintain security
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-8">
                {/* Current User Info */}
                {currentUsername && (
                  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-3">
                    <User className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-xs text-blue-300 font-semibold">Current Username</p>
                      <p className="text-lg font-bold text-blue-200">{currentUsername}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-semibold text-slate-300">
                      Current Password <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg opacity-0 group-focus-within:opacity-100 blur transition-opacity"></div>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.currentPassword}
                          onChange={(e) => {
                            setFormData({ ...formData, currentPassword: e.target.value });
                            if (errors.currentPassword) {
                              setErrors({ ...errors, currentPassword: "" });
                            }
                          }}
                          className={`bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:border-red-500 focus:ring-red-500 pr-10 ${
                            errors.currentPassword ? "border-red-500/70 bg-red-500/5" : "hover:border-slate-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-sm text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle size={14} /> {errors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>

                  {/* New Username */}
                  <div className="space-y-2">
                    <Label htmlFor="newUsername" className="text-sm font-semibold text-slate-300">
                      New Username <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-focus-within:opacity-100 blur transition-opacity"></div>
                      <Input
                        id="newUsername"
                        type="text"
                        placeholder="Enter your new username"
                        value={formData.newUsername}
                        onChange={(e) => {
                          setFormData({ ...formData, newUsername: e.target.value });
                          if (errors.newUsername) {
                            setErrors({ ...errors, newUsername: "" });
                          }
                        }}
                        className={`relative bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.newUsername ? "border-red-500/70 bg-red-500/5" : "hover:border-slate-500"
                        }`}
                      />
                    </div>
                    {errors.newUsername && (
                      <p className="text-sm text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle size={14} /> {errors.newUsername}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">Minimum 3 characters</p>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-semibold text-slate-300">
                      New Password <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg opacity-0 group-focus-within:opacity-100 blur transition-opacity"></div>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.newPassword}
                          onChange={(e) => {
                            setFormData({ ...formData, newPassword: e.target.value });
                            if (errors.newPassword || errors.confirmPassword) {
                              setErrors({
                                ...errors,
                                newPassword: "",
                                confirmPassword: "",
                              });
                            }
                          }}
                          className={`bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:border-green-500 focus:ring-green-500 pr-10 ${
                            errors.newPassword ? "border-red-500/70 bg-red-500/5" : "hover:border-slate-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    {errors.newPassword && (
                      <p className="text-sm text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle size={14} /> {errors.newPassword}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">Minimum 6 characters. Use uppercase, lowercase, numbers, and symbols</p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-300">
                      Confirm Password <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg opacity-0 group-focus-within:opacity-100 blur transition-opacity"></div>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => {
                            setFormData({ ...formData, confirmPassword: e.target.value });
                            if (errors.confirmPassword) {
                              setErrors({ ...errors, confirmPassword: "" });
                            }
                          }}
                          className={`bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-purple-500 pr-10 ${
                            errors.confirmPassword ? "border-red-500/70 bg-red-500/5" : "hover:border-slate-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle size={14} /> {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Warning Alert */}
                  <Alert className="border-amber-500/30 bg-amber-500/10 backdrop-blur">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <AlertDescription className="text-amber-300">
                      You'll be logged out and need to sign in again with your new credentials
                    </AlertDescription>
                  </Alert>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-base py-6 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? "Updating..." : "Update Credentials"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setFormData({
                          currentPassword: "",
                          newUsername: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                        setErrors({});
                      }}
                      variant="outline"
                      className="px-6 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Security Tips */}
          <div className="lg:col-span-1">
            <Card className="border border-emerald-500/20 bg-gradient-to-br from-emerald-900/30 to-slate-900/50 backdrop-blur sticky top-6">
              <CardHeader className="border-b border-emerald-500/20">
                <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Security Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-slate-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0">✓</span>
                    <span>Never share with anyone</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0">✓</span>
                    <span>Use unique passwords</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0">✓</span>
                    <span>Mix uppercase & numbers</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0">✓</span>
                    <span>Change every 90 days</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0">✓</span>
                    <span>Log out when done</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-300">
                    <span className="text-emerald-400 font-bold flex-shrink-0">✓</span>
                    <span>Use symbols & numbers</span>
                  </li>
                </ul>

                <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-300 font-medium">💡 Pro Tip</p>
                  <p className="text-xs text-blue-200 mt-1">Use a passphrase with mixed characters for stronger security</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
