'use client';

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Footer from "@/components/static-pages/footer";
import Navigation from "@/components/static-pages/navigation";
import { Calendar, Trophy, Star, X, Users, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

type Champion = {
  name: string;
  event: string;
  position: 1 | 2 | 3;
  level: 'HSS' | 'HS' | 'State' | 'District';
  featured?: boolean;
  teamMembers?: string[];
  photoUrl: string;
};

type SportsResult = {
  year: number;
  gold: number;
  silver: number;
  bronze: number;
  totalParticipants: number;
  champions: Champion[];
  slideshowImages?: { photoUrl: string }[];
};

const MOCK_DATA: Record<number, SportsResult> = { /* unchanged */ };

const groupByLevel = (champs: Champion[]) => ({
  HSS: champs.filter(c => c.level === 'HSS'),
  HS: champs.filter(c => c.level === 'HS'),
  State: champs.filter(c => c.level === 'State'),
  District: champs.filter(c => c.level === 'District'),
});

const medalColor = (pos: 1 | 2 | 3) => pos === 1 ? 'text-yellow-500' : pos === 2 ? 'text-gray-400' : 'text-orange-600';

const ChampionCard = ({ c, onClick }: { c: Champion; onClick: () => void }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden cursor-pointer"
  >
    <div className="relative h-64">
      <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-2xl font-bold text-white">{c.name}</p>
        <p className="text-lg text-white/90">{c.event}</p>
      </div>
    </div>
    <div className="p-5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{c.level}</span>
        <Medal className={`w-10 h-10 ${medalColor(c.position)}`} />
      </div>
      {c.teamMembers && c.teamMembers.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          Team: {c.teamMembers.join(', ')}
        </p>
      )}
    </div>
  </motion.div>
);

