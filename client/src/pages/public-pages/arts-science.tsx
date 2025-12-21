// src/pages/public-pages/arts-science.tsx - NAVAMUKUNDA ARTS & SCIENCE ACHIEVEMENTS
'use client';

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Footer from "@/components/static-pages/footer";
import Navigation from "@/components/static-pages/navigation";
import { Calendar, ChevronDown, Palette, FlaskConical, Zap, Star, LayoutGrid, X, Users } from 'lucide-react'; // ADDED: X, Users icons
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES (unchanged) ---
type CompetitionLevel = 'State' | 'District' | 'Sub-District';
type SchoolSection = 'HSS' | 'HS' | 'UP';

type Achievement = {
  name: string;
  item: string;
  grade: 'A' | 'B' | 'C';
  schoolSection: SchoolSection;
  competitionLevel: CompetitionLevel;
  featured?: boolean;
  groupMembers?: string[];
  photoUrl: string;
  mediaId?: string; // optional, present only if uploaded via admin
};

type EventResult = {
  year: number;
  totalA: number;
  totalB: number;
  totalC: number;
  totalParticipants: number;
  achievements: Achievement[];
};

type ArtsScienceData = {
  Kalolsavam: EventResult;
  Sasthrosavam: EventResult;
}

type ActiveTab = 'Kalolsavam' | 'Sasthrosavam';

// --- API FETCHING FUNCTIONS (unchanged) ---
const fetchAvailableYears = async (): Promise<number[]> => {
  const res = await fetch('/api/arts-science-results/years');
  if (!res.ok) throw new Error('Failed to fetch years');
  const years = await res.json();
  return years.sort((a: number, b: number) => b - a);
};

