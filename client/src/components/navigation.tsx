import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">N</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Navamukunda HSS</h1>
              <p className="text-xs text-muted-foreground">Thirunavaya</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <ThemeToggle />
            <a 
              href="#home" 
              onClick={(e) => handleLinkClick(e, "#home")}
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-home"
            >
              Home
            </a>
            <a 
              href="#about" 
              onClick={(e) => handleLinkClick(e, "#about")}
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-about"
            >
              About
            </a>
            <a 
              href="#academics" 
              onClick={(e) => handleLinkClick(e, "#academics")}
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-academics"
            >
              Academics
            </a>
            <a 
              href="#achievements" 
              onClick={(e) => handleLinkClick(e, "#achievements")}
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-achievements"
            >
              Achievements
            </a>
            <a 
              href="#faculty" 
              onClick={(e) => handleLinkClick(e, "#faculty")}
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-faculty"
            >
              Faculty
            </a>
            <a 
              href="#events" 
              onClick={(e) => handleLinkClick(e, "#events")}
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-events"
            >
              Events
            </a>
            <a 
              href="#contact" 
              onClick={(e) => handleLinkClick(e, "#contact")}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              data-testid="nav-contact"
            >
              Contact
            </a>
          </div>
          
          {/* Mobile Theme Toggle & Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            data-testid="mobile-menu-toggle"
          >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a 
                href="#home" 
                onClick={(e) => handleLinkClick(e, "#home")}
                className="block px-3 py-2 text-foreground hover:text-primary"
                data-testid="mobile-nav-home"
              >
                Home
              </a>
              <a 
                href="#about" 
                onClick={(e) => handleLinkClick(e, "#about")}
                className="block px-3 py-2 text-foreground hover:text-primary"
                data-testid="mobile-nav-about"
              >
                About
              </a>
              <a 
                href="#academics" 
                onClick={(e) => handleLinkClick(e, "#academics")}
                className="block px-3 py-2 text-foreground hover:text-primary"
                data-testid="mobile-nav-academics"
              >
                Academics
              </a>
              <a 
                href="#achievements" 
                onClick={(e) => handleLinkClick(e, "#achievements")}
                className="block px-3 py-2 text-foreground hover:text-primary"
                data-testid="mobile-nav-achievements"
              >
                Achievements
              </a>
              <a 
                href="#faculty" 
                onClick={(e) => handleLinkClick(e, "#faculty")}
                className="block px-3 py-2 text-foreground hover:text-primary"
                data-testid="mobile-nav-faculty"
              >
                Faculty
              </a>
              <a 
                href="#events" 
                onClick={(e) => handleLinkClick(e, "#events")}
                className="block px-3 py-2 text-foreground hover:text-primary"
                data-testid="mobile-nav-events"
              >
                Events
              </a>
              <a 
                href="#contact" 
                onClick={(e) => handleLinkClick(e, "#contact")}
                className="block px-3 py-2 text-foreground hover:text-primary"
                data-testid="mobile-nav-contact"
              >
                Contact
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
