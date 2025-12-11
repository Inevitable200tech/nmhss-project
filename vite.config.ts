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
            `<meta charset="UTF-8" />
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
    content="https://nmhss.onrender.com/assets/school.jpg" />
  <meta property="og:url" content="https://nmhss.onrender.com" />
  <meta property="og:type" content="website" />

  <!-- Twitter Preview -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="NMHSS Thirunavaya" />
  <meta name="twitter:description" content="A premier Higher Secondary School in Kerala shaping future leaders." />
  <meta name="twitter:image" content="https://nmhss.onrender.com/assets/fb.jpg" />

  <!-- Favicon -->

  <!-- Schema.org for Google Rich Results -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "NMHSS Thirunavaya",
    "alternateName": "Navamukunda Higher Secondary School",
    "url": "https://nmhss.onrender.com",
    "logo": "https://nmhss.onrender.com/assets/logo.png",
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
            `<div id="root">
  <div style="
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
  ">
    <div style="max-width: 800px; width: 100%;">
      <!-- School Name -->
      <h1 style="
        font-size: 3.5rem;
        font-weight: 700;
        margin: 0 0 1rem;
        text-shadow: 0 4px 12px rgba(0,0,0,0.3);
        letter-spacing: -1px;
      ">
        Navamukunda Higher Secondary School
      </h1>

      <!-- Tagline -->
      <p style="
        font-size: 1.5rem;
        margin: 0 0 3rem;
        opacity: 0.95;
        font-weight: 400;
      ">
        Excellence in Education • Since 19XX • Kerala
      </p>

      <!-- Navigation Links -->
      <nav style="
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        justify-content: center;
        margin-bottom: 4rem;
        font-size: 1.1rem;
      ">
        <a href="/" style="color: white; text-decoration: none; opacity: 0.9; transition: opacity 0.3s;">Home</a>
        <a href="/about-us" style="color: white; text-decoration: none; opacity: 0.9; transition: opacity 0.3s;">About Us</a>
        <a href="/gallery" style="color: white; text-decoration: none; opacity: 0.9; transition: opacity 0.3s;">Gallery</a>
        <a href="/students" style="color: white; text-decoration: none; opacity: 0.9; transition: opacity 0.3s;">Students</a>
        <a href="/about-teachers" style="color: white; text-decoration: none; opacity: 0.9; transition: opacity 0.3s;">Faculty</a>
        <a href="/academic-results" style="color: white; text-decoration: none; opacity: 0.9; transition: opacity 0.3s;">Results</a>
        <a href="/sports-champions" style="color: white; text-decoration: none; opacity: 0.9; transition: opacity 0.3s;">Sports</a>
        <a href="/arts-science" style="color: white; text-decoration: none; opacity: 0.9; transition: opacity 0.3s;">Arts & Science</a>
      </nav>

      <!-- Loading Animation + Text -->
      <div style="margin-top: 2rem;">
        <div style="
          width: 60px;
          height: 60px;
          border: 5px solid rgba(255,255,255,0.3);
          border-top: 5px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem;
        "></div>
        <p style="
          font-size: 1.3rem;
          opacity: 0.9;
          margin: 0;
        ">
          Loading full interactive experience...
        </p>
      </div>
    </div>
  </div>

  <!-- Simple spinner animation -->
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</div>`
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