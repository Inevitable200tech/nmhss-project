import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Github as GithubIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import React, { useState, useEffect } from "react";

// Developer data with tech stack
const developers = [
  {
    name: "Pranav P",
    role: "Frontend Developer",
    bio: "Crafting futuristic UIs with React, animations, and modern design principles. As a creator, Pranav focuses on seamless user experiences.",
    photo: "https://avatars.githubusercontent.com/Orewaluffy4", // Replace with valid URL
    social: { github: "https://github.com/Orewaluffy4" },
    techStack: ["React", "TypeScript", "Framer Motion", "Tailwind CSS"],
  },
  {
    name: "Abhishek P",
    role: "Backend Developer",
    bio: "Building scalable, secure backend systems and APIs that power next-gen applications. As a creator, Abhishek ensures robust performance.",
    photo: "https://avatars.githubusercontent.com/Inevitable200tech", // Replace with valid URL
    social: { github: "https://github.com/Inevitable200tech" },
    techStack: ["Node.js", "Express", "MongoDB", "TypeScript"],
  },
];

export default function AboutDevelopers() {
  const [canvasSize, setCanvasSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  const isMobile = canvasSize.w < 768; // Define isMobile to fix TS2304

  // Debounced resize handler
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check for reduced motion preference
  const shouldReduceMotion = useReducedMotion();

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 50, rotate: shouldReduceMotion ? 0 : -10 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: shouldReduceMotion
        ? { delay: index * 0.5, duration: 0 }
        : { delay: index * 0.5, duration: 1, type: "spring", stiffness: 100 },
    }),
    hover: shouldReduceMotion
      ? {}
      : { scale: 1.05, rotate: 5, boxShadow: "0px 15px 40px rgba(128, 0, 255, 0.4)" },
    tap: { scale: 0.95 },
  };

  // Tech stack popup variants
  const techStackVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Starry night background */}
      <div
        className="absolute inset-0 -z-0"
        style={{
          background: "linear-gradient(to bottom, #1a1a3d, #000000)",
        }}
      >
        {/* Stars */}
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white star"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Global styles */}
      <style>{`
        .star {
          animation: twinkle ${Math.random() * 2 + 2}s infinite alternate;
        }
        @keyframes twinkle {
          0% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          100% {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }
        @media (prefers-reduced-motion) {
          .star {
            animation: none !important;
            opacity: 0.5 !important;
          }
        }
      `}</style>

      <Navigation />

      <section id="developers" className="py-24 mt-16 relative z-10">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 1.2, ease: "easeOut" }}
          >
            <h2 className="text-5xl font-extrabold text-purple-400 md:text-6xl">
              Introducing Our Creators
            </h2>
            <p className="text-gray-300 mt-4 text-lg md:text-xl">
              Meet the talented minds behind this innovative platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {developers.map((dev, index) => (
              <motion.div
                key={index}
                className="bg-black/70 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-xl text-center relative"
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                drag={!shouldReduceMotion}
                dragConstraints={{ left: -20, right: 20, top: -20, bottom: 20 }}
                dragElastic={0.3}
              >
                <motion.img
                  src={dev.photo}
                  alt={dev.name}
                  onError={(e) => (e.currentTarget.src = "/images/fallback-avatar.png")}
                  className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-purple-400 shadow-lg"
                  whileHover={
                    shouldReduceMotion ? {} : { rotate: 360, scale: 1.1, transition: { duration: 0.8 } }
                  }
                />
                <motion.h3
                  className="text-2xl font-bold text-purple-300 relative cursor-pointer group"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
                >
                  {dev.name}
                  {/* Tech stack popup */}
                  <motion.div
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-purple-900/90 backdrop-blur-sm rounded-lg p-4 shadow-lg z-20 w-48 tech-stack"
                    initial="hidden"
                    animate="hidden"
                    whileHover="visible"
                    variants={techStackVariants}
                    // Show on tap for mobile
                    onClick={(e) => {
                      if (isMobile) {
                        const popup = e.currentTarget.querySelector(".tech-stack");
                        if (popup) {
                          popup.classList.toggle("motion-visible");
                        }
                      }
                    }}
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
                    whileHover={shouldReduceMotion ? {} : { scale: 1.3, rotate: 20 }}
                  >
                    <GithubIcon className="w-6 h-6" />
                  </motion.a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}