import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Github as GithubIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Stage, Graphics, useTick } from "@pixi/react-legacy";
import React, { useState, useRef, useEffect } from "react";

const developers = [
  {
    name: "Pranav P",
    role: "Frontend Developer",
    bio: "Crafting futuristic UIs with React, animations, and modern design principles.",
    photo: "https://avatars.githubusercontent.com/Orewaluffy4",
    social: { github: "https://github.com/Orewaluffy4" },
  },
  {
    name: "Abhishek P",
    role: "Backend Developer",
    bio: "Building scalable, secure backend systems and APIs that power next-gen applications.",
    photo: "https://avatars.githubusercontent.com/Inevitable200tech",
    social: { github: "https://github.com/Inevitable200tech" },
  },
];

// 🔄 Optimized spinning shape with useRef to prevent re-renders
const SpinningShape: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => {
  const angleRef = useRef(0);

  useTick((delta: number) => {
    angleRef.current += 0.01 * delta;
  });

  return (
    <Graphics
      draw={(g) => {
        g.clear();
        g.beginFill(0xff00aa, 0.6);
        g.drawRect(-60, -60, 120, 120);
        g.endFill();
        g.rotation = angleRef.current;
        g.x = width / 2;
        g.y = height / 2;
      }}
    />
  );
};

export default function AboutDevelopers() {
  const [canvasSize, setCanvasSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  // 📏 Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* === PIXI Background === */}
      <div className="absolute inset-0 -z-10">
        <Stage
          width={canvasSize.w}
          height={canvasSize.h}
          options={{ backgroundAlpha: 0 }}
        >
          <SpinningShape width={canvasSize.w} height={canvasSize.h} />
        </Stage>
      </div>

      <Navigation />

      <section id="developers" className="py-24 mt-16 relative z-10">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-extrabold text-purple-400">
              Meet Our Developers
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {developers.map((dev, index) => (
              <motion.div
                key={index}
                className="bg-black/70 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-xl text-center"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.3 }}
              >
                <img
                  src={dev.photo}
                  alt={dev.name}
                  className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-purple-400 shadow-lg"
                />
                <h3 className="text-2xl font-bold text-purple-300">
                  {dev.name}
                </h3>
                <p className="text-gray-400 mb-3">{dev.role}</p>
                <p className="text-sm text-gray-300 mb-6">{dev.bio}</p>
                <div className="flex justify-center">
                  <a
                    href={dev.social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <GithubIcon className="w-6 h-6" />
                  </a>
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
