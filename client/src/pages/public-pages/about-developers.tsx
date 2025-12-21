import Navigation from "@/components/static-pages/navigation";
import Footer from "@/components/static-pages/footer";
import { Github as GithubIcon } from "lucide-react";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";

// Developer data with tech stack
const developers = [
  {
    name: "Pranav P",
    role: "Frontend Developer",
    bio: "Crafting futuristic UIs with React, animations, and modern design principles. As a creator, Pranav focuses on seamless user experiences.",
    photo: "https://avatars.githubusercontent.com/pranav-pradeesh", // Replace with valid URL
    social: { github: "https://pranav-pradeesh.github.io/pranav-pradeesh" },
    techStack: ["React", "TypeScript", "Framer Motion", "Tailwind CSS"],
  },
  {
    name: "Abhishek P",
    role: "Backend Developer",
    bio: "Building scalable, secure backend systems and APIs that power next-gen applications. As a creator, Abhishek ensures robust performance.",
    photo: "https://avatars.githubusercontent.com/Inevitable200tech", // Replace with valid URL
    social: { github: "https://inevitable200tech.github.io/Inevitable200tech/" },
    techStack: ["Node.js", "Express", "MongoDB", "TypeScript"],
  },
];

export default function AboutDevelopers() {
  const [canvasSize, setCanvasSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  const isMobile = canvasSize.w < 768;

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 50, rotate: -10 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: { delay: index * 0.5, duration: 1, type: "spring", stiffness: 100 },
    }),
    hover: { scale: 1.05, rotate: 5, boxShadow: "0px 15px 40px rgba(128, 0, 255, 0.4)" },
    tap: { scale: 0.95 },
  };

  // Tech stack popup variants
  const techStackVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <Helmet>
        <title>About Developers - NMHSS Thirunavaya</title>
        <meta name="description" content="Meet the talented developers who created the NMHSS Thirunavaya website. Learn about their expertise, tech stack, and contributions." />
        <meta name="keywords" content="developers, web development, NMHSS, Thirunavaya, frontend, backend" />
        <meta property="og:title" content="About Developers - NMHSS Thirunavaya" />
        <meta property="og:description" content="Meet the talented developers who created the NMHSS Thirunavaya website." />
        <meta property="og:type" content="website" />
        
      </Helmet>
      {/* Starry night background */}
      <div
        className="absolute inset-0 -z-0"
        style={{
          background: "linear-gradient(to bottom, #1a1a3d, #000000)",
        }}
      >
        {[...Array(100)].map((_, i) => {
          const size = Math.random() * 2 + 1.5; // 1–3.5px
          const duration = Math.random() * 2 + 2; // 2–4s
          const delay = Math.random() * 5; // 0–5s
          return (
            <div
              key={i}
              className="absolute rounded-full bg-white star"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.4 + 0.2,
                animation: `twinkle ${duration}s ${delay}s infinite alternate`,
                filter: "blur(0.3px)",
              }}
            />
          );
        })}
      </div>

      {/* Global styles for stars */}
      <style>{`
        @keyframes twinkle {
          0% {
            opacity: 0.1;
            transform: scale(0.6);
            filter: blur(0.5px);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
            filter: blur(0.2px);
          }
          100% {
            opacity: 0.2;
            transform: scale(0.7);
            filter: blur(0.4px);
          }
        }
      `}</style>

      <Navigation />

      <section id="developers" className="py-24 mt-16 relative z-10">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <h2 className="text-5xl font-extrabold text-purple-400 md:text-6xl">
              Introducing Our Creators
            </h2>
            <p className="text-gray-300 mt-4 text-lg md:text-xl">
              Meet the talented minds behind this innovative platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {developers.map((dev, index) => {
              const [showStack, setShowStack] = useState(false);

              return (
                <motion.div
                  key={index}
                  className="bg-black/70 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-xl text-center relative"
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  drag
                  dragConstraints={{ left: -20, right: 20, top: -20, bottom: 20 }}
                  dragElastic={0.3}
                >
                  <motion.img
                    src={dev.photo}
                    alt={dev.name}
                    onError={(e) => (e.currentTarget.src = "/images/fallback-avatar.png")}
                    className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-purple-400 shadow-lg"
                    whileHover={{ rotate: 360, scale: 1.1, transition: { duration: 0.8 } }}
                  />

                  <motion.h3
                    className="text-2xl font-bold text-purple-300 relative cursor-pointer group"
                    whileHover={{ scale: 1.1 }}
                    onClick={() => {
                      if (isMobile) setShowStack((prev) => !prev);
                    }}
                  >
                    {dev.name}
                    {/* Tech stack popup */}
                    <motion.div
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-purple-900/90 backdrop-blur-sm rounded-lg p-4 shadow-lg z-20 w-48"
                      variants={techStackVariants}
                      initial="hidden"
                      animate={showStack ? "visible" : "hidden"}
                      whileHover="visible"
                    >
                      <h4 className="text-sm font-bold text-purple-300 mb-2">Tech Stack</h4>
                      <ul className="text-sm text-gray-300">
                        {dev.techStack.map((tech, i) => (
                          <li key={i}>{tech}</li>
                        ))}
                      </ul>
                    </motion.div>
                  </motion.h3>

                  <p className="text-gray-400 mb-3">{dev.role}</p>
                  <p className="text-sm text-gray-300 mb-6">{dev.bio}</p>
                  <div className="flex justify-center">
                    <motion.a
                      href={dev.social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit ${dev.name}'s GitHub profile`}
                      className="text-gray-400 hover:text-purple-400 transition-colors"
                      whileHover={{ scale: 1.3, rotate: 20 }}
                    >
                      <GithubIcon className="w-6 h-6" />
                    </motion.a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
