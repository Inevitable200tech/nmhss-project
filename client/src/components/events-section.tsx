import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock, FlaskConical, Dumbbell, Music, Users } from "lucide-react";
import type { ClientEvent, ClientNews } from "@shared/schema";

export default function EventsSection() {
  const [currentMonth, setCurrentMonth] = useState("January 2024");

  const { data: events = [], isLoading: eventsLoading } = useQuery<ClientEvent[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      return data.map((event: any) => ({
        ...event,
        date: new Date(event.date),
        createdAt: new Date(event.createdAt),
      }));
    },
  });

  const { data: news = [], isLoading: newsLoading } = useQuery<ClientNews[]>({
    queryKey: ["/api/news"],
    queryFn: async () => {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      return data.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }));
    },
  });

  if (eventsLoading || newsLoading) return <div>Loading...</div>;

  // Mock data for fallbacks
  const mockEvents: ClientEvent[] = [
    {
      id: "1",
      title: "Annual Science Exhibition",
      description: "Students showcase innovative projects and experiments",
      date: new Date("2024-01-15"),
      time: "9:00 AM - 3:00 PM",
      category: "academic",
      createdAt: new Date("2024-01-01"),
    },
    {
      id: "2",
      title: "Malayalam Literary Competition",
      description: "Poetry, essay writing, and storytelling contests",
      date: new Date("2024-01-22"),
      time: "10:00 AM - 2:00 PM",
      category: "cultural",
      createdAt: new Date("2024-01-01"),
    },
    {
      id: "3",
      title: "Sports Day Celebrations",
      description: "Annual athletic meet with track and field events",
      date: new Date("2024-02-05"),
      time: "8:00 AM - 4:00 PM",
      category: "sports",
      createdAt: new Date("2024-01-01"),
    },
  ];

  const mockNews: ClientNews[] = [
    {
      id: "1",
      title: "Admission Open for Academic Year 2024-25",
      content: "Admission forms are now available for grades 5-11. Interested parents can collect forms from the school office or download from our website. Last date for submission is February 28, 2024.",
      type: "announcement",
      createdAt: new Date("2024-01-10"),
    },
    {
      id: "2",
      title: "Student Wins State Level Science Competition",
      content: "Congratulations to Arjun Krishnan (Class 11) for securing first place in the Kerala State Science Olympiad. His innovative project on renewable energy solutions impressed the judges.",
      type: "news",
      createdAt: new Date("2024-01-08"),
    },
    {
      id: "3",
      title: "New Computer Lab Inaugurated",
      content: "The school has inaugurated a state-of-the-art computer laboratory with 15 new computers, enhancing digital learning opportunities for our students.",
      type: "update",
      createdAt: new Date("2024-01-05"),
    },
  ];

  const displayEvents = events.length > 0 ? events : mockEvents;
  const displayNews = news.length > 0 ? news : mockNews;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }).split(" ");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "academic":
        return <FlaskConical className="w-6 h-6 text-primary-foreground" />;
      case "sports":
        return <Dumbbell className="w-6 h-6 text-gray-200" />; {/* softened */}
      case "cultural":
        return <Music className="w-6 h-6 text-gray-200" />; {/* softened */}
      case "community":
        return <Users className="w-6 h-6 text-primary-foreground" />;
      default:
        return <FlaskConical className="w-6 h-6 text-primary-foreground" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "border-teal bg-teal-700";
      case "sports":
        return "border-red bg-red-700";
      case "cultural":
        return "border-black bg-black";
      case "community":
        return "border-primary bg-primary";
      default:
        return "border-primary bg-primary";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "announcement":
        return "bg-primary text-gray-200"; // softened text
      case "news":
        return "bg-secondary text-gray-200"; // softened text
      case "update":
        return "bg-accent text-gray-200"; // softened text
      default:
        return "bg-primary text-gray-200";
    }
  };

  return (
    <section id="events" className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            data-aos="fade-up"
            data-testid="events-title"
          >
            Upcoming Events
          </h2>
          <p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="200"
            data-testid="events-subtitle"
          >
            Stay updated with our academic calendar and exciting school activities
          </p>
        </div>

        {/* Current Month Events */}
        <div
          className="bg-card p-8 rounded-2xl shadow-lg border border-border mb-12"
          data-aos="slide-up"
          data-testid="events-calendar"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-foreground" data-testid="current-month">
              {currentMonth}
            </h3>
            <div className="flex space-x-2">
              <button
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                data-testid="previous-month"
                onClick={() => setCurrentMonth("December 2023")}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                data-testid="next-month"
                onClick={() => setCurrentMonth("February 2024")}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {displayEvents.map((event, index) => {
              const [month, day] = formatDate(new Date(event.date));
              return (
                <div
                  key={event.id || index}
                  className={`flex items-center p-4 bg-background rounded-lg border-l-4 ${getCategoryColor(event.category)} hover-lift`}
                  data-testid={`event-item-${index}`}
                >
                  <div
                    className={`flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center text-gray-200 mr-4 ${getCategoryColor(event.category)}`}
                  >
                    <span className="text-sm font-semibold">{month.toUpperCase()}</span>
                    <span className="text-lg font-bold">{day}</span>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-semibold text-gray-200 mb-1">{event.title}</h4>
                    <p className="text-sm text-gray-300">{event.description}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Categories (unchanged) */}
        <div className="grid md:grid-cols-4 gap-6 mb-12" data-aos="fade-up" data-testid="event-categories">
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              {getCategoryIcon("academic")}
            </div>
            <h4 className="font-semibold text-foreground mb-2">Academic</h4>
            <p className="text-sm text-muted-foreground">Exhibitions, competitions, assessments</p>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift">
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
              {getCategoryIcon("sports")}
            </div>
            <h4 className="font-semibold text-foreground mb-2">Sports</h4>
            <p className="text-sm text-muted-foreground">Athletic meets, tournaments, fitness</p>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
              {getCategoryIcon("cultural")}
            </div>
            <h4 className="font-semibold text-foreground mb-2">Cultural</h4>
            <p className="text-sm text-muted-foreground">Arts, music, dance, drama</p>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-lg border border-border text-center hover-lift">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              {getCategoryIcon("community")}
            </div>
            <h4 className="font-semibold text-foreground mb-2">Community</h4>
            <p className="text-sm text-muted-foreground">Parent meetings, social activities</p>
          </div>
        </div>

        {/* News & Announcements */}
        <div className="bg-muted p-8 md:p-12 rounded-2xl" data-aos="fade-up" data-testid="news-section">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center">
            Latest News & Announcements
          </h3>
          <div className="space-y-6">
            {displayNews.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-card p-6 rounded-xl shadow-lg border border-border hover-lift"
                data-testid={`news-item-${index}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center mb-2">
                      <span
                        className={`${getTypeColor(item.type)} text-xs font-semibold px-2 py-1 rounded mr-3`}
                      >
                        {item.type.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{item.title}</h4>
                    <p className="text-gray-300">{item.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
