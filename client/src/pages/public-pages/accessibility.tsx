import Navigation from "@/components/static-pages/navigation";
import Footer from "@/components/static-pages/footer";
import { Helmet } from "react-helmet";

export default function AccessibilityPage() {
  return (
    <>
      <Helmet>
        <title>Accessibility - NMHSS Thirunavaya</title>
        <meta name="description" content="Accessibility information for NMHSS Thirunavaya website. Learn how we ensure our website is accessible to all users." />
        <meta name="keywords" content="accessibility, WCAG, ADA, website accessibility, NMHSS, Thirunavaya" />
        <link rel="canonical" href="https://nmhss.onrender.com/accessibility" />
      </Helmet>
      <Navigation />
      <div className="min-h-screen bg-white dark:bg-gray-950 pt-24 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">Accessibility Statement</h1>
          
          <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Commitment</h2>
              <p>
                Navamukunda Higher Secondary School Thirunavaya is committed to ensuring digital accessibility for all individuals, including those with disabilities. We believe accessibility is a fundamental right and strive to make our website usable and enjoyable for everyone.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">WCAG Compliance</h2>
              <p>
                We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. Our website is designed and developed with accessibility in mind, following best practices recommended by the World Wide Web Consortium (W3C).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Accessibility Features</h2>
              <p>Our website includes the following accessibility features:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Keyboard Navigation:</strong> All functionality is available via keyboard for users who cannot use a mouse</li>
                <li><strong>Screen Reader Support:</strong> Content is structured to work with screen readers and assistive technologies</li>
                <li><strong>Alt Text for Images:</strong> All images include descriptive alt text for visually impaired users</li>
                <li><strong>Color Contrast:</strong> Text and background colors meet WCAG color contrast requirements</li>
                <li><strong>Responsive Design:</strong> Website adapts to different screen sizes and zoom levels</li>
                <li><strong>Dark Mode:</strong> Users can switch to dark mode for reduced eye strain</li>
                <li><strong>Semantic HTML:</strong> Proper heading structure and semantic elements for better navigation</li>
                <li><strong>Video Captions:</strong> Educational videos include captions and transcripts where available</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Browser and Assistive Technology Support</h2>
              <p>
                Our website is tested with popular screen readers and browser combinations. We recommend using one of the following combinations for optimal accessibility:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>NVDA or JAWS with Firefox or Chrome</li>
                <li>VoiceOver with Safari on macOS or iOS</li>
                <li>Narrator with Edge or Chrome on Windows</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Known Issues</h2>
              <p>
                While we strive for full accessibility, some third-party content or older pages may have limited accessibility. We are continuously working to improve these areas. If you encounter any accessibility barriers, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Feedback and Assistance</h2>
              <p>
                We welcome your feedback on the accessibility of our website. If you experience any difficulty accessing content or have suggestions for improvement, please contact us:
              </p>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg mt-4">
                <p><strong>Email:</strong> accessibility@nmhss.edu.in</p>
                <p><strong>Phone:</strong> +91-XXXXXXXXXX</p>
                <p><strong>Mailing Address:</strong> Navamukunda Higher Secondary School, Thirunavaya, Kerala, India</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Accessibility Resources</h2>
              <p>Here are some external resources that may help improve your web experience:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><a href="https://www.w3.org/WAI/" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Web Accessibility Initiative (WAI)</a></li>
                <li><a href="https://www.w3.org/WAI/WCAG21/quickref/" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">WCAG 2.1 Quick Reference</a></li>
                <li><a href="https://www.nvaccess.org/" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">NVDA Screen Reader</a></li>
                <li><a href="https://www.freedomscientific.com/" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">JAWS Screen Reader</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Accessibility Statement Updates</h2>
              <p>
                We are committed to maintaining and improving the accessibility of our website. This statement will be reviewed and updated regularly to reflect our ongoing efforts and any changes made to our website.
              </p>
            </section>

            <section className="text-sm text-gray-600 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-800">
              <p>Last Updated: January 2026</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
