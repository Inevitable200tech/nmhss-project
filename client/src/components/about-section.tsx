import { Eye, Zap, Heart } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-aos="fade-up" data-testid="about-title">
            About Our School
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="200" data-testid="about-subtitle">
            Building futures through quality education and holistic development since 1946
          </p>
        </div>
        
        {/* Hero Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6" data-aos="fade-right">
            <h3 className="text-3xl font-bold text-foreground" data-testid="heritage-title">Our Heritage</h3>
            <p className="text-lg text-muted-foreground leading-relaxed" data-testid="heritage-description-1">
              Established in 1946, Navamukunda Higher Secondary School Thirunavaya has been a beacon of educational excellence in the rural landscape of Malappuram district, Kerala. For over seven decades, we have been committed to nurturing young minds and shaping the leaders of tomorrow.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed" data-testid="heritage-description-2">
              As a privately aided co-educational institution, we serve students from grades 5 to 12, providing quality education in Malayalam medium. Our school is strategically located in the TIRUR block, easily accessible by all-weather roads.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4" data-aos="fade-left">
            <img 
              src="https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
              alt="School buildings and courtyard" 
              className="rounded-xl shadow-lg hover-lift" 
              data-testid="school-building-image"
            />
            <img 
              src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
              alt="Students in school corridors" 
              className="rounded-xl shadow-lg hover-lift mt-8" 
              data-testid="students-corridor-image"
            />
          </div>
        </div>
        
        {/* Vision, Mission, Values */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-card p-8 rounded-xl shadow-lg border border-border hover-lift enhanced-card" data-aos="fade-up" data-aos-delay="100" data-testid="vision-card">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-6">
              <Eye className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Our Vision</h3>
            <p className="text-muted-foreground">
              To be a center of educational excellence that empowers students with knowledge, values, and skills to become responsible global citizens and leaders of tomorrow.
            </p>
          </div>
          
          <div className="bg-card p-8 rounded-xl shadow-lg border border-border hover-lift enhanced-card" data-aos="fade-up" data-aos-delay="200" data-testid="mission-card">
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Our Mission</h3>
            <p className="text-muted-foreground">
              To provide quality education that nurtures intellectual curiosity, promotes cultural values, and develops character while ensuring holistic development of every student.
            </p>
          </div>
          
          <div className="bg-card p-8 rounded-xl shadow-lg border border-border hover-lift enhanced-card" data-aos="fade-up" data-aos-delay="300" data-testid="values-card">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-6">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Our Values</h3>
            <p className="text-muted-foreground">
              Integrity, excellence, inclusivity, and innovation guide our educational approach, fostering an environment where every student can thrive and reach their full potential.
            </p>
          </div>
        </div>
        
        {/* Facilities Overview */}
        <div className="bg-muted p-8 md:p-12 rounded-2xl" data-aos="zoom-in" data-testid="facilities-section">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center">School Facilities</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center" data-testid="facility-classrooms">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">30</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Classrooms</h4>
              <p className="text-sm text-muted-foreground">Well-equipped learning spaces</p>
            </div>
            
            <div className="text-center" data-testid="facility-library">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-white">2.5K</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Library Books</h4>
              <p className="text-sm text-muted-foreground">Extensive collection of resources</p>
            </div>
            
            <div className="text-center" data-testid="facility-computers">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">25</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Computers</h4>
              <p className="text-sm text-muted-foreground">Modern computer laboratory</p>
            </div>
            
            <div className="text-center" data-testid="facility-restrooms">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">40</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Restrooms</h4>
              <p className="text-sm text-muted-foreground">Separate facilities for all</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
