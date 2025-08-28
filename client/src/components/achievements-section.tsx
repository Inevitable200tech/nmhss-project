import { CheckCircle, Play, Heart } from "lucide-react";

export default function AchievementsSection() {
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
        
        {/* Achievement Highlights */}
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
          
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift enhanced-card" data-aos="flip-left" data-aos-delay="300" data-testid="alumni-stat">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-white">500+</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Alumni Network</h3>
            <p className="text-sm text-muted-foreground">Successful Graduates</p>
          </div>
          
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift enhanced-card" data-aos="flip-left" data-aos-delay="400" data-testid="awards-stat">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-primary-foreground">25+</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Awards Won</h3>
            <p className="text-sm text-muted-foreground">Academic & Sports</p>
          </div>
        </div>
        
        {/* Featured Achievements */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-card p-8 rounded-xl shadow-lg border border-border hover-lift" data-testid="academic-achievement">
            <img 
              src="https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250" 
              alt="Academic achievement ceremony with awards" 
              className="rounded-lg mb-6 w-full" 
            />
            <h3 className="text-xl font-bold text-foreground mb-4">Academic Excellence</h3>
            <p className="text-muted-foreground mb-4">
              Our students consistently excel in board examinations, with many securing top ranks in district and state levels. The school's academic performance reflects our commitment to quality education.
            </p>
            <div className="flex items-center text-primary font-semibold">
              <CheckCircle className="w-4 h-4 mr-2" />
              District Toppers
            </div>
          </div>
          
          <div className="bg-card p-8 rounded-xl shadow-lg border border-border hover-lift" data-testid="sports-achievement">
            <img 
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250" 
              alt="Students celebrating sports victory" 
              className="rounded-lg mb-6 w-full" 
            />
            <h3 className="text-xl font-bold text-foreground mb-4">Sports Championships</h3>
            <p className="text-muted-foreground mb-4">
              Our athletes have brought glory to the school through victories in various inter-school and district-level sports competitions, showcasing talent beyond academics.
            </p>
            <div className="flex items-center text-secondary font-semibold">
              <Play className="w-4 h-4 mr-2" />
              Athletic Excellence
            </div>
          </div>
          
          <div className="bg-card p-8 rounded-xl shadow-lg border border-border hover-lift" data-testid="cultural-achievement">
            <img 
              src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250" 
              alt="Students performing in cultural event" 
              className="rounded-lg mb-6 w-full" 
            />
            <h3 className="text-xl font-bold text-foreground mb-4">Cultural Programs</h3>
            <p className="text-muted-foreground mb-4">
              Rich cultural heritage is preserved and promoted through various artistic programs, including traditional dance, music, and drama competitions at state level.
            </p>
            <div className="flex items-center text-accent font-semibold">
              <Heart className="w-4 h-4 mr-2" />
              Arts & Culture
            </div>
          </div>
        </div>
        
        {/* Success Stories */}
        <div className="bg-muted p-8 md:p-12 rounded-2xl" data-testid="success-stories">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center">Alumni Success Stories</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card p-6 rounded-xl shadow-lg border border-border" data-testid="alumni-story-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">DR</span>
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
      </div>
    </section>
  );
}
