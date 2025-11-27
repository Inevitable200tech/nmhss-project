// src/pages/public-pages/sports-champions.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Footer from "@/components/static-pages/footer";
import Navigation from "@/components/static-pages/navigation";
import { Calendar, ChevronDown } from 'lucide-react';
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
};

// MOCK DATA — used as fallback when real data is missing
const MOCK_DATA: Record<number, SportsResult> = {
  2025: {
    year: 2025,
    gold: 7,
    silver: 6,
    bronze: 5,
    totalParticipants: 148,
    champions: [
      { name: "Priya Venkat", event: "100m Sprint", position: 1, level: "HSS", featured: true, photoUrl: "https://placehold.co/400x400/FFD700/000000?text=PV" },
      { name: "Arjun Mehta", event: "Long Jump", position: 1, level: "HSS", photoUrl: "https://placehold.co/400x400/FF6B6B/FFFFFF?text=AM" },
      { name: "Neha Kapoor", event: "200m Dash", position: 2, level: "HSS", photoUrl: "https://placehold.co/400x400/C0C0C0/000000?text=NK" },
      { name: "Team Blaze", event: "4x100m Relay", position: 1, level: "HS", featured: true, teamMembers: ["Rahul", "Amit", "Suresh", "Kiran"], photoUrl: "https://placehold.co/400x400/4ECDC4/FFFFFF?text=TEAM" },
      { name: "Team Thunder", event: "4x400m Relay", position: 2, level: "HS", photoUrl: "https://placehold.co/400x400/87CEEB/000000?text=TT" },
      { name: "Ananya R.", event: "Javelin Throw", position: 1, level: "State", photoUrl: "https://placehold.co/400x400/32CD32/FFFFFF?text=AR" },
      { name: "Suresh K.", event: "Shot Put", position: 3, level: "State", photoUrl: "https://placehold.co/400x400/32CD32/FFFFFF?text=SK" },
      { name: "Rohan P.", event: "Triple Jump", position: 2, level: "District", photoUrl: "https://placehold.co/400x400/FFA500/FFFFFF?text=RP" },
      { name: "Geetha M.", event: "Discus", position: 1, level: "District", photoUrl: "https://placehold.co/400x400/FFA500/FFFFFF?text=GM" },
    ]
  },
  2024: {
    year: 2024,
    gold: 5,
    silver: 7,
    bronze: 4,
    totalParticipants: 132,
    champions: [
      { name: "Kavya Nair", event: "400m Hurdles", position: 1, level: "HSS", featured: true, photoUrl: "https://placehold.co/400x400/FFD700/000000?text=KN" },
      { name: "Team Eagles", event: "4x100m Relay", position: 1, level: "HS", featured: true, teamMembers: ["Vikram", "Arun", "Nikhil", "Dev"], photoUrl: "https://placehold.co/400x400/1A535C/FFFFFF?text=EAGLES" },
      { name: "Vikas T.", event: "Decathlon", position: 2, level: "State", photoUrl: "https://placehold.co/400x400/32CD32/FFFFFF?text=VT" },
    ]
  }
};

const groupByLevel = (champs: Champion[]) => ({
  HSS: champs.filter(c => c.level === 'HSS'),
  HS: champs.filter(c => c.level === 'HS'),
  State: champs.filter(c => c.level === 'State'),
  District: champs.filter(c => c.level === 'District'),
});

const groupByPosition = (champs: Champion[]): Record<1 | 2 | 3, Champion[]> => ({
  1: champs.filter(c => c.position === 1),
  2: champs.filter(c => c.position === 2),
  3: champs.filter(c => c.position === 3),
});

const medalEmoji = (pos: 1 | 2 | 3) => {
    switch (pos) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '🏅';
    }
}

