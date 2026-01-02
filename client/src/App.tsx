import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LoadingFallback } from "@/components/LoadingFallback";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import AOS from "aos";

// Lazy load components that use browser APIs to prevent SSR hydration issues
const GallerySection = lazy(() => import("@/pages/public-pages/gallery"));
const AboutDevelopers = lazy(() => import("@/pages/public-pages/about-developers"));
const AdminPage = lazy(() => import("@/pages/public-pages/admin"));
const StudentsPage = lazy(() => import("@/pages/public-pages/students"));
const StudentsUploadPage = lazy(() => import("@/pages/public-pages/students-upload"));
const AboutTeachers = lazy(() => import("@/pages/public-pages/about-teachers"));
const SportsChampionsPage = lazy(() => import("@/pages/public-pages/sports-champions"));
const AcademicResultsPage = lazy(() => import("@/pages/public-pages/academic-results"));
const ArtsSciencePage = lazy(() => import("@/pages/public-pages/arts-science"));

// Admin pages (already protected)
const AboutAdminPage = lazy(() => import("@/pages/admin-pages/about-admin"));
const AdminEvents = lazy(() => import("@/pages/admin-pages/admin-events"));
const AdminNews = lazy(() => import("@/pages/admin-pages/admin-news"));
const AdminGalleryPage = lazy(() => import("@/pages/admin-pages/admin-gallery"));
const AdminIntroPage = lazy(() => import("@/pages/admin-pages/admin-intro"));
const AdminFaculty = lazy(() => import("@/pages/admin-pages/admin-faculty"));
const AdminStudentsPage = lazy(() => import("@/pages/admin-pages/admin-students"))
const AdminTeacherEdit = lazy(() => import("@/pages/admin-pages/admin-teachers-edit"));
const AdminAcademicResults = lazy(() => import("@/pages/admin-pages/admin-academic"));
const AdminArtsScience = lazy(() => import("@/pages/admin-pages/admin-arts-science"));
const AdminSportsChampions = lazy(() => import("@/pages/admin-pages/admin-sports-champions"));
const AdminTutorial = lazy(() => import("@/pages/admin-pages/admin-tutorial"));

// --- Auto add Headers ------------

if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [resource, config] = args;
    config = config || {};
    
    const headers = new Headers(config.headers || {});
    
    // This header acts as our "Simple CSRF Token"
    // Malicious sites cannot forge this custom header in a cross-site request
    headers.set("x-requested-with", "SchoolConnect-App");
    
    config.headers = headers;
    return originalFetch(resource, config);
  };
}

function App() {
  useEffect(() => {
  if (typeof window === 'undefined') return;

  import("aos/dist/aos.css");
  import("aos").then((AOS) => {
    AOS.init({ duration: 750, easing: 'ease-out', once: true, offset: 50 });
  });
}, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="navamukunda-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/gallery" element={<GallerySection />} />
              <Route path="/about-us" element={<AboutDevelopers />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students-upload" element={<StudentsUploadPage />} />
              <Route path="/about-teachers" element={<AboutTeachers />} />
              <Route path="/sports-champions" element={<SportsChampionsPage />} />
              <Route path="/academic-results" element={<AcademicResultsPage />} />
              <Route path="/arts-science" element={<ArtsSciencePage />} />
              {/* Protected admin routes */}
              <Route path="/admin-gallery" element={<ProtectedRoute><AdminGalleryPage /></ProtectedRoute>} />
              <Route path="/admin-about" element={<ProtectedRoute><AboutAdminPage /></ProtectedRoute>} />
              <Route path="/admin-events" element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />
              <Route path="/admin-news" element={<ProtectedRoute><AdminNews /></ProtectedRoute>} />
              <Route path="/admin-intro" element={<ProtectedRoute><AdminIntroPage /></ProtectedRoute>} />
              <Route path="/admin-faculty" element={<ProtectedRoute><AdminFaculty /></ProtectedRoute>} />
              <Route path="/admin-students-setting" element={<ProtectedRoute><AdminStudentsPage /></ProtectedRoute>} />
              <Route path="/admin-sports-champions" element={<ProtectedRoute><AdminSportsChampions /></ProtectedRoute>} />
              <Route path="/admin-teachers-edit" element={<ProtectedRoute><AdminTeacherEdit /></ProtectedRoute>} />
              <Route path="/admin-academic-results" element={<ProtectedRoute><AdminAcademicResults /></ProtectedRoute>} />
              <Route path="/admin-arts-science" element={<ProtectedRoute><AdminArtsScience /></ProtectedRoute>} />
              <Route path="/admin-tutorial" element={<ProtectedRoute><AdminTutorial /></ProtectedRoute>} />

              {/* Fallback route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
