'use client';

import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";

import {
  Loader2,
  Zap,
  GraduationCap,
  TrendingUp,
  Award,
  Clock,
  Users,
  BookOpen,
  X, // ADDED: Icon for the dialog close button
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Footer from "@/components/static-pages/footer";
import Navigation from "@/components/static-pages/navigation";

// --------------------------------------------------------------------
// 1. REAL TYPES (from backend)
// --------------------------------------------------------------------

type TopStudent = {
  name: string;
  aPlusCount: number;
  mediaId?: string;
  stream?: "Commerce" | "Science (Biology)" | "Computer Science";
};

type AcademicResult = {
  year: number;
  hsTotalAplusStudents: number;
  hsTotalMarkAverage: number;
  hssTotalAveragePercentage: number;
  hssCommerceAverage: number;
  hssScienceBiologyAverage: number;
  hssComputerScienceAverage: number;
  lastUpdated: string;
  topHSStudents: TopStudent[];
  topHSSStudents: TopStudent[];
};

// --------------------------------------------------------------------
// 2. REAL API HOOK
// --------------------------------------------------------------------

function useAcademicResults(year: number) {
  const [data, setData] = useState<AcademicResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [isLoadingYears, setIsLoadingYears] = useState(true);

  useEffect(() => {
    fetch("/api/academic-results/years")
      .then((r) => r.json())
      .then((data) => {
        setYears(data);
        setIsLoadingYears(false);
      })
      .catch(() => {
        setIsLoadingYears(false);
      });
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/academic-results/${year}`);
        if (!res.ok) throw new Error("Results not found for this year");

        const result: AcademicResult = await res.json();

        // Ensure arrays exist
        result.topHSStudents = result.topHSStudents || [];
        result.topHSSStudents = result.topHSSStudents || [];

        setData(result);
      } catch (err: any) {
        setError(err.message);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [year]);

  return { data, isLoading, error, years, isLoadingYears };
}

// --------------------------------------------------------------------
// 3. UI COMPONENTS – Updated for mediaId & onClick
// --------------------------------------------------------------------

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
    {children}
  </span>
);

interface StudentGridCardProps {
  name: string;
  aPlusCount: number;
  mediaId?: string;
  maxAplus: number;
  stream?: string;
  // NEW PROP
  onClick: () => void;
}

const StudentGridCard: React.FC<StudentGridCardProps> = ({
  name,
  aPlusCount,
  mediaId,
  maxAplus,
  stream,
  onClick, // ADDED
}) => {
  const imageUrl = mediaId
    ? `/api/media/${mediaId}`
    : `https://placehold.co/100x100/1E40AF/FFFFFF?text=${name.charAt(0)}`;

  return (
    <div 
      className="relative p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-transform duration-200 hover:scale-[1.02] border border-gray-100 dark:border-gray-700 cursor-pointer"
      onClick={onClick} // ADDED CLICK HANDLER
    >
      <img
        src={imageUrl}
        alt={name}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = `https://placehold.co/100x100/1E40AF/FFFFFF?text=${name.charAt(0)}`;
        }}
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-2 object-cover border-4 border-yellow-400 dark:border-yellow-500"
      />
      <p className="text-center font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
        {name}
      </p>
      {stream && (
        <p className="text-center text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
          {stream}
        </p>
      )}
      <div className="flex items-center justify-center mt-2">
        <Award className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
          {aPlusCount}/{maxAplus} A+
        </span>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-lg">
    <div className={`text-4xl ${color} mb-2`}>{icon}</div>
    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 uppercase font-medium mt-1">
      {label}
    </p>
  </div>
);

const AcademicSummaryCard: React.FC<{
  summary: AcademicResult;
  isLoading: boolean;
}> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/30 dark:border-gray-700/30">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  const {
    year,
    hsTotalAplusStudents,
    hsTotalMarkAverage,
    hssTotalAveragePercentage,
    lastUpdated,
    hssCommerceAverage,
    hssScienceBiologyAverage,
    hssComputerScienceAverage,
  } = summary;

  return (
    <div className="relative p-6 sm:p-10 md:p-12 mt-16 bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg rounded-3xl shadow-2xl border-t border-l border-white/60 dark:border-gray-700/50">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 text-center">
        Academic Performance: {year}
      </h2>
      <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-8">
        <Clock className="h-3 w-3 inline-block mr-1" />
        Last updated: {new Date(lastUpdated).toLocaleDateString()}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard icon={<Users />} label="HS Total A+ Students" value={hsTotalAplusStudents} color="text-red-600 dark:text-red-400" />
        <StatCard icon={<Zap />} label="HS Average Mark (%)" value={`${hsTotalMarkAverage.toFixed(1)}%`} color="text-teal-600 dark:text-teal-400" />
        <StatCard icon={<TrendingUp />} label="HSS Average Mark (%)" value={`${hssTotalAveragePercentage.toFixed(1)}%`} color="text-indigo-600 dark:text-indigo-400" />
        <StatCard icon={<GraduationCap />} label="Top Performing Year" value={year} color="text-yellow-600 dark:text-yellow-400" />
      </div>

      <div className="mt-8 pt-6 border-t border-white/50 dark:border-gray-700/50">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
          HSS Stream Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/70 dark:bg-gray-900/70 rounded-xl flex justify-between items-center shadow-md">
            <span className="font-medium text-gray-700 dark:text-gray-200">Commerce</span>
            <span className="font-bold text-lg text-pink-600 dark:text-pink-400">{hssCommerceAverage.toFixed(1)}%</span>
          </div>
          <div className="p-4 bg-white/70 dark:bg-gray-900/70 rounded-xl flex justify-between items-center shadow-md">
            <span className="font-medium text-gray-700 dark:text-gray-200">Science (Bio)</span>
            <span className="font-bold text-lg text-green-600 dark:text-green-400">{hssScienceBiologyAverage.toFixed(1)}%</span>
          </div>
          <div className="p-4 bg-white/70 dark:bg-gray-900/70 rounded-xl flex justify-between items-center shadow-md">
            <span className="font-medium text-gray-700 dark:text-gray-200">Computer Science</span>
            <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{hssComputerScienceAverage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------
// 4. MAIN PAGE
// --------------------------------------------------------------------

export default function AcademicResultsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data, isLoading, error, years, isLoadingYears } = useAcademicResults(year);

  // NEW TYPES AND STATE FOR DIALOG
  interface StudentDetail extends TopStudent {
    section: 'HS' | 'HSS';
    maxAplus: number;
  }
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);

  const groupStudents = (students: TopStudent[] = []) => {
    const grouped = students.reduce((acc, s) => {
      acc[s.aPlusCount] = acc[s.aPlusCount] || [];
      acc[s.aPlusCount].push(s);
      return acc;
    }, {} as Record<number, TopStudent[]>);

    return Object.entries(grouped)
      .map(([count, list]) => [parseInt(count, 10), list] as [number, TopStudent[]])
      .sort((a, b) => b[0] - a[0]);
  };

  const hsGrouped = groupStudents(data?.topHSStudents);
  const hssGrouped = groupStudents(data?.topHSSStudents);

  const streamPerformanceData = data
    ? [
      { name: "Commerce", percentage: data.hssCommerceAverage, fill: "#EC4899" },
      { name: "Science (Bio)", percentage: data.hssScienceBiologyAverage, fill: "#10B981" },
      { name: "Computer Science", percentage: data.hssComputerScienceAverage, fill: "#3B82F6" },
    ]
    : [];

  const maxPercentage = Math.max(...streamPerformanceData.map(d => d.percentage), 100);

  // NEW DIALOG COMPONENT
  const StudentDetailDialog = () => {
    if (!selectedStudent) return null;
    
    const { name, aPlusCount, section, maxAplus, stream, mediaId } = selectedStudent;
    const imageUrl = mediaId
        ? `/api/media/${mediaId}`
        : `https://placehold.co/150x150/1E40AF/FFFFFF?text=${name.charAt(0)}`;
        
    return (
        // Backdrop click handler
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedStudent(null)}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-100"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Student Details</h3>
                    <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex flex-col items-center space-y-4">
                    <img
                        src={imageUrl}
                        alt={name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://placehold.co/150x150/1E40AF/FFFFFF?text=${name.charAt(0)}`;
                        }}
                        className="w-28 h-28 rounded-full object-cover border-4 border-indigo-500 dark:border-indigo-400 shadow-md"
                    />
                    <h4 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center">{name}</h4>
                    
                    <div className="w-full space-y-3 pt-4">
                        <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Class Section:</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{section}</span>
                        </div>
                        {stream && (
                            <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Stream:</span>
                                <span className="font-bold text-teal-600 dark:text-teal-400 text-lg">{stream}</span>
                            </div>
                        )}
                        <div className="flex justify-between p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg border border-yellow-300 dark:border-yellow-700">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Total A+ Grades:</span>
                            <span className="font-bold text-2xl text-yellow-700 dark:text-yellow-400 flex items-center">
                                {aPlusCount} / {maxAplus} <Award className="h-6 w-6 ml-2 fill-yellow-600 dark:fill-yellow-400 text-yellow-600 dark:text-yellow-400" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };
  // END NEW DIALOG COMPONENT

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-inter">
      <Helmet>
        <title>Academic Results - NMHSS Thirunavaya</title>
        <meta name="description" content="View academic results and performance statistics of NMHSS Thirunavaya students. Explore year-wise results, top performers, and detailed analytics." />
        <meta name="keywords" content="academic results, exam results, NMHSS, Thirunavaya, student performance, top students" />
        <meta property="og:title" content="Academic Results - NMHSS Thirunavaya" />
        <meta property="og:description" content="View academic results and performance statistics of NMHSS Thirunavaya students." />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24 sm:pt-28">
        {/* Summary Card */}
        {data && <AcademicSummaryCard summary={data} isLoading={isLoading} />}

        {error && (
          <div className="text-center py-12 text-red-600 dark:text-red-400 font-medium text-xl">
            {error}
          </div>
        )}

        {/* Year Selector — Shows ALL years from database */}
        <div className="flex justify-center my-12">
          <div className="w-full max-w-md">
            <label className="block text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Academic Year
            </label>
            <Select value={year.toString()} onValueChange={(value) => setYear(Number(value))}>
              <SelectTrigger className="w-full h-12 text-lg font-semibold bg-white dark:bg-gray-800 border-2 shadow-lg hover:shadow-xl transition-shadow">
                <SelectValue placeholder="Choose a year..." />
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {years.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    {isLoading ? "Loading years..." : "No data available"}
                  </div>
                ) : (
                  years
                    .sort((a, b) => b - a) // Latest first
                    .map((y) => (
                      <SelectItem key={y} value={y.toString()} className="text-base font-medium">
                        {y} – {y + 1} Academic Year
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* HS Section */}
        <section className="mt-12">
          <h3 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center justify-center">
            <BookOpen className="h-6 w-6 mr-3" />
            High School (HS) Achievers
          </h3>

          {isLoading ? (
            <div className="text-center p-10">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
            </div>
          ) : hsGrouped.length === 0 ? (
            <p className="text-center text-gray-500">No HS toppers recorded for {year}</p>
          ) : (
            hsGrouped.map(([count, students]) => (
              <div key={count} className="mb-10 p-4 sm:p-6 bg-gray-100 dark:bg-gray-900/40 rounded-xl shadow-inner">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6 border-b border-gray-300 dark:border-gray-700 pb-3">
                  <h4 className="text-xl sm:text-2xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center space-x-2">
                    <Award className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    <span>{count} A+ Achievers</span>
                  </h4>
                  <Badge className="bg-rose-600 text-white dark:bg-rose-700 text-base">
                    Total: {students.length} Students
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {students.map((s, i) => (
                    <StudentGridCard
                      key={i}
                      name={s.name}
                      aPlusCount={s.aPlusCount}
                      mediaId={s.mediaId}
                      maxAplus={10}
                      onClick={() => setSelectedStudent({ ...s, section: 'HS', maxAplus: 10 })} // ADDED CLICK HANDLER
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        {/* HSS Section */}
        <section className="mt-16">
          <h3 className="text-3xl font-extrabold text-green-700 dark:text-green-400 mb-8 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 mr-3" />
            Higher Secondary (HSS) Performance Overview
          </h3>

          {/* Bar Chart */}
          <div className="mb-12 p-6 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 dark:border-gray-700/40">
            <h4 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
              Average Percentage by Stream ({year})
            </h4>

            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-green-600" />
              </div>
            ) : (
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={streamPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 14 }} angle={-20} textAnchor="end" height={80} />
                    <YAxis domain={[0, maxPercentage + 5]} tick={{ fill: "#666" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #ddd", borderRadius: "8px" }}
                      formatter={(v: number) => `${v.toFixed(1)}%`}
                    />
                    <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                      {streamPerformanceData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex justify-center gap-6 mt-6 flex-wrap">
              {streamPerformanceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.fill }}></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HSS Top Achievers */}
          <h4 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-6 text-center mt-12">
            Top HSS Achievers by A+ Grades
          </h4>

          {isLoading ? (
            <div className="text-center p-10">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
            </div>
          ) : hssGrouped.length === 0 ? (
            <p className="text-center text-gray-500">No HSS toppers recorded for {year}</p>
          ) : (
            hssGrouped.map(([count, students]) => (
              <div key={count} className="mb-10 p-4 sm:p-6 bg-gray-100 dark:bg-gray-900/40 rounded-xl shadow-inner">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6 border-b border-gray-300 dark:border-gray-700 pb-3">
                  <h4 className="text-xl sm:text-2xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center space-x-2">
                    <Award className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    <span>{count} A+ Achievers</span>
                  </h4>
                  <Badge className="bg-rose-600 text-white dark:bg-rose-700 text-base">
                    Total: {students.length} Students
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {students.map((s, i) => (
                    <StudentGridCard
                      key={i}
                      name={s.name}
                      aPlusCount={s.aPlusCount}
                      mediaId={s.mediaId}
                      maxAplus={6}
                      stream={s.stream}
                      onClick={() => setSelectedStudent({ ...s, section: 'HSS', maxAplus: 6 })} // ADDED CLICK HANDLER
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
      <Footer />
      {selectedStudent && <StudentDetailDialog />} {/* RENDER THE DIALOG */}
    </div>
  );
}