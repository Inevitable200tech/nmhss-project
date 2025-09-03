// src/components/ProtectedRoute.tsx
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setIsVerified(false);
      setLocation("/admin"); // redirect if no token
      return;
    }

    fetch("/api/admin/verify", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          setToken("");
          localStorage.removeItem("adminToken");
          setIsVerified(false);
          setLocation("/admin");
        } else {
          setIsVerified(true);
        }
      })
      .catch(() => {
        setToken("");
        localStorage.removeItem("adminToken");
        setIsVerified(false);
        setLocation("/admin");
      });
  }, [token, setLocation]);

  // While verifying, show spinner
  if (isVerified === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Checking authentication...</span>
      </div>
    );
  }

  return isVerified ? children : null;
};
