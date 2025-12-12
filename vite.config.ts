import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import Sitemap from "vite-plugin-sitemap";
import type { PluginOption } from "vite";

// Lightweight, secure, zero-dependency prerender plugin (no Puppeteer, no vulnerabilities)
const prerenderPlugin = (): PluginOption => {
  return {
    name: "custom-prerender",
    apply: "build",
    transformIndexHtml: {
      enforce: "post",
      transform(html: string, ctx): string {
        // Only run on actual page files (index.html in any folder)
        if (!ctx.filename || !ctx.filename.includes("index.html")) return html;

        return html
          .replace(
            "<title></title>",
            "<title>Navamukunda Higher Secondary School – Official Website</title>"
          )
          .replace(
            "</head>",
            `
            
            <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="google-site-verification" content="YUtvOOVkyVlIM_jSQBbM2HQV5pPoFKDb946nKtMDoJo" />
  <!-- 🏷 Primary SEO -->
  <title>NMHSS Thirunavaya | Navamukunda Higher Secondary School Kerala</title>
  <meta name="description"
    content="NMHSS Thirunavaya (Navamukunda Higher Secondary School) is a leading institution in Kerala offering quality education, higher secondary programs, and excellent campus facilities." />
  <meta name="keywords"
    content="NMHSS, Navamukunda HSS, Thirunavaya School, Kerala Schools, Higher Secondary School Kerala, Best Schools in Malappuram" />

  <!-- Canonical for Search Engines -->
  <link rel="canonical" href="https://nmhss.onrender.com/" />

  <!-- Open Graph (Facebook / WhatsApp / LinkedIn Preview) -->
  <meta property="og:title" content="NMHSS Thirunavaya - Excellence in Education" />
  <meta property="og:description"
    content="Explore admission details, departments, events, faculty, and campus life at NMHSS Thirunavaya Kerala." />
  <meta property="og:image"
    content="https://nmhss.onrender.com/icon.jpg" />
  <meta property="og:url" content="https://nmhss.onrender.com" />
  <meta property="og:type" content="website" />

  <!-- Twitter Preview -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="NMHSS Thirunavaya" />
  <meta name="twitter:description" content="A premier Higher Secondary School in Kerala shaping future leaders." />
  <meta name="twitter:image" content="https://nmhss.onrender.com/icon.jpg" />

  <!-- Favicon -->

  <!-- Schema.org for Google Rich Results -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "NMHSS Thirunavaya",
    "alternateName": "Navamukunda Higher Secondary School",
    "url": "https://nmhss.onrender.com",
    "logo": "https://nmhss.onrender.com/logo.png",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Thirunavaya",
      "addressLocality": "Malappuram",
      "addressRegion": "Kerala",
      "postalCode": "676301",
      "addressCountry": "IN"
    },
    "sameAs": [
      "https://facebook.com/",
      "https://instagram.com/",
      "https://maps.google.com/"
    ]
  }
  </script>
  <link rel="icon" href="icon.png" type="image/png" />
  <link rel="icon" href="icon.png" sizes="any">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Fira+Code:wght@300..700&family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Outfit:wght@100..900&family=Oxanium:wght@200..800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Roboto:ital,wght@0,100..900;1,100..900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Space+Grotesk:wght@300..700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap"
    rel="stylesheet">
</head>`
          )
          .replace(
            '<div id="root"></div>',
            `
<div id="root"><div role="region" aria-label="Notifications (F8)" tabindex="-1" style="pointer-events: none;"><ol tabindex="-1" class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"></ol></div><div class="min-h-screen page-transition"><nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/40 dark:bg-gray-900/10 border-b border-white/20 dark:border-gray-700/20 shadow-lg overflow-visible"><div class="container mx-auto px-4 lg:px-8"><div class="flex items-center justify-between h-16"><div class="flex items-center"><img src="/@fs/workspaces/nmhss-project/attached_assets/icon.png" alt="Navamukunda HSS Logo" class="h-10 w-auto object-contain drop-shadow-md mr-4"><div class="animate-fade-out mr-1"><h1 class="font-bold text-[16px] sm:text-[18px] md:text-[17px] text-foreground">Navamukunda School</h1><p class="text-[10px] sm:text-[14px] md:text-[14px] text-foreground">Thirunavaya</p></div></div><div class="hidden md:flex items-center space-x-8 relative"><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 relative glass-effect border-0" data-testid="theme-toggle" type="button" id="radix-:r0:" aria-haspopup="menu" aria-expanded="false" data-state="closed"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg><span class="sr-only">Toggle theme</span></button><a href="/" class="text-foreground hover:text-primary transition-colors">Home</a><a href="/about-us" class="text-foreground hover:text-primary transition-colors">About Devs</a><div class="relative"><button class="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium">Students <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down h-4 w-4 transition-transform "><path d="m6 9 6 6 6-6"></path></svg></button><div class="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 pointer-events-none"><div class="pointer-events-auto transition-all duration-300 ease-out opacity-0 -translate-y-2 invisible"><div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden"><a href="/students" class="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium">Student's Gallery</a><a href="/students-upload" class="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium border-t border-white/20 dark:border-gray-700/30">Student's Upload</a></div></div></div></div><div class="relative"><button class="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium">Excellence  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down h-4 w-4 transition-transform "><path d="m6 9 6 6 6-6"></path></svg></button><div class="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 pointer-events-none"><div class="pointer-events-auto transition-all duration-300 ease-out opacity-0 -translate-y-2 invisible"><div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden"><a href="/academic-results" class="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium">Academic</a><a href="/arts-science" class="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium border-t border-white/20 dark:border-gray-700/30">Arts &amp; Science Fair</a><a href="/sports-champions" class="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium border-t border-white/20 dark:border-gray-700/30">Sports</a></div></div></div></div><div class="relative"><button class="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium">Clubs  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down h-4 w-4 transition-transform "><path d="m6 9 6 6 6-6"></path></svg></button><div class="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 pointer-events-none"><div class="pointer-events-auto transition-all duration-300 ease-out opacity-0 -translate-y-2 invisible"><div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden"><a href="https://www.google.com" class="block px-6 py-4 text-foreground hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all font-medium">N.S.S</a></div></div></div></div><a href="/about-teachers" class="text-foreground hover:text-primary transition-colors">Our Teachers</a><a href="/gallery" class="text-foreground hover:text-primary transition-colors">Gallery</a><a href="/admin" class="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg font-medium">Admin</a></div><div class="md:hidden flex items-center gap-3"><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 relative glass-effect border-0" data-testid="theme-toggle" type="button" id="radix-:r2:" aria-haspopup="menu" aria-expanded="false" data-state="closed"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg><span class="sr-only">Toggle theme</span></button><button class="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu w-6 h-6"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg></button></div></div></div></nav><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><footer class="bg-foreground dark:bg-background text-primary-foreground dark:text-foreground py-16 border-t border-border"><div class="container mx-auto px-4 lg:px-8"><div class="grid lg:grid-cols-4 md:grid-cols-2 gap-8"><div data-testid="footer-school-info"><div class="flex items-center space-x-3 mb-6"><div class="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center"><img src="/@fs/workspaces/nmhss-project/attached_assets/icon.png" alt="Navamukunda HSS Logo" class="w-12 h-12 object-contain"></div><div><h3 class="font-bold text-xl">Navamukunda HSS</h3><p class="text-sm opacity-80">Thirunavaya</p></div></div><p class="text-sm opacity-80 leading-relaxed mb-4">Excellence in education since 1998. Nurturing young minds and building character through quality English &amp; Malayalam medium  in a co-educational environment.</p><div class="flex space-x-4"><a href="https://www.facebook.com/NMHSSchool/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/80 transition-colors" data-testid="social-facebook"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-facebook w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a><a href="https://www.instagram.com/nmhssthirunavaya_official/" target="_blank" rel="noopener noreferrer" aria-label="Instagram " class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary/80 transition-colors" data-testid="social-linkedin"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram w-4 h-4"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg></a></div></div><div data-testid="footer-quick-links"><h4 class="font-semibold text-lg mb-6">Quick Links</h4><ul class="space-y-3"><li><a href="/about-us" class="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-about">About Us</a></li><li><a href="/academic-results" class="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-academics">Academics</a></li><li><a href="#faculty" class="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-faculty">Faculty</a></li><li><a href="#events" class="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-events">Events</a></li></ul></div><div data-testid="footer-resources"><h4 class="font-semibold text-lg mb-6">Resources</h4><ul class="space-y-3"><li><a href="/students" class="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-handbook">Student Handbook</a></li><li><a href="#calendar" class="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-calendar">Academic Calendar</a></li><li><a href="/academic-results" class="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-results">Exam Results</a></li><li><a href="/gallery" class="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-gallery">Photo Gallery</a></li></ul></div><div data-testid="footer-contact-info"><h4 class="font-semibold text-lg mb-6">Contact Info</h4><div class="space-y-3"><p class="text-sm opacity-80">Navamukunda HSS<br>Thazhathara, Thirunavaya.676301<br>Malappuram v.Dist</p><p class="text-sm opacity-80">Phone: +91 0494 260 1534</p><p class="text-sm opacity-80">Email: navamukundahss@gmail.com</p></div></div></div><div class="border-t border-border/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center" data-testid="footer-bottom"><p class="text-sm opacity-80">© 2025 Navamukunda HSS Thirunavaya. All rights reserved.</p><div class="flex space-x-6 mt-4 md:mt-0"><a href="#privacy" class="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-privacy">Privacy Policy</a><a href="#terms" class="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-terms">Terms of Service</a><a href="#accessibility" class="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="footer-link-accessibility">Accessibility</a></div></div></div></footer></div></div>`
          );
      },
    },
  };
};

export default defineConfig({
  plugins: [
    Sitemap({
      hostname: "https://nmhss.onrender.com",
      dynamicRoutes: [
        "/",
        "/about-us",
        "/gallery",
        "/students",
        "/students-upload",
        "/about-teachers",
        "/sports-champions",
        "/academic-results",
        "/arts-science",
      ],
      outDir: "dist/public",
    }),

    // This is the only thing we need – no extra npm install!
    prerenderPlugin(),

    react(),
    runtimeErrorOverlay(),

    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [await import("@replit/vite-plugin-cartographer").then(m => m.cartographer())]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  root: path.resolve(import.meta.dirname, "client"),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },

  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
