"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientTeacher, InsertTeacher } from "@shared/schema";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function AdminTeacherEdit() {
  const queryClient = useQueryClient();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Check for adminToken in localStorage
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    setToken(adminToken);
    setIsAuthLoading(false);
    if (!adminToken) {
      window.location.href = "/admin";
    }
  }, []);

  // Fetch teachers
  const { data: teachers, isLoading } = useQuery<ClientTeacher[]>({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
    enabled: !!token,
  });

  // State for new teacher form
  const [newTeacher, setNewTeacher] = useState<{ name: string; subject: string; bio: string }>({
    name: "",
    subject: "",
    bio: "",
  });
  const [newImage, setNewImage] = useState<File | null>(null);

  // Mutations
  const createTeacher = useMutation({
    mutationFn: async () => {
      if (!newImage) throw new Error("Image is required");

      // Upload image to /api/media
      const formData = new FormData();
      formData.append("file", newImage);
      const uploadRes = await fetch("/api/media", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Image upload failed");
      const { id: mediaId, url: imageUrl } = await uploadRes.json();

      // Create full InsertTeacher and post to /api/admin/teachers
      const fullData: InsertTeacher = {
        name: newTeacher.name,
        subject: newTeacher.subject,
        bio: newTeacher.bio,
        mediaId,
        imageUrl,
      };

      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fullData),
      });
      if (!res.ok) throw new Error("Failed to create teacher");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setNewTeacher({ name: "", subject: "", bio: "" });
      setNewImage(null);
    },
  });

  const deleteTeacher = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete teacher");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
    },
  });

  if (isAuthLoading || isLoading) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900 via-gray-900 to-black animate-gradient" />
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-white">Loading...</span>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="relative min-h-screen flex flex-col ">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900 via-gray-900 to-black animate-gradient" />
        <div className="flex items-center justify-center h-screen">
          <p className="text-white text-lg">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900 via-gray-900 to-black animate-gradient" />
      <main className="flex-1 container mx-auto px-4 py-20">
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-center text-white mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Manage <span className="text-blue-400">Teachers</span>
        </motion.h1>
        <Button
          onClick={() => window.location.href = "/admin"}
          className="mb-6 bg-gray-500 hover:bg-gray-600 text-white"
        >
          Go Back To Dashboard
        </Button>

        {/* Add New Teacher Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-black/60 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-12"
        >
          <h2 className="text-2xl font-semibold text-white mb-4">Add New Teacher</h2>
          <div className="grid gap-4">
            <Input
              placeholder="Name"
              value={newTeacher.name}
              onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
              className="bg-gray-800 text-white border-white/20"
            />
            <Input
              placeholder="Subject"
              value={newTeacher.subject}
              onChange={(e) => setNewTeacher({ ...newTeacher, subject: e.target.value })}
              className="bg-gray-800 text-white border-white/20"
            />
            <Textarea
              placeholder="Bio"
              value={newTeacher.bio}
              onChange={(e) => setNewTeacher({ ...newTeacher, bio: e.target.value })}
              className="bg-gray-800 text-white border-white/20"
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files?.[0] || null)}
              className="bg-gray-800 text-white border-white/20"
            />
            <Button
              onClick={() => createTeacher.mutate()}
              disabled={createTeacher.isPending || !newTeacher.name || !newTeacher.subject || !newTeacher.bio || !newImage}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {createTeacher.isPending ? "Creating..." : "Add Teacher"}
            </Button>
            {createTeacher.error && (
              <p className="text-red-400">{createTeacher.error.message}</p>
            )}
          </div>
        </motion.div>

        {/* Teacher List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {teachers && teachers.length > 0 ? (
            teachers.map((teacher) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-black/60 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center"
              >
                <img
                  src={teacher.imageUrl}
                  alt={teacher.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg mb-4"
                />
                <h2 className="text-xl font-semibold text-white mb-2">{teacher.name}</h2>
                <p className="text-blue-400 mb-2">{teacher.subject}</p>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{teacher.bio}</p>
                <Button
                  onClick={() => deleteTeacher.mutate(teacher.id)}
                  disabled={deleteTeacher.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {deleteTeacher.isPending ? "Deleting..." : "Delete"}
                </Button>
                {deleteTeacher.error && (
                  <p className="text-red-400 mt-2">{deleteTeacher.error.message}</p>
                )}
              </motion.div>
            ))
          ) : (
            <p className="text-center text-gray-300 text-lg col-span-full">
              No teachers available.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}