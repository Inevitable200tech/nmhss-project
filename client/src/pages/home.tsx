import Navigation from "@/components/static-pages/navigation";
import HeroSection from "@/components/dynamic-pages/hero-section";
import AboutSection from "@/components/dynamic-pages/about-section";
import AcademicsSection from "@/components/static-pages/academics-section";
import AchievementsSection from "@/components/static-pages/achievements-section";
import FacultySection from "@/components/dynamic-pages/faculty-section";
import EventsSection from "@/components/dynamic-pages/events-section";
import ContactSection from "@/components/dynamic-pages/contact-section";
import Footer from "@/components/static-pages/footer";

export default function Home() {
  return (
    <div className="min-h-screen page-transition">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <AcademicsSection />
      <AchievementsSection />
      <FacultySection />
      <EventsSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