export default function SportsChampionsPage() {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [data, setData] = useState<SportsResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch available years
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

  // Fetch data for selected year
  useEffect(() => {
    if (!selectedYear) return;

    setLoading(true);
    fetch(`/api/sports-results/${selectedYear}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((result: SportsResult) => {
        setData(result);
      })
      .catch(() => {
        // Fallback to mock data
        const mock = MOCK_DATA[selectedYear];
        if (mock) setData(mock);
      })
      .finally(() => setLoading(false));
  }, [selectedYear]);

  if (loading || !data || !selectedYear) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-950 dark:to-black flex items-center justify-center">
        <div className="text-2xl font-semibold text-orange-600">Loading champions...</div>
      </div>
    );
  }

  // 1. Extract all champion levels
  const { HSS, HS, State, District } = groupByLevel(data.champions);

  const renderFeatured = (champs: Champion[]) => {
    const featured = champs.find(c => c.featured) ?? champs[0];
    if (!featured) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 sm:p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-8">
          <img src={featured.photoUrl} alt={featured.name} className="w-48 h-48 sm:w-64 sm:h-64 rounded-full object-fill border-8 border-white dark:border-gray-700 shadow-xl" />
          <div className="text-center lg:text-left flex-1 space-y-4">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white">
              {featured.name}
              {featured.teamMembers && <span className="block text-xl sm:text-2xl font-medium text-orange-600 dark:text-orange-400 mt-2">Team Captain</span>}
            </h3>
            <p className="text-xl sm:text-2xl font-semibold text-orange-600 dark:text-orange-400">{featured.event}</p>
            {featured.teamMembers && (
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                Team: <span className="font-medium">{featured.teamMembers.join(' • ')}</span>
              </p>
            )}
            <p className="text-lg sm:text-xl font-medium text-gray-700 dark:text-gray-300 mt-6">
              Outstanding achievement at the National Level!
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderMedalGrid = (champs: Champion[]) => {
    if (champs.length === 0) {
      return (
        <p className="text-center text-gray-500 dark:text-gray-400 py-6 italic">
          No champions recorded at this level for the selected year.
        </p>
      );
    }
    const byPos = groupByPosition(champs);
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
        {([1, 2, 3] as const).map(pos => {
          const winners = byPos[pos];
          const count = winners.length;
          return (
            <div key={pos} className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 text-center flex flex-col">
              
              {/* --- START: Champion List (Modified for Tooltip/Touch Reveal) --- */}
              <div className="flex-1 space-y-4 mb-6">
                {winners.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center gap-6 p-5 bg-gray-50 dark:bg-gray-900 rounded-xl transition-shadow hover:shadow-lg">
                    {/* Updated photo size to w-20 h-20 and reduced padding for better fit */}
                    <img src={c.photoUrl} alt={c.name} className="w-20 h-20 rounded-full object-fill border-3 border-current" />
                    <div className="text-left flex-1 min-w-0">
                      {/* Removed 'truncate' class and added 'title' attribute for hover/touch reveal */}
                      <div 
                        className="font-extrabold text-xl overflow-hidden whitespace-nowrap text-ellipsis text-gray-900 dark:text-white" 
                        title={c.name} // Full text revealed on hover/touch
                      >
                        {c.name}
                      </div>
                      {/* Removed 'truncate' class and added 'title' attribute for hover/touch reveal */}
                      <div 
                        className="text-base overflow-hidden whitespace-nowrap text-ellipsis text-orange-600 dark:text-orange-400"
                        title={c.event} // Full text revealed on hover/touch
                      >
                        {c.event}
                      </div>
                    </div>
                  </div>
                ))}
                {count === 0 && (
                     <p className="text-sm text-gray-400 italic pt-2">None in this category.</p>
                )}
                {count > 4 && <p className="text-sm text-gray-500 pt-2 font-medium">+{count - 4} more champions</p>}
              </div>
              {/* --- END: Champion List --- */}

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  {/* --- START: Medal Count (Smaller) --- */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="text-3xl">{medalEmoji(pos)}</div>
                    <h4 className={`text-xl font-extrabold ${pos === 1 ? 'text-amber-600' : pos === 2 ? 'text-gray-500' : 'text-orange-600'}`}>
                      {pos === 1 ? 'GOLD' : pos === 2 ? 'SILVER' : 'BRONZE'}
                    </h4>
                  </div>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{count} Medals</p>
                  {/* --- END: Medal Count --- */}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSubNationalChampions = (level: 'State' | 'District', champs: Champion[]) => {
    const title = level === 'State' ? 'State Level Champions' : 'District Level Champions';
    
    // Only render the section if there are champions at this level
    if (champs.length === 0) return null;

    return (
      <section className="space-y-10">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-gray-900 dark:text-white mt-12">
          {title}
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-10">
           {renderMedalGrid(champs)}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-950 dark:to-black">
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24 sm:pt-32">
        <div className="max-w-7xl mx-auto space-y-16">

          {/* Header and Year Selector */}
          <header className="text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-red-600 to-pink-600">
              Sports Champions 🏆
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5" />
              Academic Year {selectedYear}–{selectedYear + 1}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Viewing Data For</span>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="appearance-none bg-white dark:bg-gray-800 border-2 border-orange-300 dark:border-orange-600 rounded-2xl px-8 py-4 pr-12 text-xl font-bold text-orange-700 dark:text-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-300 cursor-pointer shadow-lg"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year} – {year + 1}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-orange-600 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 rounded-3xl p-8 shadow-xl border border-yellow-200 dark:border-yellow-800">
                <div className="text-5xl mb-3">🥇</div>
                <div className="text-6xl font-extrabold text-amber-600 dark:text-amber-400">{data.gold}</div>
                <div className="text-lg font-bold mt-2">National Gold</div>
              </div>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-xl border border-gray-300 dark:border-gray-700">
                <div className="text-5xl mb-3">🥈</div>
                <div className="text-6xl font-extrabold text-gray-500 dark:text-gray-400">{data.silver}</div>
                <div className="text-lg font-bold mt-2">National Silver</div>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 rounded-3xl p-8 shadow-xl border border-orange-200 dark:border-orange-800">
                <div className="text-5xl mb-3">🥉</div>
                <div className="text-6xl font-extrabold text-orange-600 dark:text-orange-400">{data.bronze}</div>
                <div className="text-lg font-bold mt-2">National Bronze</div>
              </div>
            </div>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 pt-4">Total Participants: {data.totalParticipants}</p>

          </header>

          {/* National Level Sections */}
          {HSS.length > 0 && (
            <section className="space-y-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-gray-900 dark:text-white">
                Higher Secondary School (HSS) - National
              </h2>
              {renderFeatured(HSS)}
              {renderMedalGrid(HSS)}
            </section>
          )}

          {HS.length > 0 && (
            <section className="space-y-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-gray-900 dark:text-white">
                High School (HS) - National
              </h2>
              {renderFeatured(HS)}
              {renderMedalGrid(HS)}
            </section>
          )}

          {/* Medal Tally Graph */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              National Medal Tally {selectedYear}–{selectedYear + 1}
            </h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Gold', count: data.gold, fill: '#FCD34D' },
                  { name: 'Silver', count: data.silver, fill: '#94A3B8' },
                  { name: 'Bronze', count: data.bronze, fill: '#FB923C' },
                ]}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                  <YAxis tick={{ fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          
          {/* State and District Sections */}
          {renderSubNationalChampions('State', State)}
          {renderSubNationalChampions('District', District)}

        </div>
      </main>

      <Footer />
    </div>
  );
}