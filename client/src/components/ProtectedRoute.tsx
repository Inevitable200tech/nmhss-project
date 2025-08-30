// src/components/ProtectedRoute.tsx

import { useLocation } from "wouter";
import { useEffect } from "react";

// This component checks if the user is logged in before rendering the protected route
export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [location, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    // If the user is not logged in, redirect them to the login page
    if (!token) {
      setLocation("/admin"); // Redirect to login page if not logged in
    }
  }, [token, setLocation]);

  // If the user is logged in, render the protected route
  return token ? children : null;
};
