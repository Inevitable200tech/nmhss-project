import { BookOpen, Globe, Calculator, FlaskConical, Users, Monitor } from "lucide-react";

export default function FacultySection() {
  return (
    <section id="faculty" className="py-20 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="faculty-title">
            Our Dedicated Faculty
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="faculty-subtitle">
            Experienced educators committed to nurturing young minds and fostering academic excellence
          </p>
        </div>
        
        {/* Faculty Statistics */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-background p-8 rounded-xl shadow-lg border border-border text-center hover-lift" data-testid="faculty-count">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-foreground">25+</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Qualified Teachers</h3>
            <p className="text-muted-foreground">Experienced and certified educators</p>
          </div>
          
          <div className="bg-background p-8 rounded-xl shadow-lg border border-border text-center hover-lift" data-testid="faculty-experience">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">15+</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Years Average Experience</h3>
            <p className="text-muted-foreground">Seasoned professionals in education</p>
          </div>
          
          <div className="bg-background p-8 rounded-xl shadow-lg border border-border text-center hover-lift" data-testid="faculty-departments">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">10+</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Departments</h3>
            <p className="text-muted-foreground">Specialized subject expertise</p>
          </div>
        </div>
        
        {/* Department Structure */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center" data-testid="departments-title">
            Academic Departments
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-background p-6 rounded-xl shadow-lg border border-border hover-lift" data-testid="malayalam-dept">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Malayalam Department</h4>
              <p className="text-sm text-muted-foreground">Literature, grammar, and cultural studies</p>
            </div>
            
            <div className="bg-background p-6 rounded-xl shadow-lg border border-border hover-lift" data-testid="english-dept">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">English Department</h4>
              <p className="text-sm text-muted-foreground">Language skills and global communication</p>
            </div>
            
            <div className="bg-background p-6 rounded-xl shadow-lg border border-border hover-lift" data-testid="math-dept">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Mathematics Department</h4>
              <p className="text-sm text-muted-foreground">Analytical thinking and problem solving</p>
            </div>
            
            <div className="bg-background p-6 rounded-xl shadow-lg border border-border hover-lift" data-testid="science-dept">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <FlaskConical className="w-6 h-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Science Department</h4>
              <p className="text-sm text-muted-foreground">Physics, Chemistry, Biology labs</p>
            </div>
            
            <div className="bg-background p-6 rounded-xl shadow-lg border border-border hover-lift" data-testid="social-dept">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Social Science</h4>
              <p className="text-sm text-muted-foreground">History, Geography, Political Science</p>
            </div>
            
            <div className="bg-background p-6 rounded-xl shadow-lg border border-border hover-lift" data-testid="computer-dept">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Computer Science</h4>
              <p className="text-sm text-muted-foreground">Programming, digital literacy, technology</p>
            </div>
          </div>
        </div>
        
        {/* Featured Faculty */}
        <div className="bg-muted p-8 md:p-12 rounded-2xl" data-testid="leadership-section">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center">Meet Our Leadership</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift" data-testid="principal-profile">
              <img 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300" 
                alt="School Principal" 
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" 
              />
              <h4 className="text-xl font-semibold text-foreground mb-2">Mrs. Leadership Principal</h4>
              <p className="text-secondary font-medium mb-2">Principal</p>
              <p className="text-sm text-muted-foreground mb-4">M.A., B.Ed., 25 years experience</p>
              <p className="text-sm text-muted-foreground">
                "Leading with vision to create an environment where every student can discover their potential and achieve excellence."
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift" data-testid="vice-principal-profile">
              <img 
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300" 
                alt="Vice Principal" 
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" 
              />
              <h4 className="text-xl font-semibold text-foreground mb-2">Mr. Leadership Vice</h4>
              <p className="text-secondary font-medium mb-2">Vice Principal</p>
              <p className="text-sm text-muted-foreground mb-4">M.Sc., B.Ed., 20 years experience</p>
              <p className="text-sm text-muted-foreground">
                "Dedicated to fostering academic excellence and character development through innovative teaching methodologies."
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift" data-testid="academic-head-profile">
              <img 
                src="https://images.unsplash.com/photo-1594824804584-dd32c48a0e5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300" 
                alt="Department Head" 
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" 
              />
              <h4 className="text-xl font-semibold text-foreground mb-2">Mrs. Leadership Academic</h4>
              <p className="text-secondary font-medium mb-2">Head of Academics</p>
              <p className="text-sm text-muted-foreground mb-4">M.A., M.Ed., 18 years experience</p>
              <p className="text-sm text-muted-foreground">
                "Committed to curriculum excellence and ensuring every student receives quality education that prepares them for the future."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
