import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import heroVideoFallback from "@assets/hero-section.mp4"; // fallback video

// Cache variable (lives across component mounts)
let cachedHeroVideoUrl: string | null = null;

export default function HeroSection() {
  const [videoUrl, setVideoUrl] = useState<string | null>(cachedHeroVideoUrl);

  useEffect(() => {
    if (cachedHeroVideoUrl) return; // Already cached → no need to fetch

    const fetchHeroVideo = async () => {
      try {
        const res = await fetch("/api/hero-video");
        if (res.ok) {
          const data = await res.json();
          if (data.video && data.video.url) {
            cachedHeroVideoUrl = data.video.url;
            setVideoUrl(data.video.url);
          } else {
            cachedHeroVideoUrl = heroVideoFallback;
            setVideoUrl(heroVideoFallback);
          }
        } else {
          cachedHeroVideoUrl = heroVideoFallback;
          setVideoUrl(heroVideoFallback);
        }
      } catch {
        cachedHeroVideoUrl = heroVideoFallback;
        setVideoUrl(heroVideoFallback);
      }
    };

    fetchHeroVideo();
  }, []);

  // Preload video once we know the URL
  useEffect(() => {
    if (videoUrl) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "fetch";
      link.href = videoUrl;
      link.crossOrigin = "anonymous";
      link.fetchPriority ="high";
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [videoUrl]);

  const handleScrollDown = () => {
    const aboutSection = document.querySelector("#about");
    if (aboutSection) {
      const offsetTop = aboutSection.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center">
      {/* Background video */}
      {videoUrl && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/60" />

      {/* Foreground content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto text-white">
        <h1
          className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg"
          data-aos="fade-up"
          data-aos-delay="200"
          data-testid="hero-title"
        >
          Navamukunda HSS
        </h1>
        <p
          className="text-xl md:text-2xl mb-4"
          data-aos="fade-up"
          data-aos-delay="400"
          data-testid="hero-subtitle"
        >
          Thirunavaya
        </p>
        <p
          className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="600"
          data-testid="hero-description"
        >
          Excellence in Education Since 1946 • Grades 5-12 • Malayalam Medium • Co-Educational
        </p>
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          data-aos="fade-up"
          data-aos-delay="800"
        >
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              const target = document.querySelector("#about");
              if (target) {
                const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: offsetTop, behavior: "smooth" });
              }
            }}
            className="gradient-primary text-white px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105 pulse-primary"
            data-testid="hero-cta-primary"
          >
            Discover Our Legacy
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              const target = document.querySelector("#contact");
              if (target) {
                const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: offsetTop, behavior: "smooth" });
              }
            }}
            className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 rounded-lg font-semibold transition-all"
            data-testid="hero-cta-secondary"
          >
            Get in Touch
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={handleScrollDown}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white hover:text-primary transition-colors float"
        data-testid="scroll-indicator"
      >
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center glass-effect">
          <ArrowDown className="w-4 h-4 mt-2 animate-bounce" />
        </div>
      </button>
    </section>
  );
}
