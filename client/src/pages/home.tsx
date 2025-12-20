import Navigation from "@/components/static-pages/navigation";
import AcademicsSection from "@/components/static-pages/academics-section";
import Footer from "@/components/static-pages/footer";
import { lazy, Suspense } from "react";

// Lazy load dynamic components that make API calls
const HeroSection = lazy(() => import("@/components/dynamic-pages/hero-section"));
const AboutSection = lazy(() => import("@/components/dynamic-pages/about-section"));
const AchievementsSection = lazy(() => import("@/components/dynamic-pages/achievements-section"));
const FacultySection = lazy(() => import("@/components/dynamic-pages/faculty-section"));
const EventsSection = lazy(() => import("@/components/dynamic-pages/events-section"));
const ContactSection = lazy(() => import("@/components/dynamic-pages/contact-section"));

export default function Home() {
  return (
    <div className="min-h-screen page-transition">
      <Navigation />

      

      {/* Dynamic content loaded on client */}
      <Suspense fallback={<div className="py-16 text-center">Loading...</div>}>
        <HeroSection />
      </Suspense>

      <Suspense fallback={<div className="py-16 text-center">Loading...</div>}>
        <AboutSection />
      </Suspense>

      <AcademicsSection />

      <Suspense fallback={<div className="py-16 text-center">Loading...</div>}>
        <FacultySection />
      </Suspense>

      <Suspense fallback={<div className="py-16 text-center">Loading...</div>}>
        <AchievementsSection />
      </Suspense>

      <Suspense fallback={<div className="py-16 text-center">Loading...</div>}>
        <EventsSection />
      </Suspense>

      <Suspense fallback={<div className="py-16 text-center">Loading...</div>}>
        <ContactSection />
      </Suspense>

      <Footer />
    </div>
  );
}
