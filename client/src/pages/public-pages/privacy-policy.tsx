import Navigation from "@/components/static-pages/navigation";
import Footer from "@/components/static-pages/footer";
import { Helmet } from "react-helmet";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - NMHSS Thirunavaya</title>
        <meta name="description" content="Privacy policy for NMHSS Thirunavaya. Learn how we protect your personal information and data privacy." />
        <meta name="keywords" content="privacy policy, data protection, NMHSS, Thirunavaya" />
        <link rel="canonical" href="https://nmhss.onrender.com/privacy-policy" />
      </Helmet>
      <Navigation />
      <div className="min-h-screen bg-white dark:bg-gray-950 pt-24 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
          
          <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Introduction</h2>
              <p>
                Navamukunda Higher Secondary School Thirunavaya ("we," "us," "our," or the "School") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Information We Collect</h2>
              <p>We may collect information about you in a variety of ways. The information we may collect on the site includes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Personal Data:</strong> Name, email address, phone number, and other contact information you voluntarily provide</li>
                <li><strong>Device Information:</strong> Browser type, IP address, and pages visited</li>
                <li><strong>Student Information:</strong> For admission and enrollment purposes (with parental consent)</li>
                <li><strong>Media Uploads:</strong> Photos and videos uploaded by students or staff to the gallery</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Use of Your Information</h2>
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To provide and maintain school services and website functionality</li>
                <li>To process student admissions and enrollment</li>
                <li>To communicate with parents, guardians, and students about school matters</li>
                <li>To improve our website and user experience</li>
                <li>To comply with legal obligations and school policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Security of Your Information</h2>
              <p>
                We implement security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Parental Consent</h2>
              <p>
                For students under 18 years of age, we obtain parental or guardian consent before collecting personal information. Parents and guardians have the right to review, update, or delete their child's personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Third-Party Links</h2>
              <p>
                Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Changes to This Policy</h2>
              <p>
                We reserve the right to modify this Privacy Policy at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website following the posting of revised Privacy Policy means that you accept and agree to the changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:<br />
                <strong>Navamukunda Higher Secondary School Thirunavaya</strong><br />
                Email: navamukundahss@gmail.com<br />
                Phone: +91 0494 260 1534
              </p>
            </section>

            <section className="text-sm text-gray-600 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-800">
              <p>Last Updated: January 2026

              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
