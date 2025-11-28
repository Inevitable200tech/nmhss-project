import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import heroImage from "@assets/icon.png";
import { isNodeOrChild } from "framer-motion";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStudentsOpen, setIsStudentsOpen] = useState(false);
  const [isExcellenceOpen, setIsExcellenceOpen] = useState(false);
  const [isClubOpen, setIsClubOpen] = useState(false);


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
        setIsStudentsOpen(false);
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/40 dark:bg-gray-900/10 border-b border-white/20 dark:border-gray-700/20 shadow-lg overflow-visible">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src={heroImage}
              alt="Navamukunda HSS Logo"
              className="h-10 w-auto object-contain drop-shadow-md mr-4"
            />
            <div className="animate-fade-out mr-1">
              <h1 className="font-bold text-[16px] sm:text-[18px] md:text-[17px] text-foreground">
                Navamukunda HSS
              </h1>
              <p className="text-[10px] sm:text-[14px] md:text-[14px] text-foreground">
                Thirunavaya
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 relative">
            <ThemeToggle />

            <a href="/" className="text-foreground hover:text-primary transition-colors">Home</a>
            <a href="/about-us" className="text-foreground hover:text-primary transition-colors">About Devs</a>

            {/* Students Dropdown - Desktop */}
            <div
              className="relative"
              onMouseEnter={() => setIsStudentsOpen(true)}
              onMouseLeave={() => setIsStudentsOpen(false)}
            >
              <button className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium">
                Students <ChevronDown className={`h-4 w-4 transition-transform ${isStudentsOpen ? "rotate-180" : ""}`} />
              </button>

              {/* GLASS DROPDOWN — NOW VISIBLE OUTSIDE NAV */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 pointer-events-none">
                <div
                  className={`pointer-events-auto transition-all duration-300 ease-out ${isStudentsOpen
                    ? "opacity-100 translate-y-0 visible"
                    : "opacity-0 -translate-y-2 invisible"
                    }`}
                >
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden">
                    <a
                      href="/students"
                      onClick={(e) => { handleLinkClick(e, "/students"); setIsStudentsOpen(false); }}
                      className="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium"
                    >
                      Student's Gallery
                    </a>
                    <a
                      href="/students-upload"
                      onClick={(e) => { handleLinkClick(e, "/students-upload"); setIsStudentsOpen(false); }}
                      className="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium border-t border-white/20 dark:border-gray-700/30"
                    >
                      Student's Upload
                    </a>
                  </div>
                </div>
              </div>
            </div>
            {/* Excellence Dropdown - Desktop */}
            <div
              className="relative"
              onMouseEnter={() => setIsExcellenceOpen(true)}
              onMouseLeave={() => setIsExcellenceOpen(false)}
            >
              <button className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium">
                Excellence  <ChevronDown className={`h-4 w-4 transition-transform ${isExcellenceOpen ? "rotate-180" : ""}`} />
              </button>

              {/* GLASS DROPDOWN — NOW VISIBLE OUTSIDE NAV */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 pointer-events-none">
                <div
                  className={`pointer-events-auto transition-all duration-300 ease-out ${isExcellenceOpen
                    ? "opacity-100 translate-y-0 visible"
                    : "opacity-0 -translate-y-2 invisible"
                    }`}
                >
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden">
                    <a
                      href="/academic-results"
                      onClick={(e) => { handleLinkClick(e, "/students"); setIsExcellenceOpen(false); }}
                      className="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium"
                    >
                      Academic
                    </a>
                    <a
                      href="/arts-science"
                      onClick={(e) => { handleLinkClick(e, "/students-upload"); setIsExcellenceOpen(false); }}
                      className="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium border-t border-white/20 dark:border-gray-700/30"
                    >
                      Arts & Science Fair
                    </a>
                    <a
                      href="/sports-champions"
                      onClick={(e) => { handleLinkClick(e, "/students-upload"); setIsExcellenceOpen(false); }}
                      className="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium border-t border-white/20 dark:border-gray-700/30"
                    >
                      Sports
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Club Dropdown - Desktop */}
            <div
              className="relative"
              onMouseEnter={() => setIsClubOpen(true)}
              onMouseLeave={() => setIsClubOpen(false)}
            >
              <button className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium">
                Clubs  <ChevronDown className={`h-4 w-4 transition-transform ${isClubOpen ? "rotate-180" : ""}`} />
              </button>

              {/* GLASS DROPDOWN — NOW VISIBLE OUTSIDE NAV */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 pointer-events-none">
                <div
                  className={`pointer-events-auto transition-all duration-300 ease-out ${isClubOpen
                    ? "opacity-100 translate-y-0 visible"
                    : "opacity-0 -translate-y-2 invisible"
                    }`}
                >
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden">
                    <a
                      href="/nss-page"
                      onClick={(e) => { handleLinkClick(e, "/students"); setIsClubOpen(false); }}
                      className="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium"
                    >
                      N.S.S
                    </a>
                    <a
                      href="/souhrida-club"
                      onClick={(e) => { handleLinkClick(e, "/students-upload"); setIsClubOpen(false); }}
                      className="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium border-t border-white/20 dark:border-gray-700/30"
                    >
                      Souhrida Club
                    </a>

                  </div>
                </div>
              </div>
            </div>

            <a href="/about-teachers" className="text-foreground hover:text-primary transition-colors">Our Teachers</a>
            <a href="/gallery" className="text-foreground hover:text-primary transition-colors">Gallery</a>
            <a href="/admin" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg font-medium">
              Admin
            </a>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/50 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 dark:border-gray-700/20 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70">
            <div className="px-4 py-3 space-y-1">
              <a href="/" onClick={(e) => { handleLinkClick(e, "/"); setIsMobileMenuOpen(false); }} className="block py-3 text-foreground hover:text-primary">Home</a>
              <a href="/about-us" onClick={(e) => { handleLinkClick(e, "/about-us"); setIsMobileMenuOpen(false); }} className="block py-3 text-foreground hover:text-primary">About Devs</a>

              <button
                onClick={() => setIsStudentsOpen(!isStudentsOpen)}
                className="w-full flex items-center justify-between py-3 text-foreground hover:text-primary font-medium"
              >
                Students
                <ChevronDown className={`h-5 w-5 transition-transform ${isStudentsOpen ? "rotate-180" : ""}`} />
              </button>
              {isStudentsOpen && (
                <div className="pl-6 space-y-2 bg-white/40 dark:bg-gray-800/40 rounded-xl py-3">
                  <a href="/students" onClick={(e) => { handleLinkClick(e, "/students"); setIsMobileMenuOpen(false); }} className="block py-2.5 text-foreground hover:text-primary">Student's Gallery</a>
                  <a href="/students-upload" onClick={(e) => { handleLinkClick(e, "/students-upload"); setIsMobileMenuOpen(false); }} className="block py-2.5 text-foreground hover:text-primary">Student's Upload</a>
                </div>
              )}


              <button
                onClick={() => setIsExcellenceOpen(!isExcellenceOpen)}
                className="w-full flex items-center justify-between py-3 text-foreground hover:text-primary font-medium"
              >
                Excellence
                <ChevronDown className={`h-5 w-5 transition-transform ${isExcellenceOpen ? "rotate-180" : ""}`} />
              </button>
              {isExcellenceOpen && (
                <div className="pl-6 space-y-2 bg-white/40 dark:bg-gray-800/40 rounded-xl py-3">
                  <a href="/academic-results" onClick={(e) => { handleLinkClick(e, "/academic-results"); setIsMobileMenuOpen(false); }} className="block py-2.5 text-foreground hover:text-primary">Academic</a>
                  <a href="/arts-science" onClick={(e) => { handleLinkClick(e, "/students-upload"); setIsMobileMenuOpen(false); }} className="block py-2.5 text-foreground hover:text-primary">Arts & Science Fair</a>
                  <a href="/sports-champions" onClick={(e) => { handleLinkClick(e, "/sports-champions"); setIsMobileMenuOpen(false); }} className="block py-2.5 text-foreground hover:text-primary">Sports</a>

                </div>
              )}

              <button
                onClick={() => setIsClubOpen(!isClubOpen)}
                className="w-full flex items-center justify-between py-3 text-foreground hover:text-primary font-medium"
              >
                Clubs
                <ChevronDown className={`h-5 w-5 transition-transform ${isClubOpen ? "rotate-180" : ""}`} />
              </button>
              {isClubOpen && (
                <div className="pl-6 space-y-2 bg-white/40 dark:bg-gray-800/40 rounded-xl py-3">
                  <a href="/academic-results" onClick={(e) => { handleLinkClick(e, "/students"); setIsMobileMenuOpen(false); }} className="block py-2.5 text-foreground hover:text-primary">N.S.S</a>
                  <a href="/students-upload" onClick={(e) => { handleLinkClick(e, "/students-upload"); setIsMobileMenuOpen(false); }} className="block py-2.5 text-foreground hover:text-primary">Souhrida Club</a>

                </div>
              )}

              <a href="/about-teachers" onClick={(e) => { handleLinkClick(e, "/about-teachers"); setIsMobileMenuOpen(false); }} className="block py-3 text-foreground hover:text-primary">Our Teachers</a>
              <a href="/gallery" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-foreground hover:text-primary">Gallery</a>
              <a href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 font-semibold text-primary">Admin</a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}