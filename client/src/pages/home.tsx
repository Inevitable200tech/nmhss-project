import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import AboutSection from "@/components/about-section";
import AcademicsSection from "@/components/academics-section";
import AchievementsSection from "@/components/achievements-section";
import FacultySection from "@/components/faculty-section";
import EventsSection from "@/components/events-section";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";

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
