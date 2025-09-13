import { BookOpen, CheckCircle } from "lucide-react";

//Static Page

export default function AcademicsSection() {

  return (
    <section id="academics" className="py-20 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl font-bold text-foreground mb-4 "
            data-aos="fade-up"
            data-testid="academics-title"
          >
            {"Academic Excellence"}
          </h2>
          <p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="200"
            data-testid="academics-subtitle"
          >
            {"Comprehensive curriculum designed to foster critical thinking and lifelong learning"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div
            className="bg-background p-8 rounded-xl shadow-lg border border-border hover-lift"
            data-aos="slide-right"
            data-testid="upper-primary-card"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {"Upper Primary (5-7)"}
              </h3>
            </div>
            <p className="text-muted-foreground mb-4">
              {"Foundation building with emphasis on core subjects, creative thinking, and moral values. Malayalam medium instruction ensures cultural connection."}
            </p>
            <ul className="space-y-2 text-muted-foreground">
              
              <>
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
                  Art, Physical Education, Value Education
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Computer Basics
                </li>
              </>
              
            </ul>
          </div>

          <div
            className="bg-background p-8 rounded-xl shadow-lg border border-border hover-lift"
            data-aos="slide-left"
            data-testid="higher-secondary-card"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mr-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {"Higher Secondary (11-12)"}
              </h3>
            </div>
            <p className="text-muted-foreground mb-4">
              {"Advanced learning with specialization streams, preparing students for higher education and careers. Focus on analytical skills and practical knowledge."}
            </p>
            <ul className="space-y-2 text-muted-foreground">

              <>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-secondary rounded-full mr-3"></span>
                  Science Stream: Physics, Chemistry, Biology,Mathematics
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-secondary rounded-full mr-3"></span>
                  Commerce Stream: Business Studies, Accountancy
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-secondary rounded-full mr-3"></span>
                  Computer Science Stream:Computer Science, Physics, Chemistry, Maths
                </li>
              </>
            </ul>
          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div
            className="bg-background p-8 rounded-xl shadow-lg border border-border"
            data-testid="malayalam-medium"
          >
            <h3 className="text-2xl font-bold text-foreground mb-6">
              {"Malayalam Medium Instruction"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {"Our Malayalam medium education strengthens cultural roots while providing quality learning, ensuring students excel in both local and global contexts."}
            </p>
            <div className="space-y-3">

              <>
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
              </>

            </div>
          </div>
          <div
            className="bg-background p-8 rounded-xl shadow-lg border border-border hover-lift"
            data-aos="slide-left"
            data-testid="higher-secondary-card"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mr-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {"High School (8-10)"}
              </h3>
            </div>
            <p className="text-muted-foreground mb-4">
              {"Tackling SSLC with specialization streams, preparing students for +1 admission and education. Focus on SSLC Paper Solving Skills and also giving excellence to external activites."}
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-700 rounded-full mr-3"></span>
                  Completes SSLC Syllabus Within December
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-700 rounded-full mr-3"></span>
                  Complies Students To Workout Problems: Physics ,Maths ,Social science ,Biology
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-700 rounded-full mr-3"></span>
                  Excellent Teacher And Enviroment For Students Grow...
                </li>
              </>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}