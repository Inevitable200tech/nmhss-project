// src/pages/public-pages/sports-champions.tsx - FINALIZED CLEAN THEME
'use client';

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Footer from "@/components/static-pages/footer";
import Navigation from "@/components/static-pages/navigation";
import { Calendar, ChevronDown, Trophy, Star, X, Users, Zap } from 'lucide-react'; // ADDED: X, Users, Zap icons
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

// MOCK DATA (Retained for functionality)
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

// Helper to determine medal background styles (Retained basic structure for glass contrast)
const getMedalStyles = (pos: 1 | 2 | 3) => {
  switch (pos) {
    case 1:
      return {
        borderClass: 'border-yellow-500/50',
        textColor: 'text-yellow-700 dark:text-yellow-400'
      };
    case 2:
      return {
        borderClass: 'border-gray-500/50',
        textColor: 'text-gray-700 dark:text-gray-400'
      };
    case 3:
      return {
        borderClass: 'border-red-500/50',
        textColor: 'text-red-700 dark:text-red-400'
      };
    default:
      return {
        borderClass: 'border-gray-300/50',
        textColor: 'text-gray-700 dark:text-gray-400'
      };
  }
};

// --- NEW DIALOG COMPONENT ---
const ChampionDetailDialog: React.FC<{
  champion: Champion;
  onClose: () => void;
}> = ({ champion, onClose }) => {
  const { name, event, position, level, teamMembers, photoUrl } = champion;
  const styles = getMedalStyles(position);
  
  const medalText = position === 1 ? 'Gold' : position === 2 ? 'Silver' : 'Bronze';
  const positionColor = position === 1 ? 'border-yellow-500' : position === 2 ? 'border-gray-400' : 'border-red-500';

  return (
      // Backdrop click handler
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
          <div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
              <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Champion Details</h3>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                      <X className="h-6 w-6" />
                  </button>
              </div>

              <div className="flex flex-col items-center space-y-4">
                  <img
                      src={photoUrl}
                      alt={name}
                      className={`w-28 h-28 rounded-full object-cover border-4 ${positionColor} shadow-md`}
                  />
                  <h4 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center">{name}</h4>
                  
                  <div className="w-full space-y-3 pt-4">
                      <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Level:</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{level}</span>
                      </div>
                      
                      <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Event:</span>
                          <span className="font-bold text-teal-600 dark:text-teal-400 text-lg">{event}</span>
                      </div>

                      {teamMembers && teamMembers.length > 0 && (
                          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              <span className="flex items-center font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  <Users className="h-5 w-5 mr-2" /> Team Members:
                              </span>
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 ml-2">
                                  {teamMembers.join(' • ')}
                              </p>
                          </div>
                      )}

                      <div className={`flex justify-between p-3 rounded-lg border border-3 ${styles.borderClass} ${position === 1 ? 'bg-yellow-100 dark:bg-yellow-900/40' : position === 2 ? 'bg-gray-100 dark:bg-gray-700/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Position:</span>
                          <span className={`font-bold text-2xl flex items-center ${styles.textColor}`}>
                              {medalText} ({position}) {medalEmoji(position)}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );
};
// --- END NEW DIALOG COMPONENT ---


export default function SportsChampionsPage() {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [data, setData] = useState<SportsResult | null>(null);
  const [loading, setLoading] = useState(true);

  // NEW STATE FOR DIALOG
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);

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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-950 dark:to-black flex items-center justify-center">
        <div className="text-3xl font-extrabold text-red-700 dark:text-orange-400 flex items-center gap-3">
          <Trophy className="w-8 h-8 animate-pulse" /> Loading Navamukunda HSS records...
        </div>
      </div>
    );
  }

  // 1. Extract all champion levels
  const { HSS, HS, State, District } = groupByLevel(data.champions);

  // --- Render Featured Champion as Static Hero Text (Themed) ---
  const renderFeaturedHero = (champs: Champion[], level: 'HSS' | 'HS') => {
    const featured = champs.find(c => c.featured) ?? champs[0];
    if (!featured) return null;

    const levelText = level === 'HSS' ? 'Higher Secondary' : 'High School';
    const primaryColor = 'text-red-800 dark:text-red-500';
    const secondaryColor = 'text-yellow-600 dark:text-yellow-400';

    return (
      <div className="py-12 px-4 sm:px-8 lg:px-12 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className='flex justify-center'>
            <Star className={`w-12 h-12 ${secondaryColor} fill-current drop-shadow-lg`} />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-gray-800 dark:text-gray-300">
            {levelText} Top Champion
          </h3>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-tight drop-shadow-xl">
            PROUD MOMENT FOR NAVAMUKUNDA HSS!
          </h2>

          <p className="text-2xl sm:text-3xl font-semibold text-gray-700 dark:text-gray-300">
            Student <span className={primaryColor}>{featured.name.toUpperCase()}</span> secured Gold in the <span className={primaryColor + ' font-extrabold'}>{featured.event}</span> Event!
          </p>

          {featured.teamMembers && (
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 italic">
              Leading Team: <span className="font-medium">{featured.teamMembers.join(' • ')}</span>
            </p>
          )}

          <img
            src={featured.photoUrl}
            alt={featured.name}
            className={`w-36 h-36 rounded-full object-cover border-4 border-red-700 shadow-xl mx-auto mt-6 cursor-pointer`}
            onClick={() => setSelectedChampion(featured)} // ADDED CLICK HANDLER
          />
        </div>
      </div>
    );
  };

  // --- Render Medal Grid with Glass Style (Themed) ---
  const renderMedalGrid = (champs: Champion[]) => {
    if (champs.length === 0) {
      return (
        <p className="text-center text-gray-500 dark:text-gray-400 py-6 italic text-xl">
          No champions recorded at this level for the selected year.
        </p>
      );
    }
    const byPos = groupByPosition(champs);
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        {([1, 2, 3] as const).map(pos => {
          const winners = byPos[pos];
          const count = winners.length;
          const styles = getMedalStyles(pos);
          const glassBgClass = 'bg-white/20 dark:bg-gray-800/20 backdrop-blur-md border border-white/30 dark:border-gray-700/30';

          return (
            <div key={pos} className={`rounded-3xl shadow-2xl p-6 text-center flex flex-col ${glassBgClass} border-4 ${styles.borderClass}`}>

              {/* Medal Count Title */}
              <div className="pt-2 pb-6 flex flex-col items-center justify-center">
                <div className="text-5xl">{medalEmoji(pos)}</div>
                <h4 className={`text-2xl font-black tracking-wide uppercase text-gray-900 dark:text-white mt-2`}>
                  {pos === 1 ? 'Gold Medals' : pos === 2 ? 'Silver Medals' : 'Bronze Medals'}
                </h4>
                <p className="text-5xl font-extrabold text-gray-900 dark:text-white mt-2 drop-shadow-sm">{count}</p>
              </div>

              {/* Champion List Items */}
              <div className="flex-1 space-y-4 border-t border-white/50 dark:border-gray-700/50 pt-6">
                {winners.slice(0, 4).map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm rounded-xl transition-all duration-200 shadow-inner hover:shadow-lg cursor-pointer" // ADDED CURSOR-POINTER
                    onClick={() => setSelectedChampion(c)} // ADDED CLICK HANDLER
                  >
                    <img
                      src={c.photoUrl}
                      alt={c.name}
                      className={`w-14 h-14 rounded-full object-cover border-2 ${pos === 1 ? 'border-yellow-500' : pos === 2 ? 'border-gray-400' : 'border-red-500'}`}
                    />
                    <div className="text-left flex-1 min-w-0">
                      <div
                        className="font-bold text-lg overflow-hidden whitespace-nowrap text-ellipsis text-gray-900 dark:text-white"
                        title={c.name}
                      >
                        {c.name}
                      </div>
                      <div
                        className="text-sm overflow-hidden whitespace-nowrap text-ellipsis text-red-600 dark:text-red-400 font-medium"
                        title={c.event}
                      >
                        {c.event}
                      </div>
                    </div>
                  </div>
                ))}
                {count === 0 && (
                  <p className="text-base text-gray-400 italic pt-2">None in this category.</p>
                )}
                {count > 4 && <p className="text-base text-gray-600 dark:text-gray-400 pt-2 font-semibold">+{count - 4} more champions</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSubNationalChampions = (level: 'State' | 'District', champs: Champion[]) => {
    const title = level === 'State' ? 'State Level' : 'District Level';

    if (champs.length === 0) return null;

    return (
      <section className="space-y-10 pt-12">
        {/* MODIFICATION: Underline removed */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-gray-900 dark:text-white mt-12">
          <span className="pb-2">{title} Champions</span>
        </h2>
        <div className="p-6 sm:p-10">
          {renderMedalGrid(champs)}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-yellow-100 to-green-100 dark:from-gray-900 dark:to-black">
      <Helmet>
        <title>Sports Champions - NMHSS Thirunavaya</title>
        <meta name="description" content="Celebrate the athletic achievements of NMHSS Thirunavaya sports champions. Discover our award-winning athletes and their accomplishments." />
        <meta name="keywords" content="sports, champions, athletics, NMHSS, Thirunavaya, awards, sports achievements" />
        <meta property="og:title" content="Sports Champions - NMHSS Thirunavaya" />
        <meta property="og:description" content="Celebrate the athletic achievements of NMHSS Thirunavaya sports champions." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://nmhss.onrender.com/sports-champions" />
      </Helmet>
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24 sm:pt-32">
        <div className="max-w-7xl mx-auto space-y-20">

          {/* Header and Year Selector */}
          <header className="text-center space-y-10">
            {/* MODIFICATION: Location/Icon removed */}

            {/* MODIFICATION: Reduced heading size from lg:text-8xl to lg:text-7xl and sm:text-6xl to sm:text-5xl */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-700 via-yellow-600 to-green-700 drop-shadow-xl">
              NAVAMUKUNDA HSS
            </h1>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white -mt-4">
              SPORTS ACHIEVEMENTS
            </h2>

            <p className="text-xl sm:text-2xl font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-3">
              <Calendar className="w-6 h-6 text-red-700" />
              Academic Year <span className='font-extrabold'>{selectedYear}–{selectedYear + 1}</span>
            </p>

            {/* Year Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <span className="text-xl font-bold text-gray-800 dark:text-gray-200">View Year:</span>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="appearance-none bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border-4 border-red-700/50 dark:border-red-700/50 rounded-full px-10 py-4 pr-16 text-2xl font-black text-red-800 dark:text-red-400 shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-300 cursor-pointer"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year} – {year + 1}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-red-700 pointer-events-none" />
              </div>
            </div>

            {/* Medal Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto pt-6">
              <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-3xl p-8 shadow-2xl border-b-8 border-yellow-700 transform hover:scale-[1.03] transition-transform duration-300">
                <div className="text-6xl mb-3">🥇</div>
                <div className="text-7xl font-black text-yellow-900 drop-shadow-md">{data.gold}</div>
                <div className="text-xl font-bold mt-3 text-yellow-800">TOTAL GOLD</div>
              </div>
              <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-3xl p-8 shadow-2xl border-b-8 border-gray-700 transform hover:scale-[1.03] transition-transform duration-300">
                <div className="text-6xl mb-3">🥈</div>
                <div className="text-7xl font-black text-gray-800 drop-shadow-md">{data.silver}</div>
                <div className="text-xl font-bold mt-3 text-gray-700">TOTAL SILVER</div>
              </div>
              <div className="bg-gradient-to-br from-red-300 to-red-500 rounded-3xl p-8 shadow-2xl border-b-8 border-red-700 transform hover:scale-[1.03] transition-transform duration-300">
                <div className="text-6xl mb-3">🥉</div>
                <div className="text-7xl font-black text-red-900 drop-shadow-md">{data.bronze}</div>
                <div className="text-xl font-bold mt-3 text-red-800">TOTAL BRONZE</div>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 pt-8">Total Participants: <span className='text-red-700'>{data.totalParticipants}</span></p>

          </header>

          {/* HSS Section */}
          {HSS.length > 0 && (
            <section className="space-y-10 pt-12">
              {/* MODIFICATION: Reduced heading size and removed underline */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-gray-900 dark:text-white">
                <span className="pb-2">Higher Secondary School (HSS)</span>
              </h2>
              {renderFeaturedHero(HSS, 'HSS')}
              {renderMedalGrid(HSS)}
            </section>
          )}

          {/* HS Section */}
          {HS.length > 0 && (
            <section className="space-y-10 pt-12">
              {/* MODIFICATION: Reduced heading size and removed underline */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-gray-900 dark:text-white">
                <span className="pb-2">High School (HS)</span>
              </h2>
              {renderFeaturedHero(HS, 'HS')}
              {renderMedalGrid(HS)}
            </section>
          )}

          {/* Medal Tally Graph */}
          <section className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-10 border-4 border-red-700/50 dark:border-red-700/50">
            <h3 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
              Overall Medal Tally {selectedYear}–{selectedYear + 1}
            </h3>
            <div className="h-64 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Gold', count: data.gold, fill: '#FFD700' },
                  { name: 'Silver', count: data.silver, fill: '#C0C0C0' },
                  { name: 'Bronze', count: data.bronze, fill: '#800000' },
                ]}>
                  <CartesianGrid strokeDasharray="6 6" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: '14px' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} />
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
      {selectedChampion && <ChampionDetailDialog champion={selectedChampion} onClose={() => setSelectedChampion(null)} />} {/* RENDER THE DIALOG */}
    </div>
  );
}