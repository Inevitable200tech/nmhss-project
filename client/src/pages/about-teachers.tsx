// src/pages/about-teachers.tsx
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import { Stage, useTick, Text } from "@pixi/react-legacy";
import { useEffect, useRef, useState } from "react";

const teachers = [
  {
    name: "Dr. Asha Sharma",
    subject: "Mathematics",
    bio: "Ph.D. in Applied Mathematics with 20 years of teaching experience.",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Mr. Rajesh Kumar",
    subject: "Physics",
    bio: "Passionate about simplifying complex concepts for students.",
    photo: "https://randomuser.me/api/portraits/men/45.jpg",
  },
  {
    name: "Ms. Priya Nair",
    subject: "Chemistry",
    bio: "Dedicated to hands-on learning and student engagement.",
    photo: "https://randomuser.me/api/portraits/women/46.jpg",
  },
]

type FloatingItem = {
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hue: number;
};

const FloatingTexts: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const texts = ["navamukunda", "madavan sir", "hi"];
  const fontSize = 28;
  const maxItems = 7; // cap
  const speed_const = 2.4; // 🔑 tweak this for faster/slower movement
  const gravityStrength = 0.02; // 🔑 tweak this for stronger/weaker pull

  const duplicates = Math.max(1, Math.floor(maxItems / texts.length));

  const itemsRef = useRef<FloatingItem[]>(
    texts
      .flatMap((t) =>
        Array.from({ length: duplicates }, () => {
          const textWidth = t.length * (fontSize * 0.6);
          const textHeight = fontSize;

          const x = Math.random() * (width - textWidth);
          const y = Math.random() * (height - textHeight);

          return {
            text: t,
            x,
            y,
            vx: (Math.random() - 0.5) * speed_const * 2,
            vy: (Math.random() - 0.5) * speed_const * 2,
            hue: Math.floor(Math.random() * 360),
          };
        })
      )
      .slice(0, maxItems)
  );

  const [, setTick] = useState(0);

  const hslToHex = (h: number, s: number, l: number): number => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));
    return (r << 16) + (g << 8) + b;
  };

  useTick(() => {
    const items = itemsRef.current;

    // move + wall bounce + gravity
    items.forEach((it) => {
      // apply gravity toward center
      const dx = width / 2 - it.x;
      const dy = height / 2 - it.y;
      it.vx += dx * gravityStrength * 0.001;
      it.vy += dy * gravityStrength * 0.001;

      it.x += it.vx;
      it.y += it.vy;

      const textWidth = it.text.length * (fontSize * 0.6);
      const textHeight = fontSize;

      if (it.x < 0) {
        it.x = 0;
        it.vx *= -1;
      }
      if (it.x > width - textWidth) {
        it.x = width - textWidth;
        it.vx *= -1;
      }
      if (it.y < 0) {
        it.y = 0;
        it.vy *= -1;
      }
      if (it.y > height - textHeight) {
        it.y = height - textHeight;
        it.vy *= -1;
      }

      it.hue = (it.hue + 2) % 360;
    });

    // collisions
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];

        const aw = a.text.length * (fontSize * 0.6);
        const ah = fontSize;
        const bw = b.text.length * (fontSize * 0.6);
        const bh = fontSize;

        const overlapX = a.x < b.x + bw && a.x + aw > b.x;
        const overlapY = a.y < b.y + bh && a.y + ah > b.y;

        if (overlapX && overlapY) {
          const ax = a.x + aw / 2;
          const ay = a.y + ah / 2;
          const bx = b.x + bw / 2;
          const by = b.y + bh / 2;

          const dx = bx - ax;
          const dy = by - ay;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

          const nx = dx / dist;
          const ny = dy / dist;

          const rvx = a.vx - b.vx;
          const rvy = a.vy - b.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal <= 0) {
            const restitution = 0.9;
            const j = -(1 + restitution) * velAlongNormal / 2;

            const impulseX = j * nx;
            const impulseY = j * ny;

            a.vx += impulseX;
            a.vy += impulseY;
            b.vx -= impulseX;
            b.vy -= impulseY;

            const overlap = Math.min(aw, bw) / 2;
            a.x -= nx * overlap * 0.5;
            a.y -= ny * overlap * 0.5;
            b.x += nx * overlap * 0.5;
            b.y += ny * overlap * 0.5;

            // random kick to break symmetry
            a.vx += (Math.random() - 0.5) * 0.2;
            a.vy += (Math.random() - 0.5) * 0.2;
            b.vx += (Math.random() - 0.5) * 0.2;
            b.vy += (Math.random() - 0.5) * 0.2;
          }
        }
      }
    }

    // clamp after collisions
    items.forEach((it) => {
      const textWidth = it.text.length * (fontSize * 0.6);
      const textHeight = fontSize;

      if (it.x < 0) it.x = 0;
      if (it.x > width - textWidth) it.x = width - textWidth;
      if (it.y < 0) it.y = 0;
      if (it.y > height - textHeight) it.y = height - textHeight;
    });

    setTick((t) => t + 1);
  });

  return (
    <>
      {itemsRef.current.map((it, idx) => (
        <Text
          key={idx}
          text={it.text}
          x={it.x}
          y={it.y}
          style={{
            fontFamily: "Arial",
            fontSize,
            fill: hslToHex(it.hue, 80, 50),
            fontWeight: "bold",
          } as any}
        />
      ))}
    </>
  );
};

export default function AboutTeachers() {
  const [canvasSize, setCanvasSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* === PIXI Background === */}
      <div className="absolute inset-0 -z-0">
        <Stage
          width={canvasSize.w}
          height={canvasSize.h}
          options={{ backgroundAlpha: 0 }}
        >
          <FloatingTexts width={canvasSize.w} height={canvasSize.h} />
        </Stage>
      </div>

      <Navigation />

      <section id="teachers" className="py-24 mt-6 relative z-10">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-extrabold text-blue-400">
              Meet Our Teachers
            </h2>
            <p className="text-gray-400 mt-2">
              Dedicated educators shaping the future
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {teachers.map((teacher, index) => (
              <motion.div
                key={index}
                className="bg-black/60 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-xl text-center"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.3 }}
              >
                <img
                  src={teacher.photo}
                  alt={teacher.name}
                  className="w-28 h-28 rounded-full mx-auto mb-6 border-4 border-blue-400 shadow-lg"
                />
                <h3 className="text-2xl font-bold text-blue-300">
                  {teacher.name}
                </h3>
                <p className="text-gray-400 mb-2">{teacher.subject}</p>
                <p className="text-sm text-gray-300">{teacher.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