const ChampionDetailDialog: React.FC<{ champion: Champion; onClose: () => void }> = ({ champion, onClose }) => {
  const { name, event, position, level, teamMembers, photoUrl } = champion;
  const medalText = position === 1 ? 'Gold' : position === 2 ? 'Silver' : 'Bronze';
  const positionColor = position === 1 ? 'border-yellow-500' : position === 2 ? 'border-gray-400' : 'border-orange-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X className="w-8 h-8" />
        </button>
        <div className="flex flex-col items-center space-y-6">
          <img src={photoUrl} alt={name} className={`w-48 h-48 rounded-full object-cover border-8 ${positionColor} shadow-2xl`} />
          <h3 className="text-4xl font-black text-center">{name}</h3>
          <div className="text-center space-y-2">
            <p className="text-xl"><span className="font-semibold">Level:</span> {level}</p>
            <p className="text-xl"><span className="font-semibold">Event:</span> {event}</p>
            <p className="text-2xl font-bold flex items-center justify-center gap-3">
              {medalText} <Medal className={`w-12 h-12 ${medalColor(position)}`} />
            </p>
          </div>
          {teamMembers && teamMembers.length > 0 && (
            <div className="text-center">
              <p className="font-semibold flex items-center justify-center gap-2">
                <Users className="w-6 h-6" /> Team Members
              </p>
              <p className="text-lg">{teamMembers.join(' • ')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function SportsChampionsPage() {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [data, setData] = useState<SportsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetch('/api/sports-results/years')
      .then(r => r.json())
      .then((years: number[]) => {
        const allYears = years.length > 0 ? years : Object.keys(MOCK_DATA).map(Number);
        const sorted = allYears.sort((a, b) => b - a);
        setAvailableYears(sorted);
        setSelectedYear(sorted[0]);
      })
      .catch(() => {
        const fallback = Object.keys(MOCK_DATA).map(Number).sort((a, b) => b - a);
        setAvailableYears(fallback);
        setSelectedYear(fallback[0]);
      });
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    fetch(`/api/sports-results/${selectedYear}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(result => setData(result))
      .catch(() => {
        const mock = MOCK_DATA[selectedYear];
        if (mock) setData(mock);
      })
      .finally(() => setLoading(false));
  }, [selectedYear]);
  const slideshowImages = data?.slideshowImages
    ?.map((img: any) => img.mediaId ? `/api/media/${img.mediaId}` : null)
    .filter((url): url is string => url !== null) || [];

  const allFeatured = data
    ? (['HSS', 'HS', 'State', 'District'] as const)
      .map(l => groupByLevel(data.champions)[l as keyof ReturnType<typeof groupByLevel>]?.find(c => c.featured))
      .filter((c): c is Champion => c !== undefined)
    : [];

  const slides: string[] = slideshowImages.length > 0
    ? slideshowImages
    : allFeatured.map(c => c.photoUrl);
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (loading || !data || !selectedYear) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-3xl font-bold flex items-center gap-4">
          <Trophy className="w-10 h-10 animate-pulse" /> Loading...
        </div>
      </div>
    );
  }

  const levels = [
    { key: 'HSS', title: 'Higher Secondary (HSS)', champs: groupByLevel(data.champions).HSS },
    { key: 'HS', title: 'High School (HS)', champs: groupByLevel(data.champions).HS },
    { key: 'State', title: 'State Level', champs: groupByLevel(data.champions).State },
    { key: 'District', title: 'District Level', champs: groupByLevel(data.champions).District },
  ].filter(l => l.champs.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white dark:from-gray-900 dark:to-black overflow-x-hidden">
      <Helmet><title>Sports Champions - NMHSS</title></Helmet>
      <Navigation />

      <main className="pt-20 pb-16">
        {/* Top Champions Backdrop Slideshow - Now uses uploaded slideshow images */}
        {slides.length > 0 && (
          <section className="relative h-[100vh] overflow-hidden -mt-3 mb-20">
            <AnimatePresence initial={false}>
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0"
              >
                <img
                  src={slides[currentSlide]}
                  alt="Slideshow"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 bg-black/60 z-10" />

            <div className="relative z-20 h-full flex flex-col justify-end pb-20 px-8 text-center text-white">
              <motion.h2
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: -80, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-5xl md:text-7xl font-black drop-shadow-2xl"
              >
                OUR TOP CHAMPIONS
              </motion.h2>

              <div className={`grid grid-cols-1 ${allFeatured.length <= 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} ${allFeatured.length <= 3 ? 'lg:grid-cols-' + allFeatured.length : 'lg:grid-cols-4'} gap-8 max-w-7xl mx-auto mt-4 place-items-center`}>
                {allFeatured.map((champ, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -200 }}
                    animate={{ opacity: 1, y: -60 }}
                    transition={{ delay: 1.5 + i * 0.3, duration: 0.8 }}
                    onClick={() => setSelectedChampion(champ)}
                    className="bg-white/30 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-gray-700/20 cursor-pointer hover:scale-105 transition-all duration-300 flex flex-col items-center w-60"
                  >
                    <img
                      src={champ.photoUrl}
                      alt={champ.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400 shadow-md mb-4"
                    />
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-8 h-8 text-yellow-500 fill-current" />
                      <p className="text-lg font-bold">{champ.level}</p>
                    </div>
                    <p className="text-2xl font-black text-center">{champ.name}</p>
                    <p className="text-base mt-2 opacity-90 text-center">{champ.event}</p>
                    {champ.teamMembers && champ.teamMembers.length > 0 && (
                      <p className="text-xs mt-3 opacity-80 text-center">Team: {champ.teamMembers.join(' • ')}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Rest of the page unchanged */}
        <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <h1 className="text-4xl md:text-7xl font-black text-orange-600">NAVAMUKUNDA HSS</h1>
          <h2 className="text-1xl md:text-5xl font-bold mt-4">Sports Achievements {selectedYear}-{selectedYear + 1}</h2>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="mt-8 px-8 py-4 rounded-full bg-black shadow-2xl text-xl">
            {availableYears.map(y => <option key={y}>{y}-{y + 1}</option>)}
          </select>
        </motion.header>

        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto my-20">
          {[{ pos: 1, count: data.gold }, { pos: 2, count: data.silver }, { pos: 3, count: data.bronze }].map(m => (
            <motion.div key={m.pos} whileHover={{ scale: 1.1 }} className="text-center">
              <div className={`text-8xl ${medalColor(m.pos as 1 | 2 | 3)}`}>{['🥇', '🥈', '🥉'][m.pos - 1]}</div>
              <p className="text-6xl font-black mt-6">{m.count}</p>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-3xl mb-20">Total Participants: <span className="font-bold text-orange-600">{data.totalParticipants}</span></p>

        {levels.map((level, i) => (
          <section key={level.key} className="mb-32 px-4 overflow-hidden">
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold text-center mb-16 text-gray-800 dark:text-white"
            >
              {level.title}
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 max-w-7xl mx-auto">
              {level.champs.map((c, j) => (
                <motion.div
                  key={j}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: j * 0.1 }}
                >
                  <ChampionCard c={c} onClick={() => setSelectedChampion(c)} />
                </motion.div>
              ))}
            </div>
          </section>
        ))}

        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="max-w-5xl mx-auto px-4 mb-20">
          <h3 className="text-4xl font-bold text-center mb-12">Medal Tally</h3>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-2xl">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={[{ name: 'Gold', count: data.gold }, { name: 'Silver', count: data.silver }, { name: 'Bronze', count: data.bronze }]}>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[30, 30, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </main>

      <Footer />
      {selectedChampion && <ChampionDetailDialog champion={selectedChampion} onClose={() => setSelectedChampion(null)} />}
    </div>
  );
}