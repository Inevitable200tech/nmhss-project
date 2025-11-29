import { Heart, GraduationCap, Trophy, Paintbrush } from "lucide-react";
import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';

// --- Interfaces inferred from schema.ts and routes.ts ---
interface AcademicResult {
  hssTotalAveragePercentage: number;
  topHSSStudents: any[];
}
interface Champion {
  name: string;
  photoUrl: string;
  event: string;
  featured: boolean;
}
// NEW INTERFACE: Includes category for dynamic complimentary text
interface ArtsChampion extends Champion {
  category: 'Arts' | 'Science';
}

interface SportsResult {
  champions: Champion[];
}
interface ArtsScienceResult {
  kalolsavam: { achievements: Champion[] };
  sasthrosavam: { achievements: Champion[] };
}
// ------------------------------------------

// Dynamically set the current year for the API endpoints
const CURRENT_YEAR = new Date().getFullYear();

export default function AchievementsSection() {
  // null: data received successfully but empty/no champion. undefined: initial loading state.
  const [hssAverageResult, setHssAverageResult] = useState<number | null | undefined>(undefined);
  const [sportsChampion, setSportsChampion] = useState<Champion | null | undefined>(undefined);
  // UPDATED STATE TYPE
  const [artsCultureChampion, setArtsCultureChampion] = useState<ArtsChampion | null | undefined>(undefined);

  useEffect(() => {
    // --- 1. Fetch Academic Excellence Average Result ---
    axios.get<AcademicResult>(`/api/academic-results/${CURRENT_YEAR}`)
      .then(response => {
        const average = response.data.hssTotalAveragePercentage;
        if (typeof average === 'number') setHssAverageResult(Math.round(average));
      })
      .catch(error => {
        console.error("Error fetching academic results:", error);
        setHssAverageResult(null);
      });

    // --- 2. Fetch Sports Champion Picture (Find FEATURED champion) ---
    axios.get<SportsResult>(`/api/sports-results/${CURRENT_YEAR}`)
      .then(response => {
        const featuredChampion = response.data.champions?.find(c => c.featured === true);
        setSportsChampion(featuredChampion || null);
      })
      .catch((error: AxiosError) => {
        console.error("Error fetching sports results:", error);
        if (error.response?.status === 404) {
          setSportsChampion(null);
        } else {
          setSportsChampion(null);
        }
      });

    // --- 3. Fetch Arts & Culture Champion Picture (Random selection of featured Arts or Science champion) ---
    axios.get<ArtsScienceResult>(`/api/arts-science-results/${CURRENT_YEAR}`)
      .then(response => {
        const kalolsavamChamps = response.data.kalolsavam?.achievements || [];
        const sasthrosavamChamps = response.data.sasthrosavam?.achievements || [];

        let champion: Champion | undefined;
        let category: 'Arts' | 'Science' | undefined;

        // 1. Identify all featured champions
        const featuredKalolsavam = kalolsavamChamps.find(c => c.featured === true);
        const featuredSasthrosavam = sasthrosavamChamps.find(c => c.featured === true);

        const featuredCandidates: ArtsChampion[] = [];

        if (featuredKalolsavam) {
          featuredCandidates.push({ ...featuredKalolsavam, category: 'Arts' });
        }
        if (featuredSasthrosavam) {
          featuredCandidates.push({ ...featuredSasthrosavam, category: 'Science' });
        }

        if (featuredCandidates.length > 0) {
          // Implement random selection between featured champions
          const randomIndex = Math.floor(Math.random() * featuredCandidates.length);
          const selectedFeaturedChampion = featuredCandidates[randomIndex];

          champion = selectedFeaturedChampion;
          category = selectedFeaturedChampion.category;

        } else {
          // FALLBACK: If no champion is explicitly featured, fall back to the first available (Kalolsavam then Sasthrosavam)
          champion = kalolsavamChamps[0] || sasthrosavamChamps[0];
          if (champion) {
            category = kalolsavamChamps[0] ? 'Arts' : 'Science';
          }
        }

        if (champion && category) {
          setArtsCultureChampion({ ...champion, category });
        } else {
          setArtsCultureChampion(null);
        }
      })
      .catch((error: AxiosError) => {
        console.error("Error fetching arts & science results:", error);
        if (error.response?.status === 404) {
          setArtsCultureChampion(null);
        } else {
          setArtsCultureChampion(null);
        }
      });
  }, []);

  // ----------------------------------------------------------------------
  // Helper Components for Card Rendering
  // ----------------------------------------------------------------------

  // Helper component for loading state/fallback
  const LoadingCard = ({ message }: { message: string }) => (
    // Loading card retains the same height/styling for layout consistency
    <div className="bg-card p-8 rounded-xl shadow-lg border border-border text-center flex items-center justify-center h-full min-h-[300px]">
      <p className="text-muted-foreground font-medium">{message}</p>
    </div>
  );

  // UPDATED ChampionCard to accept Href and render as an <a> tag
  const ChampionCard = ({ champion, title, icon: Icon, color, testId, href }: {
    champion: Champion | ArtsChampion | null | undefined,
    title: string,
    icon: React.ElementType,
    color: string,
    testId: string,
    href: string // ADDED Href PROP
  }) => {
    if (champion === undefined || champion === null) {
      // Loading and null states use the standard LoadingCard (a div)
      return <LoadingCard message={champion === undefined ? `Fetching latest ${title}...` : `No ${title} data found for ${CURRENT_YEAR}.`} />;
    }

    // Determine complimentary text
    let complimentaryText = "Showcasing the top student achievement in this competitive field.";

    if (title === "Sports Champion") {
      const isFeatured = champion.featured;
      complimentaryText = isFeatured
        ? "Recognizing the **featured** student for their outstanding athletic performance and dedication."
        : "Celebrating a top student for their athletic performance and dedication.";

    }
    // Logic for Arts & Culture
    else if (title === "Arts & Culture Champion" && 'category' in champion) {
      if (champion.category === 'Arts') {
        complimentaryText = "Celebrating the student who achieved the top rank in **Cultural (Kalolsavam)** events.";
      } else if (champion.category === 'Science') {
        complimentaryText = "Celebrating the student who achieved the top rank in **Science/Tech (Sasthrosavam)** events.";
      }
    }

    const imageUrl = champion.photoUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c7c5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

    return (
      // WRAPPED IN ANCHOR TAG (<a>) with full card styling and hover effect
      <a
        href={href}
        className="bg-card p-8 rounded-xl shadow-lg border border-border hover-lift enhanced-card flex flex-col min-h-[300px] hover:border-primary transition-all duration-300"
        data-testid={testId}
      >
        <img
          src={imageUrl}
          alt={`${champion.name} - ${title} Champion`}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
        <h4 className="text-xl font-bold text-foreground">{champion.name}</h4>
        <p className="text-sm text-muted-foreground mb-1">{champion.event}</p>
        {/* DYNAMIC COMPLIMENTARY TEXT */}
        <p className="text-xs text-muted-foreground mb-4 italic flex-grow" dangerouslySetInnerHTML={{ __html: complimentaryText }} />
        <div className={`flex items-center font-semibold text-${color} mt-auto`}>
          <Icon className="w-4 h-4 mr-2" /> {title}
        </div>
      </a>
    );
  };
  // ----------------------------------------------------------------------
  // Main Component Render
  // ----------------------------------------------------------------------

  return (
    <section id="achievements" className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-aos="fade-up" data-testid="achievements-title">
            Achievements & Success Stories
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="200" data-testid="achievements-subtitle">
            Celebrating 77 years of student excellence and community impact
          </p>
        </div>

        {/* Achievement Highlights (4 columns) - No Change */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift enhanced-card" data-aos="flip-left" data-aos-delay="100" data-testid="years-stat">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-foreground">77+</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Years of Excellence</h3>
            <p className="text-sm text-muted-foreground">Since 1946</p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift enhanced-card" data-aos="flip-left" data-aos-delay="200" data-testid="pass-rate-stat">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-white">95%</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Pass Rate</h3>
            <p className="text-sm text-muted-foreground">Board Examinations</p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift enhanced-card" data-aos="flip-left" data-aos-delay="300" data-testid="sports-stat">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">35+ State Titles</h3>
            <p className="text-sm text-muted-foreground">In Sports & Arts</p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift enhanced-card" data-aos="flip-left" data-aos-delay="400" data-testid="alumni-stat">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">10k+ Alumni</h3>
            <p className="text-sm text-muted-foreground">Global Network</p>
          </div>
        </div>

        {/* --- Academic, Arts, and Sports Achievements Section (All are now links) --- */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">

          {/* 1. Academic Excellence (HSS Average Result: N%) - NOW AN <a> LINK */}
          <a
            href="/academic-results" //  ACADEMIC RESULTS URL
            className="bg-card p-8 rounded-xl shadow-lg border border-border hover-lift enhanced-card text-center flex flex-col items-center justify-center min-h-[300px] hover:border-primary transition-all duration-300"
            data-testid="academic-achievement"
          >
            {hssAverageResult !== undefined ? (
              <>
                <div className={`w-36 h-36 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-primary/50`}>
                  <span className="text-5xl font-extrabold text-white" data-testid="hss-average-result">{hssAverageResult !== null ? `${hssAverageResult}%` : 'N/A'}</span>
                </div>
                <h4 className="text-2xl font-bold text-foreground mt-2">HSS Average Result</h4>
                <p className="text-md text-muted-foreground mb-4">Latest Board Exam ({CURRENT_YEAR})</p>
                <p className="text-md text-muted-foreground mb-4">A testament to the hard work and dedication of our students and the continuous guidance of our faculty</p>

                <div className={`flex items-center justify-center font-semibold text-primary mt-auto`}>
                  <GraduationCap className="w-4 h-4 mr-2" /> Academic Excellence
                </div>
              </>
            ) : (
              <LoadingCard message="Fetching HSS average result..." />
            )}
          </a>

          {/* 2. Arts & Culture Champion Picture (ChampionCard now renders as an <a> link) */}
          <ChampionCard
            champion={artsCultureChampion}
            title="Arts & Culture Champion"
            icon={Paintbrush}
            color="accent"
            testId="cultural-achievement"
            href="/arts-science" //ARTS/CULTURE RESULTS URL
          />

          {/* 3. Sports Champion Picture (ChampionCard now renders as an <a> link) */}
          <ChampionCard
            champion={sportsChampion}
            title="Sports Champion"
            icon={Trophy}
            color="secondary"
            testId="sports-achievement"
            href="/sports-champions" // SPORTS RESULTS URL
          />
        </div>

        {/* Alumni Stories Section (Kept as is) */}
        <div className="text-center mb-10 mt-20" data-aos="fade-up">
          <h3 className="text-3xl font-bold text-foreground mb-4">Alumni Stories</h3>
          <p className="text-lg text-muted-foreground">Inspiring journeys from our former students.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border" data-testid="alumni-story-1">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold">DA</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Dr. Alumni Success</h4>
                <p className="text-sm text-muted-foreground">Class of 1995</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              "Navamukunda HSS laid the foundation for my medical career. The values instilled here guided me to become a leading cardiologist. The school's emphasis on both academics and character building shaped my professional journey."
            </p>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border" data-testid="alumni-story-2">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold">PR</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Prof. Alumni Excellence</h4>
                <p className="text-sm text-muted-foreground">Class of 2002</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              "The Malayalam medium education didn't limit my horizons but strengthened my roots. Today, as a university professor, I credit my success to the solid foundation and cultural values I received at Navamukunda."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}