import { Facebook, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground dark:bg-background text-primary-foreground dark:text-foreground py-16 border-t border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* School Info */}
          <div data-testid="footer-school-info">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">N</span>
              </div>
              <div>
                <h3 className="font-bold text-xl">Navamukunda HSS</h3>
                <p className="text-sm opacity-80">Thirunavaya</p>
              </div>
            </div>
            <p className="text-sm opacity-80 leading-relaxed mb-4">
              Excellence in education since 1946. Nurturing young minds and building character through quality Malayalam medium education in a co-educational environment.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/80 transition-colors"
                data-testid="social-twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/80 transition-colors"
                data-testid="social-facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/80 transition-colors"
                data-testid="social-linkedin"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div data-testid="footer-quick-links">
            <h4 className="font-semibold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#about" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-about">About Us</a></li>
              <li><a href="#academics" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-academics">Academics</a></li>
              <li><a href="#achievements" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-achievements">Achievements</a></li>
              <li><a href="#faculty" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-faculty">Faculty</a></li>
              <li><a href="#events" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-events">Events</a></li>
              <li><a href="#contact" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-contact">Contact</a></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div data-testid="footer-resources">
            <h4 className="font-semibold text-lg mb-6">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#admission" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-admission">Admission Form</a></li>
              <li><a href="#fees" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-fees">Fee Structure</a></li>
              <li><a href="#handbook" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-handbook">Student Handbook</a></li>
              <li><a href="#calendar" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-calendar">Academic Calendar</a></li>
              <li><a href="#results" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-results">Exam Results</a></li>
              <li><a href="#gallery" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-gallery">Photo Gallery</a></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div data-testid="footer-contact-info">
            <h4 className="font-semibold text-lg mb-6">Contact Info</h4>
            <div className="space-y-3">
              <p className="text-sm opacity-80">
                Navamukunda HSS Thirunavaya<br />
                TIRUR Block, Malappuram District<br />
                Kerala, India
              </p>
              <p className="text-sm opacity-80">
                Phone: +91 494 2XX XXXX
              </p>
              <p className="text-sm opacity-80">
                Email: info@navamukunda.edu.in
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="border-t border-border/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center" data-testid="footer-bottom">
          <p className="text-sm opacity-80">
            &copy; 2024 Navamukunda HSS Thirunavaya. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#privacy" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-privacy">Privacy Policy</a>
            <a href="#terms" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-terms">Terms of Service</a>
            <a href="#accessibility" className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-accessibility">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
