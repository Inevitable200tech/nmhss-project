import { Facebook, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  const quickLinks = [
    { href: "#about", label: "About Us", testId: "footer-link-about" },
    { href: "#academics", label: "Academics", testId: "footer-link-academics" },
    { href: "#achievements", label: "Achievements", testId: "footer-link-achievements" },
    { href: "#faculty", label: "Faculty", testId: "footer-link-faculty" },
    { href: "#events", label: "Events", testId: "footer-link-events" },
    { href: "#contact", label: "Contact", testId: "footer-link-contact" },
  ];

  const resources = [
    { href: "#admission", label: "Admission Form", testId: "footer-link-admission" },
    { href: "#fees", label: "Fee Structure", testId: "footer-link-fees" },
    { href: "#handbook", label: "Student Handbook", testId: "footer-link-handbook" },
    { href: "#calendar", label: "Academic Calendar", testId: "footer-link-calendar" },
    { href: "#results", label: "Exam Results", testId: "footer-link-results" },
    { href: "#gallery", label: "Photo Gallery", testId: "footer-link-gallery" },
  ];

  const socialLinks = [
    { href: "https://twitter.com", label: "Twitter", icon: Twitter, testId: "social-twitter" },
    { href: "https://facebook.com", label: "Facebook", icon: Facebook, testId: "social-facebook" },
    { href: "https://linkedin.com", label: "LinkedIn", icon: Linkedin, testId: "social-linkedin" },
  ];

  return (
    <footer className="bg-foreground dark:bg-background text-primary-foreground dark:text-foreground py-16 border-t border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* School Info */}
          <div data-testid="footer-school-info">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src="/assets/logo.png"
                  alt="Navamukunda HSS Logo"
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-xl">Navamukunda HSS</h3>
                <p className="text-sm opacity-80">Thirunavaya</p>
              </div>
            </div>
            <p className="text-sm opacity-80 leading-relaxed mb-4">
              Excellence in education since 1946. Nurturing young minds and building character
              through quality Malayalam medium education in a co-educational environment.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map(({ href, label, icon: Icon, testId }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/80 transition-colors"
                  data-testid={testId}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div data-testid="footer-quick-links">
            <h4 className="font-semibold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map(({ href, label, testId }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                    data-testid={testId}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div data-testid="footer-resources">
            <h4 className="font-semibold text-lg mb-6">Resources</h4>
            <ul className="space-y-3">
              {resources.map(({ href, label, testId }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                    data-testid={testId}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div data-testid="footer-contact-info">
            <h4 className="font-semibold text-lg mb-6">Contact Info</h4>
            <div className="space-y-3">
              <p className="text-sm opacity-80">
                Navamukunda HSS Thirunavaya
                <br />
                TIRUR Block, Malappuram District
                <br />
                Kerala, India
              </p>
              <p className="text-sm opacity-80">Phone: +91 494 2XX XXXX</p>
              <p className="text-sm opacity-80">Email: info@navamukunda.edu.in</p>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div
          className="border-t border-border/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
          data-testid="footer-bottom"
        >
          <p className="text-sm opacity-80">
            &copy; {new Date().getFullYear()} Navamukunda HSS Thirunavaya. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="#privacy"
              className="text-sm opacity-80 hover:opacity-100 transition-opacity"
              data-testid="footer-link-privacy"
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              className="text-sm opacity-80 hover:opacity-100 transition-opacity"
              data-testid="footer-link-terms"
            >
              Terms of Service
            </a>
            <a
              href="#accessibility"
              className="text-sm opacity-80 hover:opacity-100 transition-opacity"
              data-testid="footer-link-accessibility"
            >
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
