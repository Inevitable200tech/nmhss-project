import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import AOS from "aos";
import "aos/dist/aos.css";
import AdminPage from "@/pages/admin";
import AboutAdminPage from "@/pages/about-admin";
import AdminEvents from "@/pages/admin-events";
import AdminNews from "@/pages/admin-news";
import GallerySection from "@/pages/gallery";
import AboutDevelopers from "@/pages/about-developers";
import AdminGalleryPage from "@/pages/admin-gallery";
import AdminIntroPage from "@/pages/admin-intro";
import AdminFaculty from "@/pages/admin-faculty";
import AdminMediaDBPage from "@/pages/admin-db";
// Use named import for ProtectedRoute
import { ProtectedRoute } from "@/components/ProtectedRoute"; // Corrected import

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/gallery" component={GallerySection} />
      <Route path="/about-us" component={AboutDevelopers} />
      <Route path="/admin" component={AdminPage} />
    
      {/* Protected admin routes */}
      <ProtectedRoute>
        <div>
          <Route path="/admin-gallery" component={AdminGalleryPage} />
          <Route path="/about-admin" component={AboutAdminPage} />
          <Route path="/admin-events" component={AdminEvents} />
          <Route path="/admin-news" component={AdminNews} />
          <Route path="/admin-intro" component={AdminIntroPage} />
          <Route path="/admin-faculty" component={AdminFaculty} />
          <Route path="/admin-media-db" component={AdminMediaDBPage} />
        </div>
      </ProtectedRoute>

      {/* Fallback route for 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out-sine',
      once: true,
      offset: 100,
    });
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="navamukunda-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
