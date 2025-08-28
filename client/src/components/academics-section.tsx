import { BookOpen, CheckCircle } from "lucide-react";

export default function AcademicsSection() {
  return (
    <section id="academics" className="py-20 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="academics-title">
            Academic Excellence
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="academics-subtitle">
            Comprehensive curriculum designed to foster critical thinking and lifelong learning
          </p>
        </div>
        
        {/* Grade Levels */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-background p-8 rounded-xl shadow-lg border border-border hover-lift" data-testid="upper-primary-card">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Upper Primary (5-7)</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Foundation building with emphasis on core subjects, creative thinking, and moral values. Malayalam medium instruction ensures cultural connection.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                Malayalam, English, Mathematics
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                Environmental Studies, Social Studies
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                Arts, Physical Education
              </li>
            </ul>
          </div>
          
          <div className="bg-background p-8 rounded-xl shadow-lg border border-border hover-lift" data-testid="secondary-card">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Secondary & Higher Secondary (8-12)</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Advanced curriculum preparing students for higher education and career opportunities with specialized streams and skill development.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-secondary rounded-full mr-3"></span>
                Science, Mathematics, Commerce streams
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-secondary rounded-full mr-3"></span>
                Computer Science, Languages
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-secondary rounded-full mr-3"></span>
                Practical Labs, Career Guidance
              </li>
            </ul>
          </div>
        </div>
        
        {/* Learning Resources */}
        <div className="bg-muted p-8 md:p-12 rounded-2xl mb-16" data-testid="learning-resources">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center">Learning Resources</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="library-resource">
              <img 
                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="School library with students studying" 
                className="rounded-xl shadow-lg mx-auto mb-6 hover-lift" 
              />
              <h4 className="text-xl font-semibold text-foreground mb-3">Rich Library</h4>
              <p className="text-muted-foreground">
                2,500+ books spanning literature, science, and reference materials supporting comprehensive learning across all subjects.
              </p>
            </div>
            
            <div className="text-center" data-testid="computer-resource">
              <img 
                src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="Computer laboratory with students" 
                className="rounded-xl shadow-lg mx-auto mb-6 hover-lift" 
              />
              <h4 className="text-xl font-semibold text-foreground mb-3">Computer Lab</h4>
              <p className="text-muted-foreground">
                25 functional computers with internet access, providing hands-on experience in digital literacy and programming.
              </p>
            </div>
            
            <div className="text-center" data-testid="meal-resource">
              <img 
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="Students enjoying nutritious school meal" 
                className="rounded-xl shadow-lg mx-auto mb-6 hover-lift" 
              />
              <h4 className="text-xl font-semibold text-foreground mb-3">Mid-Day Meals</h4>
              <p className="text-muted-foreground">
                Nutritious meals prepared on campus ensuring proper nutrition for better learning and overall student health.
              </p>
            </div>
          </div>
        </div>
        
        {/* Medium of Instruction & Special Features */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-background p-8 rounded-xl shadow-lg border border-border" data-testid="malayalam-medium">
            <h3 className="text-2xl font-bold text-foreground mb-6">Malayalam Medium Education</h3>
            <p className="text-muted-foreground mb-4">
              Our Malayalam medium instruction ensures students maintain strong connections with their cultural roots while receiving quality education. This approach enhances comprehension and learning outcomes.
            </p>
            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-accent mr-3" />
                <span className="text-muted-foreground">Cultural preservation and identity</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-accent mr-3" />
                <span className="text-muted-foreground">Enhanced learning comprehension</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-accent mr-3" />
                <span className="text-muted-foreground">Strong foundation in regional literature</span>
              </div>
            </div>
          </div>
          
          <div className="bg-background p-8 rounded-xl shadow-lg border border-border" data-testid="coeducational">
            <h3 className="text-2xl font-bold text-foreground mb-6">Co-Educational Environment</h3>
            <p className="text-muted-foreground mb-4">
              Our inclusive co-educational setting promotes gender equality, mutual respect, and collaborative learning, preparing students for real-world interactions.
            </p>
            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-accent mr-3" />
                <span className="text-muted-foreground">Equal opportunities for all students</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-accent mr-3" />
                <span className="text-muted-foreground">Collaborative learning environment</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-accent mr-3" />
                <span className="text-muted-foreground">Mutual respect and understanding</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