const fetchResultsForYear = async (year: number): Promise<ArtsScienceData> => {
  const res = await fetch(`/api/arts-science-results/${year}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('No results found for this year');
    throw new Error('Failed to fetch results');
  }
  const data = await res.json();

  // API returns lowercase keys → normalize to match our type
  return {
    Kalolsavam: data.kalolsavam,
    Sasthrosavam: data.sasthrosavam,
  };
};

// --- HELPER FUNCTIONS (unchanged) ---
const groupBySchoolSection = (achievements: Achievement[]) => ({
  HSS: achievements.filter(c => c.schoolSection === 'HSS'),
  HS: achievements.filter(c => c.schoolSection === 'HS'),
  UP: achievements.filter(c => c.schoolSection === 'UP'),
});

const groupByGrade = (achievements: Achievement[]): Record<'A' | 'B' | 'C', Achievement[]> => ({
  A: achievements.filter(c => c.grade === 'A'),
  B: achievements.filter(c => c.grade === 'B'),
  C: achievements.filter(c => c.grade === 'C'),
});

const gradeEmoji = (grade: 'A' | 'B' | 'C') => {
  switch (grade) {
    case 'A': return '🌟';
    case 'B': return '✨';
    case 'C': return '💫';
    default: return '🏅';
  }
};

const getGradeStyles = (grade: 'A' | 'B' | 'C') => {
  switch (grade) {
    case 'A':
      return { borderClass: 'border-yellow-600/50', photoBorderClass: 'border-yellow-500', bgClass: 'bg-yellow-100 dark:bg-yellow-900/40' };
    case 'B':
      return { borderClass: 'border-blue-600/50', photoBorderClass: 'border-blue-500', bgClass: 'bg-blue-100 dark:bg-blue-900/40' };
    case 'C':
      return { borderClass: 'border-red-600/50', photoBorderClass: 'border-red-500', bgClass: 'bg-red-100 dark:bg-red-900/40' };
  }
};

// --- NEW DIALOG COMPONENT ---
const AchievementDetailDialog: React.FC<{
  achievement: Achievement;
  onClose: () => void;
}> = ({ achievement, onClose }) => {
  const { name, item, grade, schoolSection, competitionLevel, groupMembers, photoUrl } = achievement;
  const styles = getGradeStyles(grade);

  return (
      // Backdrop click handler
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
          <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
              <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Achievement Details</h3>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                      <X className="h-6 w-6" />
                  </button>
              </div>

              <div className="flex flex-col items-center space-y-4">
                  <img
                      src={photoUrl}
                      alt={name}
                      className={`w-28 h-28 rounded-full object-cover border-4 ${styles.photoBorderClass} shadow-md`}
                  />
                  <h4 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center">{name}</h4>

                  <div className="w-full space-y-3 pt-4">
                      <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Section:</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{schoolSection}</span>
                      </div>

                      <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Competition:</span>
                          <span className="font-bold text-teal-600 dark:text-teal-400 text-lg">{competitionLevel}</span>
                      </div>
                      
                      <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Event Item:</span>
                          <span className="font-bold text-gray-900 dark:text-white text-lg">{item}</span>
                      </div>

                      {groupMembers && groupMembers.length > 0 && (
                          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              <span className="flex items-center font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  <Users className="h-5 w-5 mr-2" /> Group Members:
                              </span>
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 ml-2">
                                  {groupMembers.join(' • ')}
                              </p>
                          </div>
                      )}

                      <div className={`flex justify-between p-3 rounded-lg border border-3 ${styles.borderClass} ${styles.bgClass}`}>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Grade Achieved:</span>
                          <span className={`font-bold text-2xl flex items-center text-gray-900 dark:text-white`}>
                              Grade {grade} {gradeEmoji(grade)}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );
};
// --- END NEW DIALOG COMPONENT ---


// --- RENDER COMPONENTS ---
const renderFeaturedHero = (achievements: Achievement[], eventName: ActiveTab, setSelectedAchievement: (a: Achievement) => void) => {
  // New Logic: Prioritize the manually set 'featured' item.
  let featured = achievements.find(a => a.featured === true);

  // Fallback: If no item is manually featured, use the old ranking logic.
  if (!featured) {
    featured = achievements
      .sort((a, b) => {
        // Primary: Competition Level (State > District > Sub-District)
        if (a.competitionLevel === 'State' && b.competitionLevel !== 'State') return -1;
        if (a.competitionLevel !== 'State' && b.competitionLevel === 'State') return 1;
        // Secondary: Grade (A > B > C)
        if (a.grade === 'A' && b.grade !== 'A') return -1;
        return 0;
      })[0];
  }

  if (!featured) return null;

  const sectionText = featured.schoolSection === 'HSS' ? 'Higher Secondary' : featured.schoolSection === 'HS' ? 'High School' : 'Upper Primary';
  const competitionText = featured.competitionLevel === 'State' ? 'State Level' : featured.competitionLevel === 'District' ? 'District Level' : 'Sub-District Level';
  const primaryColor = 'text-red-800 dark:text-red-500';
  const secondaryColor = 'text-yellow-600 dark:text-yellow-400';

  return (
    <div className="py-12 px-4 sm:px-8 lg:px-12 text-center relative z-10 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-3xl shadow-inner mt-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className='flex justify-center'>
          <Star className={`w-12 h-12 ${secondaryColor} fill-current drop-shadow-lg`} />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-gray-800 dark:text-gray-300">
          {competitionText} - {sectionText} Top Achievement
        </h3>
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-tight drop-shadow-xl">
          OUTSTANDING PERFORMANCE!
        </h2>
        <p className="text-2xl sm:text-3xl font-semibold text-gray-700 dark:text-gray-300">
          <span className={primaryColor}>{featured.name.toUpperCase()}</span> secured Grade {featured.grade} in the <span className={primaryColor + ' font-extrabold'}>{featured.item}</span> Event!
        </p>
        {featured.groupMembers && (
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 italic">
            Team Members: <span className="font-medium">{featured.groupMembers.join(' • ')}</span>
          </p>
        )}
        <img
          src={featured.photoUrl}
          alt={featured.name}
          className={`w-36 h-36 rounded-full object-cover border-4 border-red-700 shadow-xl mx-auto mt-6 cursor-pointer`} // ADDED cursor-pointer
          onClick={() => setSelectedAchievement(featured)} // ADDED CLICK HANDLER
        />
      </div>
    </div>
  );
};

const renderGradeGrid = (achievements: Achievement[], setSelectedAchievement: (a: Achievement) => void) => {
  if (achievements.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-6 italic text-xl">
        No records found for this section.
      </p>
    );
  }
  const byGrade = groupByGrade(achievements);
  const glassBgClass = 'bg-white/20 dark:bg-gray-800/20 backdrop-blur-md border border-white/30 dark:border-gray-700/30';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
      {(['A', 'B', 'C'] as const).map(grade => {
        const winners = byGrade[grade];
        const count = winners.length;
        const styles = getGradeStyles(grade);

        return (
          <div key={grade} className={`rounded-3xl shadow-2xl p-6 text-center flex flex-col ${glassBgClass} border-4 ${styles.borderClass}`}>
            <div className="pt-2 pb-6 flex flex-col items-center justify-center">
              <div className="text-5xl">{gradeEmoji(grade)}</div>
              <h4 className={`text-2xl font-black tracking-wide uppercase text-gray-900 dark:text-white mt-2`}>
                Grade {grade} Achievers
              </h4>
              <p className="text-5xl font-extrabold text-gray-900 dark:text-white mt-2 drop-shadow-sm">{count}</p>
            </div>

            <div className="flex-1 space-y-4 border-t border-white/50 dark:border-gray-700/50 pt-6">
              {winners.slice(0, 4).map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm rounded-xl transition-all duration-200 shadow-inner hover:shadow-lg cursor-pointer" // ADDED cursor-pointer
                  onClick={() => setSelectedAchievement(a)} // ADDED CLICK HANDLER
                >
                  <img
                    src={a.photoUrl}
                    alt={a.name}
                    className={`w-14 h-14 rounded-full object-cover border-2 ${styles.photoBorderClass}`}
                  />
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-bold text-lg overflow-hidden whitespace-nowrap text-ellipsis text-gray-900 dark:text-white" title={a.name}>
                      {a.name}
                    </div>
                    <div className="text-sm overflow-hidden whitespace-nowrap text-ellipsis text-red-600 dark:text-red-400 font-medium" title={a.item}>
                      {a.item} ({a.competitionLevel})
                    </div>
                  </div>
                </div>
              ))}
              {count === 0 && <p className="text-base text-gray-400 italic pt-2">None in this category.</p>}
              {count > 4 && <p className="text-base text-gray-600 dark:text-gray-400 pt-2 font-semibold">+{count - 4} more achievements</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function ArtsSciencePage() {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [data, setData] = useState<ArtsScienceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Kalolsavam');
  const [yearsLoadedInitial, setYearsLoadedInitial] = useState(false); // New state to track if the initial years fetch is complete
  
  // NEW STATE FOR DIALOG
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Fetch available years
  useEffect(() => {
    const loadYears = async () => {
      try {
        const years = await fetchAvailableYears();
        setAvailableYears(years);
        if (years.length > 0) {
          setSelectedYear(years[0]);
        }
      } catch (err) {
        setError('Failed to load available years');
        console.error(err);
      } finally {
        setYearsLoadedInitial(true); // Always set to true when the years API call completes
      }
    };
    loadYears();
  }, []);

  // Fetch data when year changes
  useEffect(() => {
    if (!selectedYear) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchResultsForYear(selectedYear);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to load results for selected year');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedYear]);

  // --- TOP-LEVEL RENDERING LOGIC ---

  // 1. Initial Loading (before years API completes)
  if (!yearsLoadedInitial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-950 dark:to-black flex items-center justify-center">
        <div className="text-3xl font-extrabold text-red-700 dark:text-orange-400 flex items-center gap-3">
          <Zap className="w-8 h-8 animate-pulse" /> Loading Event Records...
        </div>
      </div>
    );
  }

  // 2. No Years Found (years API completed and returned [])
  if (availableYears.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-yellow-100 to-green-100 dark:from-gray-900 dark:to-black">
        <Navigation />
        <main className="container mx-auto px-4 py-8 pt-24 sm:pt-32 min-h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center">
            <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-6">No Academic Years Found 📅</h1>
            <p className="text-xl text-gray-700 dark:text-gray-300">
                It looks like there are no Arts & Science achievements registered in the system yet. Please check back later!
            </p>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. Error Loading Data for a selected year
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-950 dark:to-black">
        <Navigation />
        <main className="container mx-auto px-4 py-8 pt-24 sm:pt-32 min-h-[calc(100vh-200px)] flex items-center justify-center">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400 text-center">
                An error occurred: {error}
            </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 4. Loading data for the selected year (years exist)
  if (loading || !data) {
     return (
        <div className="min-h-screen bg-gradient-to-br from-red-100 via-yellow-100 to-green-100 dark:from-gray-900 dark:to-black">
            <Navigation />
            <main className="container mx-auto px-4 py-8 pt-24 sm:pt-32 min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="text-3xl font-extrabold text-red-700 dark:text-orange-400 flex items-center gap-3">
                    <Zap className="w-8 h-8 animate-pulse" /> Loading Results for {selectedYear}–{selectedYear! + 1}...
                </div>
            </main>
            <Footer />
        </div>
    );
  }

  // SUCCESS / Main Content
  const eventData = data[activeTab];
  const { HSS, HS, UP } = groupBySchoolSection(eventData.achievements);
  const eventNameFull = activeTab === 'Kalolsavam' ? 'Kalolsavam (Arts Festival)' : 'Sasthrosavam (Science Fair)';

  const renderSection = (section: SchoolSection, achievements: Achievement[]) => {
    if (achievements.length === 0) return null;

    const titleMap: Record<SchoolSection, string> = {
      HSS: 'Higher Secondary School (HSS)',
      HS: 'High School (HS)',
      UP: 'Upper Primary (UP)'
    };
    const title = titleMap[section];

    return (
      <section className="space-y-10 pt-12">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-gray-900 dark:text-white">
          <span className={`pb-2 text-transparent bg-clip-text bg-gradient-to-r ${section === 'HSS' ? 'from-red-700 to-yellow-600' : section === 'HS' ? 'from-green-700 to-yellow-600' : 'from-blue-700 to-yellow-600'}`}>
            {title}
          </span>
        </h2>
        <div className="p-6 sm:p-10">
          {renderGradeGrid(achievements, setSelectedAchievement)}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-yellow-100 to-green-100 dark:from-gray-900 dark:to-black">
      <Helmet>
        <title>Arts & Science Achievements - NMHSS Thirunavaya</title>
        <meta name="description" content="Celebrate the achievements of NMHSS Thirunavaya students in Kalolsavam and Sasthrosavam competitions. View awards, recognitions, and cultural excellence." />
        <meta name="keywords" content="arts, science, achievements, Kalolsavam, Sasthrosavam, NMHSS, Thirunavaya, competitions" />
        <meta property="og:title" content="Arts & Science Achievements - NMHSS Thirunavaya" />
        <meta property="og:description" content="Celebrate the achievements of NMHSS Thirunavaya students in cultural and scientific competitions." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://nmhss.onrender.com/arts-science" />
      </Helmet>
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24 sm:pt-32">
        <div className="max-w-7xl mx-auto space-y-20">

          {/* Header */}
          <header className="text-center space-y-10">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-700 via-yellow-600 to-green-700 drop-shadow-xl">
              NAVAMUKUNDA HSS
            </h1>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white -mt-4">
              ARTS & SCIENCE ACHIEVEMENTS
            </h2>

            <p className="text-xl sm:text-2xl font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-3">
              <Calendar className="w-6 h-6 text-red-700" />
              Academic Year <span className='font-extrabold'>{selectedYear}–{selectedYear! + 1}</span>
            </p>

            {/* Year Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <span className="text-xl font-bold text-gray-800 dark:text-gray-200">View Year:</span>
              <div className="relative">
                <select
                  value={selectedYear || ''}
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

            {/* Tab Selector */}
            <div className="flex justify-center mt-12">
              <div className="inline-flex rounded-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-md p-2 shadow-xl border border-white/50 dark:border-gray-700/50">
                <button
                  onClick={() => setActiveTab('Kalolsavam')}
                  className={`flex items-center gap-3 px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 ${activeTab === 'Kalolsavam' ? 'bg-red-700 text-white shadow-lg' : 'text-gray-700 dark:text-gray-300 hover:bg-red-100/50 dark:hover:bg-gray-800/50'}`}
                >
                  <Palette className="w-6 h-6" /> Kalolsavam (Arts)
                </button>
                <button
                  onClick={() => setActiveTab('Sasthrosavam')}
                  className={`flex items-center gap-3 px-6 py-3 text-lg font-bold rounded-full transition-all duration-300 ${activeTab === 'Sasthrosavam' ? 'bg-green-700 text-white shadow-lg' : 'text-gray-700 dark:text-gray-300 hover:bg-green-100/50 dark:hover:bg-gray-800/50'}`}
                >
                  <FlaskConical className="w-6 h-6" /> Sasthrosavam (Science)
                </button>
              </div>
            </div>
          </header>

          {/* Animated Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              {/* Conditional rendering for No Records in the selected event */}
              {eventData.totalParticipants === 0 ? (
                <div className="py-20 text-center space-y-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-3xl shadow-xl border-4 border-yellow-500/50">
                    <Zap className="w-16 h-16 text-yellow-600 mx-auto" />
                    <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white">
                        No Records Found for {eventNameFull}
                    </h3>
                    <p className="text-xl text-gray-700 dark:text-gray-300">
                        The school has not yet registered any achievements for the {eventNameFull} in the {selectedYear}–{selectedYear! + 1} academic year.
                    </p>
                </div>
              ) : (
                <>
                  {renderFeaturedHero(eventData.achievements, activeTab, setSelectedAchievement)}

                  {/* Grade Summary Grid */}
                  <section className="mt-12">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto pt-6">
                      <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-3xl p-8 shadow-2xl border-b-8 border-yellow-700 transform hover:scale-[1.03] transition-transform duration-300">
                        <div className="text-6xl mb-3">🌟</div>
                        <div className="text-7xl font-black text-yellow-900 drop-shadow-md">{eventData.totalA}</div>
                        <div className="text-xl font-bold mt-3 text-yellow-800">TOTAL A GRADES</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-300 to-blue-500 rounded-3xl p-8 shadow-2xl border-b-8 border-blue-700 transform hover:scale-[1.03] transition-transform duration-300">
                        <div className="text-6xl mb-3">✨</div>
                        <div className="text-7xl font-black text-blue-900 drop-shadow-md">{eventData.totalB}</div>
                        <div className="text-xl font-bold mt-3 text-blue-800">TOTAL B GRADES</div>
                      </div>
                      <div className="bg-gradient-to-br from-red-300 to-red-500 rounded-3xl p-8 shadow-2xl border-b-8 border-red-700 transform hover:scale-[1.03] transition-transform duration-300">
                        <div className="text-6xl mb-3">💫</div>
                        <div className="text-7xl font-black text-red-900 drop-shadow-md">{eventData.totalC}</div>
                        <div className="text-xl font-bold mt-3 text-red-800">TOTAL C GRADES</div>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 pt-8 text-center">
                      Total Participants in {eventNameFull}: <span className='text-red-700'>{eventData.totalParticipants}</span>
                    </p>
                  </section>

                  {/* Achievements by School Section */}
                  <section className="pt-8">
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-center text-gray-900 dark:text-white mb-10 flex items-center justify-center gap-4">
                      <LayoutGrid className='w-8 h-8 text-red-700'/>
                      Achievements by School Section
                    </h2>
                    {renderSection('HSS', HSS)}
                    {renderSection('HS', HS)}
                    {renderSection('UP', UP)}
                  </section>

                  {/* Grade Tally Graph */}
                  <section className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-10 border-4 border-red-700/50 dark:border-red-700/50 mt-16">
                    <h3 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
                      Overall Grade Tally for {eventNameFull}
                    </h3>
                    <div className="h-64 sm:h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Grade A', count: eventData.totalA, fill: '#FFD700' },
                          { name: 'Grade B', count: eventData.totalB, fill: '#60A5FA' },
                          { name: 'Grade C', count: eventData.totalC, fill: '#DC2626' },
                        ]}>
                          <CartesianGrid strokeDasharray="6 6" stroke="#e5e7eb" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: '14px' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} labelStyle={{ fontWeight: 'bold' }} />
                          <Bar dataKey="count" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Footer />
      {selectedAchievement && <AchievementDetailDialog achievement={selectedAchievement} onClose={() => setSelectedAchievement(null)} />} {/* RENDER THE DIALOG */}
    </div>
  );
}