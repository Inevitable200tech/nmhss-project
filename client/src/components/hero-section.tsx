import { ArrowDown } from "lucide-react";
import heroImage from "@assets/499053104_24787122164303992_2693804571686322495_n_1756376018184.jpg";

export default function HeroSection() {
  const handleScrollDown = () => {
    const aboutSection = document.querySelector("#about");
    if (aboutSection) {
      const offsetTop = aboutSection.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center">
      <div 
        className="absolute inset-0 hero-parallax bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${heroImage})`
        }}
      />
      
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 fade-in" data-testid="hero-title">
          Navamukunda HSS
        </h1>
        <p className="text-xl md:text-2xl mb-4 slide-in-left" data-testid="hero-subtitle">
          Thirunavaya
        </p>
        <p className="text-lg md:text-xl mb-8 slide-in-right max-w-2xl mx-auto" data-testid="hero-description">
          Excellence in Education Since 1946 • Grades 5-12 • Malayalam Medium • Co-Educational
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center scale-in">
          <a 
            href="#about" 
            onClick={(e) => {
              e.preventDefault();
              const target = document.querySelector("#about");
              if (target) {
                const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
              }
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105"
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
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
              }
            }}
            className="border-2 border-white text-white hover:bg-white hover:text-foreground px-8 py-3 rounded-lg font-semibold transition-all"
            data-testid="hero-cta-secondary"
          >
            Get in Touch
          </a>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <button 
        onClick={handleScrollDown}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white hover:text-primary transition-colors"
        data-testid="scroll-indicator"
      >
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <ArrowDown className="w-4 h-4 mt-2 animate-bounce" />
        </div>
      </button>
    </section>
  );
}
