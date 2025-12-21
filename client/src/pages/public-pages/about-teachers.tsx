"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/static-pages/navigation";
import Footer from "@/components/static-pages/footer";
import { ClientTeacher } from "@shared/schema";
import { Helmet } from "react-helmet";

export default function AboutTeachers() {
  const { data: teachers, isLoading } = useQuery<ClientTeacher[]>({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex flex-col mt-8">
        <Navigation />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900 via-gray-900 to-black animate-gradient" />
        <div className="flex items-center justify-center h-screen">
          <div
            className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"
          ></div>
          <span className="ml-2 text-white">Loading Teachers...</span>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col mt-8">
      <Helmet>
        <title>Teachers - NMHSS Thirunavaya</title>
        <meta name="description" content="Meet the experienced faculty members of NMHSS Thirunavaya. Our teachers are dedicated educators committed to academic excellence and student development." />
        <meta name="keywords" content="teachers, faculty, NMHSS, Thirunavaya, education, staff" />
        <meta property="og:title" content="Teachers - NMHSS Thirunavaya" />
        <meta property="og:description" content="Meet the experienced faculty members of NMHSS Thirunavaya dedicated to academic excellence." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://nmhss.onrender.com/about-teachers" />

      </Helmet>
      {/* Navigation */}
      <Navigation />

      {/* Background gradient animation */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900 via-gray-900 to-black animate-gradient" />

      <main className="flex-1 container mx-auto px-4 py-20">
        {/* Page Title */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-center text-white mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Meet Our <span className="text-blue-400">Teachers</span>
        </motion.h1>

        {/* Teacher grid */}
        {teachers && teachers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {teachers.map((teacher, idx) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-black/60 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center"
              >
                <motion.img
                  src={teacher.imageUrl}
                  alt={teacher.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg mb-4"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                />
                <h2 className="text-xl font-semibold text-white">{teacher.name}</h2>
                <p className="text-blue-400">{teacher.subject}</p>
                <p className="text-gray-300 mt-3 text-sm leading-relaxed">{teacher.bio}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-300 text-lg">No teachers available at this time.</p>
        )}
      </main>

      <Footer />
    </div>
  );
}