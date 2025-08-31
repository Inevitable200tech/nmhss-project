import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const offsetTop =
          target.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
        setIsMobileMenuOpen(false);
      }
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/attached_assets/logo.png"
              alt="Navamukunda HSS Logo"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="ml-2">
              <ThemeToggle />
            </div>
            <a
              href="#home"
              onClick={(e) => handleLinkClick(e, "#home")}
              className="text-foreground hover:text-primary transition-colors"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={(e) => handleLinkClick(e, "#about")}
              className="text-foreground hover:text-primary transition-colors"
            >
              About
            </a>
            <a
              href="#academics"
              onClick={(e) => handleLinkClick(e, "#academics")}
              className="text-foreground hover:text-primary transition-colors"
            >
              Academics
            </a>
            <a
              href="#achievements"
              onClick={(e) => handleLinkClick(e, "#achievements")}
              className="text-foreground hover:text-primary transition-colors"
            >
              Achievements
            </a>
            <a
              href="#faculty"
              onClick={(e) => handleLinkClick(e, "#faculty")}
              className="text-foreground hover:text-primary transition-colors"
            >
              Faculty
            </a>
            <a
              href="#events"
              onClick={(e) => handleLinkClick(e, "#events")}
              className="text-foreground hover:text-primary transition-colors"
            >
              Events
            </a>
            <a
              href="/gallery"
              className="text-foreground hover:text-primary transition-colors"
            >
              Gallery
            </a>
            <a
              href="#contact"
              onClick={(e) => handleLinkClick(e, "#contact")}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Contact
            </a>
            <a
              href="/admin"
              className="text-foreground hover:text-primary transition-colors"
            >
              Admin
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="ml-2">
              <ThemeToggle />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
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
              >
                Home
              </a>
              <a
                href="#about"
                onClick={(e) => handleLinkClick(e, "#about")}
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                About
              </a>
              <a
                href="#academics"
                onClick={(e) => handleLinkClick(e, "#academics")}
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                Academics
              </a>
              <a
                href="#achievements"
                onClick={(e) => handleLinkClick(e, "#achievements")}
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                Achievements
              </a>
              <a
                href="#faculty"
                onClick={(e) => handleLinkClick(e, "#faculty")}
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                Faculty
              </a>
              <a
                href="#events"
                onClick={(e) => handleLinkClick(e, "#events")}
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                Events
              </a>
              <a
                href="/gallery"
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                Gallery
              </a>
              <a
                href="#contact"
                onClick={(e) => handleLinkClick(e, "#contact")}
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                Contact
              </a>
              <a
                href="/admin"
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                Admin
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}