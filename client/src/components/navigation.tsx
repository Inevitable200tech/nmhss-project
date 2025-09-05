import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import heroImage from "@assets/logo.png"; // replace with your actual video path 

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
    <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-white/20 dark:border-gray-700/20 shadow-lg">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src={heroImage}
              alt="Navamukunda HSS Logo"
              className="h-10 w-auto object-contain drop-shadow-md"
            />
          </div>
          <div className="mr-8">
            <h1 className="font-bold text-lg text-foreground">Navamukunda HSS</h1>
            <p className="text-xs text-muted-foreground">Thirunavaya</p>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="ml-2">
              <ThemeToggle />
            </div>
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, "/")}
              className="text-foreground hover:text-primary transition-colors"
            >
              Home
            </a>
            <a
              href="/about-us"
              onClick={(e) => handleLinkClick(e, "/about-us")}
              className="text-foreground hover:text-primary transition-colors"
            >
              About Devs
            </a>
             <a
              href="/#academics"
              onClick={(e) => handleLinkClick(e, "/#academics")}
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
              href="/#faculty"
              onClick={(e) => handleLinkClick(e, "/#faculty")}
              className="text-foreground hover:text-primary transition-colors"
            >
              Faculty
            </a>
            <a
              href="/#events"
              onClick={(e) => handleLinkClick(e, "/#events")}
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
              href="/#contact"
              onClick={(e) => handleLinkClick(e, "/#contact")}
              className="text-foreground hover:text-primary transition-colors"
            >
              Contact
            </a>
            <a
              href="/admin"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-md"
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
              className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 dark:border-gray-700/20 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 shadow-md rounded-b-xl">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="/"
                onClick={(e) => handleLinkClick(e, "/")}
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                Home
              </a>
              <a
                href="/about-us"
                onClick={(e) => handleLinkClick(e, "/about-us")}
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                About Devs
              </a>
              <a
                href="/#academics"
                onClick={(e) => handleLinkClick(e, "/#academics")}
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                Academics
              </a>
              <a
                href="/#achievements"
                onClick={(e) => handleLinkClick(e, "/#achievements")}
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                Achievements
              </a>
              <a
                href="/#faculty"
                onClick={(e) => handleLinkClick(e, "/#faculty")}
                className="block px-3 py-2 text-foreground hover:text-primary"
              >
                Faculty
              </a>
              <a
                href="/#events"
                onClick={(e) => handleLinkClick(e, "/#events")}
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
                href="/#contact"
                onClick={(e) => handleLinkClick(e, "/#contact")}
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