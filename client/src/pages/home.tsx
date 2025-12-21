import Navigation from "@/components/static-pages/navigation";
import AcademicsSection from "@/components/static-pages/academics-section";
import Footer from "@/components/static-pages/footer";
import { Helmet } from "react-helmet";
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
    <>
    <Helmet>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="google-site-verification" content="YUtvOOVkyVlIM_jSQBbM2HQV5pPoFKDb946nKtMDoJo" />
  <title>NMHSS Thirunavaya | Navamukunda Higher Secondary School Kerala</title>
  <meta name="description"
    content="NMHSS Thirunavaya (Navamukunda Higher Secondary School) is a leading institution in Kerala offering quality education, higher secondary programs, and excellent campus facilities." />
  <meta name="keywords"
    content="NMHSS, Navamukunda HSS, Thirunavaya School, Kerala Schools, Higher Secondary School Kerala, Best Schools in Malappuram" />

  <link rel="canonical" href="https://nmhss.onrender.com/" />

  <meta property="og:title" content="NMHSS Thirunavaya - Excellence in Education" />
  <meta property="og:description"
    content="Explore admission details, departments, events, faculty, and campus life at NMHSS Thirunavaya Kerala." />
  <meta property="og:image"
    content="https://nmhss.onrender.com/assets/icon-DpoUQw9L.png" />
  <meta property="og:url" content="https://nmhss.onrender.com" />
  <meta property="og:type" content="website" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="NMHSS Thirunavaya" />
  <meta name="twitter:description" content="A premier Higher Secondary School in Kerala shaping future leaders." />
  <meta name="twitter:image" content="https://nmhss.onrender.com/assets/icon-DpoUQw9L.png" />



    </Helmet>
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
    </>
  );
}
